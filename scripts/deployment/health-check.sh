#!/bin/bash
set -e

# Health check script for deployed application

ENVIRONMENT=${1:-prod}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="fastapi-app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

log_info "Running health checks for ${ENVIRONMENT} environment..."

# Get ALB DNS
log_info "Checking ALB..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names ${PROJECT_NAME}-${ENVIRONMENT}-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region ${AWS_REGION} 2>/dev/null)

if [ -z "$ALB_DNS" ] || [ "$ALB_DNS" = "None" ]; then
    log_error "ALB not found"
    exit 1
fi

log_info "ALB DNS: ${ALB_DNS}"

# Check ALB health
log_info "Checking ALB health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${ALB_DNS}/health --max-time 10 || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log_info "✓ Health check passed (HTTP $HTTP_CODE)"
else
    log_error "✗ Health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Check ECS service
log_info "Checking ECS service..."
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-service"

SERVICE_INFO=$(aws ecs describe-services \
    --cluster ${CLUSTER_NAME} \
    --services ${SERVICE_NAME} \
    --region ${AWS_REGION})

RUNNING_COUNT=$(echo $SERVICE_INFO | jq -r '.services[0].runningCount')
DESIRED_COUNT=$(echo $SERVICE_INFO | jq -r '.services[0].desiredCount')
STATUS=$(echo $SERVICE_INFO | jq -r '.services[0].status')

log_info "ECS Service Status: ${STATUS}"
log_info "Running tasks: ${RUNNING_COUNT}/${DESIRED_COUNT}"

if [ "$RUNNING_COUNT" -ne "$DESIRED_COUNT" ]; then
    log_warn "Running count does not match desired count"
fi

# Check target health
log_info "Checking target group health..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names ${PROJECT_NAME}-${ENVIRONMENT}-tg \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text \
    --region ${AWS_REGION})

TARGET_HEALTH=$(aws elbv2 describe-target-health \
    --target-group-arn ${TARGET_GROUP_ARN} \
    --region ${AWS_REGION})

HEALTHY_COUNT=$(echo $TARGET_HEALTH | jq '[.TargetHealthDescriptions[] | select(.TargetHealth.State=="healthy")] | length')
TOTAL_COUNT=$(echo $TARGET_HEALTH | jq '.TargetHealthDescriptions | length')

log_info "Healthy targets: ${HEALTHY_COUNT}/${TOTAL_COUNT}"

if [ "$HEALTHY_COUNT" -eq 0 ]; then
    log_error "No healthy targets!"
    echo $TARGET_HEALTH | jq '.TargetHealthDescriptions'
    exit 1
fi

# Check RDS
log_info "Checking RDS..."
DB_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text \
    --region ${AWS_REGION})

log_info "RDS Status: ${DB_STATUS}"

if [ "$DB_STATUS" != "available" ]; then
    log_warn "RDS is not available"
fi

# Check Redis
log_info "Checking Redis..."
REDIS_STATUS=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id ${PROJECT_NAME}-${ENVIRONMENT}-redis \
    --query 'CacheClusters[0].CacheClusterStatus' \
    --output text \
    --region ${AWS_REGION})

log_info "Redis Status: ${REDIS_STATUS}"

if [ "$REDIS_STATUS" != "available" ]; then
    log_warn "Redis is not available"
fi

# Check CloudWatch alarms
log_info "Checking CloudWatch alarms..."
ALARM_COUNT=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix ${PROJECT_NAME}-${ENVIRONMENT} \
    --state-value ALARM \
    --query 'length(MetricAlarms)' \
    --output text \
    --region ${AWS_REGION})

if [ "$ALARM_COUNT" -gt 0 ]; then
    log_warn "${ALARM_COUNT} CloudWatch alarm(s) in ALARM state"
    aws cloudwatch describe-alarms \
        --alarm-name-prefix ${PROJECT_NAME}-${ENVIRONMENT} \
        --state-value ALARM \
        --query 'MetricAlarms[*].[AlarmName,StateReason]' \
        --output table \
        --region ${AWS_REGION}
else
    log_info "✓ No CloudWatch alarms in ALARM state"
fi

# Test API endpoints
log_info "Testing API endpoints..."

# Test root endpoint
ROOT_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${ALB_DNS}/ --max-time 10 || echo "000")
log_info "Root endpoint: HTTP ${ROOT_CODE}"

# Test docs endpoint
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${ALB_DNS}/docs --max-time 10 || echo "000")
log_info "Docs endpoint: HTTP ${DOCS_CODE}"

# Performance test
log_info "Running performance test..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://${ALB_DNS}/health --max-time 10 || echo "0")
log_info "Response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME > 2" | bc -l) )); then
    log_warn "Response time is high"
fi

# Summary
echo ""
log_info "=========================================="
log_info "Health Check Summary"
log_info "=========================================="
log_info "Environment: ${ENVIRONMENT}"
log_info "ALB: ${ALB_DNS}"
log_info "ECS Tasks: ${RUNNING_COUNT}/${DESIRED_COUNT}"
log_info "Healthy Targets: ${HEALTHY_COUNT}/${TOTAL_COUNT}"
log_info "RDS: ${DB_STATUS}"
log_info "Redis: ${REDIS_STATUS}"
log_info "Alarms: ${ALARM_COUNT} in ALARM state"
log_info "Response Time: ${RESPONSE_TIME}s"
log_info "=========================================="

if [ "$HTTP_CODE" = "200" ] && [ "$HEALTHY_COUNT" -gt 0 ] && [ "$DB_STATUS" = "available" ]; then
    log_info "✓ All health checks passed!"
    exit 0
else
    log_error "✗ Some health checks failed"
    exit 1
fi
