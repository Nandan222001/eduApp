#!/bin/bash
set -e

# Rollback script for FastAPI application

# Configuration
ENVIRONMENT=${1:-staging}
TASK_DEFINITION_REVISION=${2}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="fastapi-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-service"
TASK_FAMILY="${PROJECT_NAME}-${ENVIRONMENT}"

log_info "Starting rollback for ${ENVIRONMENT} environment..."

# If no revision specified, use the previous one
if [ -z "$TASK_DEFINITION_REVISION" ]; then
    log_info "No revision specified, using previous revision..."
    
    # Get current task definition revision
    CURRENT_REVISION=$(aws ecs describe-services \
        --cluster ${CLUSTER_NAME} \
        --services ${SERVICE_NAME} \
        --query 'services[0].taskDefinition' \
        --output text | grep -oP '\d+$')
    
    TASK_DEFINITION_REVISION=$((CURRENT_REVISION - 1))
    log_info "Rolling back to revision ${TASK_DEFINITION_REVISION}"
fi

TASK_DEFINITION="${TASK_FAMILY}:${TASK_DEFINITION_REVISION}"

# Check if task definition exists
if ! aws ecs describe-task-definition --task-definition ${TASK_DEFINITION} &> /dev/null; then
    log_error "Task definition ${TASK_DEFINITION} not found"
    exit 1
fi

# Create database backup before rollback
if [ "$ENVIRONMENT" = "prod" ]; then
    log_info "Creating database backup before rollback..."
    SNAPSHOT_ID="${PROJECT_NAME}-${ENVIRONMENT}-rollback-$(date +%Y%m%d-%H%M%S)"
    aws rds create-db-snapshot \
        --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db \
        --db-snapshot-identifier ${SNAPSHOT_ID} \
        --region ${AWS_REGION}
    log_info "Database snapshot created: ${SNAPSHOT_ID}"
fi

# Update service with previous task definition
log_info "Updating service with task definition: ${TASK_DEFINITION}"
aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service ${SERVICE_NAME} \
    --task-definition ${TASK_DEFINITION} \
    --region ${AWS_REGION}

log_info "Waiting for service to stabilize..."
aws ecs wait services-stable \
    --cluster ${CLUSTER_NAME} \
    --services ${SERVICE_NAME} \
    --region ${AWS_REGION}

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
        log_error "Health check failed with status: ${HEALTH_STATUS}"
        exit 1
    fi
fi

log_info "Rollback completed successfully!"
log_info "Service is now running task definition: ${TASK_DEFINITION}"
