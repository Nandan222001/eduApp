#!/bin/bash
set -e

# Database restore script

# Configuration
ENVIRONMENT=${1}
SNAPSHOT_ID=${2}
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

# Validate inputs
if [ -z "$ENVIRONMENT" ] || [ -z "$SNAPSHOT_ID" ]; then
    log_error "Usage: $0 <environment> <snapshot-id>"
    echo "Example: $0 staging fastapi-app-staging-db-manual-20240101-120000"
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(staging|prod)$ ]]; then
    log_error "Invalid environment. Use 'staging' or 'prod'"
    exit 1
fi

DB_INSTANCE="${PROJECT_NAME}-${ENVIRONMENT}-db"
NEW_DB_INSTANCE="${DB_INSTANCE}-restored-$(date +%Y%m%d-%H%M%S)"

log_warn "This will restore database from snapshot: ${SNAPSHOT_ID}"
log_warn "A new database instance will be created: ${NEW_DB_INSTANCE}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Verify snapshot exists
log_info "Verifying snapshot exists..."
if ! aws rds describe-db-snapshots \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --region ${AWS_REGION} &> /dev/null; then
    log_error "Snapshot ${SNAPSHOT_ID} not found"
    exit 1
fi

# Get original DB instance details
log_info "Getting original database configuration..."
ORIGINAL_DB_INFO=$(aws rds describe-db-instances \
    --db-instance-identifier ${DB_INSTANCE} \
    --region ${AWS_REGION})

DB_SUBNET_GROUP=$(echo $ORIGINAL_DB_INFO | jq -r '.DBInstances[0].DBSubnetGroup.DBSubnetGroupName')
VPC_SECURITY_GROUPS=$(echo $ORIGINAL_DB_INFO | jq -r '.DBInstances[0].VpcSecurityGroups[].VpcSecurityGroupId' | tr '\n' ' ')
DB_PARAMETER_GROUP=$(echo $ORIGINAL_DB_INFO | jq -r '.DBInstances[0].DBParameterGroups[0].DBParameterGroupName')

# Restore from snapshot
log_info "Restoring database from snapshot..."
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier ${NEW_DB_INSTANCE} \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --db-subnet-group-name ${DB_SUBNET_GROUP} \
    --vpc-security-group-ids ${VPC_SECURITY_GROUPS} \
    --db-parameter-group-name ${DB_PARAMETER_GROUP} \
    --publicly-accessible false \
    --multi-az true \
    --auto-minor-version-upgrade true \
    --enable-cloudwatch-logs-exports error general slowquery \
    --deletion-protection false \
    --region ${AWS_REGION}

log_info "Waiting for database to be available..."
aws rds wait db-instance-available \
    --db-instance-identifier ${NEW_DB_INSTANCE} \
    --region ${AWS_REGION}

# Get new endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${NEW_DB_INSTANCE} \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region ${AWS_REGION})

log_info "Database restored successfully!"
log_info "New instance: ${NEW_DB_INSTANCE}"
log_info "New endpoint: ${NEW_ENDPOINT}"
log_warn ""
log_warn "IMPORTANT: Next steps:"
log_warn "1. Update your application configuration with the new endpoint"
log_warn "2. Test the restored database thoroughly"
log_warn "3. If tests pass, you can:"
log_warn "   - Rename the restored instance to replace the original"
log_warn "   - Or update DNS/configuration to point to the new instance"
log_warn "4. Delete the old instance when no longer needed"
log_warn ""
log_info "To point application to new database:"
log_info "Update DATABASE_HOST environment variable to: ${NEW_ENDPOINT}"
log_info "Update DATABASE_URL to use mysql+pymysql:// scheme for Python applications"
