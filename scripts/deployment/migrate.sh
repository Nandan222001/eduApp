#!/bin/bash
set -e

# Database migration script

ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="fastapi-app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|prod)$ ]]; then
    log_error "Invalid environment. Use 'staging' or 'prod'"
    exit 1
fi

CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
TASK_FAMILY="${PROJECT_NAME}-${ENVIRONMENT}-migration"

log_info "Running database migrations for ${ENVIRONMENT} environment..."

# Get VPC configuration
log_info "Getting VPC configuration..."
PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=*private*" "Name=tag:Environment,Values=${ENVIRONMENT}" \
    --query 'Subnets[*].SubnetId' \
    --output text \
    --region ${AWS_REGION} | tr '\t' ',')

SECURITY_GROUP=$(aws ec2 describe-security-groups \
    --filters "Name=tag:Name,Values=*ecs*" "Name=tag:Environment,Values=${ENVIRONMENT}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region ${AWS_REGION})

if [ -z "$PRIVATE_SUBNETS" ] || [ -z "$SECURITY_GROUP" ]; then
    log_error "Could not find VPC configuration"
    exit 1
fi

log_info "Running migration task..."
TASK_ARN=$(aws ecs run-task \
    --cluster ${CLUSTER_NAME} \
    --task-definition ${TASK_FAMILY} \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${SECURITY_GROUP}]}" \
    --query 'tasks[0].taskArn' \
    --output text \
    --region ${AWS_REGION})

if [ -z "$TASK_ARN" ]; then
    log_error "Failed to start migration task"
    exit 1
fi

log_info "Migration task started: ${TASK_ARN}"
log_info "Waiting for task to complete..."

# Wait for task to complete
aws ecs wait tasks-stopped \
    --cluster ${CLUSTER_NAME} \
    --tasks ${TASK_ARN} \
    --region ${AWS_REGION}

# Check task exit code
EXIT_CODE=$(aws ecs describe-tasks \
    --cluster ${CLUSTER_NAME} \
    --tasks ${TASK_ARN} \
    --query 'tasks[0].containers[0].exitCode' \
    --output text \
    --region ${AWS_REGION})

if [ "$EXIT_CODE" = "0" ]; then
    log_info "Migration completed successfully!"
else
    log_error "Migration failed with exit code: ${EXIT_CODE}"
    
    # Get logs
    log_info "Fetching logs..."
    LOG_STREAM=$(aws ecs describe-tasks \
        --cluster ${CLUSTER_NAME} \
        --tasks ${TASK_ARN} \
        --query 'tasks[0].containers[0].name' \
        --output text \
        --region ${AWS_REGION})
    
    aws logs tail /ecs/${PROJECT_NAME}-${ENVIRONMENT} \
        --log-stream-names ${LOG_STREAM} \
        --format short \
        --region ${AWS_REGION}
    
    exit 1
fi
