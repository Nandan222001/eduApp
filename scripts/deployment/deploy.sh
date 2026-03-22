#!/bin/bash
set -e

# Deployment script for FastAPI application to AWS ECS

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="fastapi-app"
ECR_REPOSITORY="${PROJECT_NAME}-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|prod)$ ]]; then
    log_error "Invalid environment. Use 'staging' or 'prod'"
    exit 1
fi

log_info "Starting deployment to ${ENVIRONMENT} environment..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    exit 1
fi

# Check if logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "Not authenticated with AWS. Run 'aws configure' first"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

log_info "AWS Account ID: ${AWS_ACCOUNT_ID}"
log_info "ECR Registry: ${ECR_REGISTRY}"

# Login to ECR
log_info "Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Generate image tag
IMAGE_TAG=$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

log_info "Building Docker image..."
docker build -f Dockerfile.prod -t ${IMAGE_URI} .

log_info "Tagging image as latest..."
docker tag ${IMAGE_URI} ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

log_info "Pushing image to ECR..."
docker push ${IMAGE_URI}
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

log_info "Image pushed: ${IMAGE_URI}"

# Create database backup before migrations (production only)
if [ "$ENVIRONMENT" = "prod" ]; then
    log_info "Creating database backup before migrations..."
    SNAPSHOT_ID="${PROJECT_NAME}-${ENVIRONMENT}-pre-migration-$(date +%Y%m%d-%H%M%S)"
    
    # Create RDS snapshot
    aws rds create-db-snapshot \
        --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db \
        --db-snapshot-identifier ${SNAPSHOT_ID} \
        --region ${AWS_REGION}
    
    log_info "Database snapshot initiated: ${SNAPSHOT_ID}"
    
    # Wait for snapshot to be available
    log_info "Waiting for snapshot to complete..."
    aws rds wait db-snapshot-completed \
        --db-snapshot-identifier ${SNAPSHOT_ID} \
        --region ${AWS_REGION}
    
    log_info "Database snapshot completed: ${SNAPSHOT_ID}"
    
    # Also create a logical backup for faster restore if needed
    log_info "Creating logical database backup..."
    BACKUP_DIR="backups/pre-migration-$(date +%Y%m%d-%H%M%S)"
    mkdir -p ${BACKUP_DIR}
    
    # Get DB connection details from parameter store or environment
    DB_HOST=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/db/host" --query 'Parameter.Value' --output text)
    DB_NAME=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/db/name" --query 'Parameter.Value' --output text)
    DB_USER=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/db/user" --query 'Parameter.Value' --output text)
    DB_PASS=$(aws ssm get-parameter --name "/${PROJECT_NAME}/${ENVIRONMENT}/db/password" --with-decryption --query 'Parameter.Value' --output text)
    
    # Create mysqldump backup (this requires mysqldump to be available)
    if command -v mysqldump &> /dev/null; then
        mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} --all-databases --single-transaction --routines --triggers > ${BACKUP_DIR}/backup.sql
        gzip ${BACKUP_DIR}/backup.sql
        
        # Upload to S3
        aws s3 cp ${BACKUP_DIR}/backup.sql.gz s3://${PROJECT_NAME}-${ENVIRONMENT}-backups/migrations/$(basename ${BACKUP_DIR})/backup.sql.gz
        log_info "Logical backup uploaded to S3"
    else
        log_warn "mysqldump not available, skipping logical backup"
    fi
fi

# Run database migrations
log_info "Running database migrations..."
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
MIGRATION_TASK_DEF="${PROJECT_NAME}-${ENVIRONMENT}-migration"
PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=*private*" "Name=tag:Environment,Values=${ENVIRONMENT}" \
    --query 'Subnets[*].SubnetId' \
    --output text | tr '\t' ',')
SECURITY_GROUP=$(aws ec2 describe-security-groups \
    --filters "Name=tag:Name,Values=*ecs*" "Name=tag:Environment,Values=${ENVIRONMENT}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

aws ecs run-task \
    --cluster ${CLUSTER_NAME} \
    --task-definition ${MIGRATION_TASK_DEF} \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${SECURITY_GROUP}]}" \
    --region ${AWS_REGION}

log_info "Waiting for migration task to complete..."
sleep 30

# Update ECS service
log_info "Updating ECS service..."
SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-service"
aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service ${SERVICE_NAME} \
    --force-new-deployment \
    --region ${AWS_REGION}

log_info "Waiting for service to stabilize..."
aws ecs wait services-stable \
    --cluster ${CLUSTER_NAME} \
    --services ${SERVICE_NAME} \
    --region ${AWS_REGION}

# Invalidate CloudFront cache (production only)
if [ "$ENVIRONMENT" = "prod" ]; then
    log_info "Invalidating CloudFront cache..."
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='${PROJECT_NAME}-${ENVIRONMENT}'].Id" \
        --output text)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation \
            --distribution-id ${DISTRIBUTION_ID} \
            --paths "/*"
        log_info "CloudFront cache invalidated"
    fi
fi

log_info "Deployment completed successfully!"
log_info "Image: ${IMAGE_URI}"
log_info "Cluster: ${CLUSTER_NAME}"
log_info "Service: ${SERVICE_NAME}"

# Health check
log_info "Performing health check..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names ${PROJECT_NAME}-${ENVIRONMENT}-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

if [ -n "$ALB_DNS" ]; then
    sleep 10
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${ALB_DNS}/health || echo "000")
    if [ "$HEALTH_STATUS" = "200" ]; then
        log_info "Health check passed!"
    else
        log_warn "Health check returned status: ${HEALTH_STATUS}"
    fi
fi

log_info "Deployment finished!"
