#!/bin/bash
set -e

# Database backup script

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="fastapi-app"
RETENTION_DAYS=${RETENTION_DAYS:-30}

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

DB_INSTANCE="${PROJECT_NAME}-${ENVIRONMENT}-db"
SNAPSHOT_ID="${DB_INSTANCE}-manual-$(date +%Y%m%d-%H%M%S)"
S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-backups"

log_info "Creating RDS snapshot for ${DB_INSTANCE}..."

# Create RDS snapshot
aws rds create-db-snapshot \
    --db-instance-identifier ${DB_INSTANCE} \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --region ${AWS_REGION}

log_info "Snapshot ${SNAPSHOT_ID} creation initiated"

# Wait for snapshot to complete
log_info "Waiting for snapshot to complete..."
aws rds wait db-snapshot-completed \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --region ${AWS_REGION}

log_info "Snapshot ${SNAPSHOT_ID} completed successfully"

# Tag snapshot
aws rds add-tags-to-resource \
    --resource-name arn:aws:rds:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):snapshot:${SNAPSHOT_ID} \
    --tags Key=Environment,Value=${ENVIRONMENT} Key=Type,Value=Manual Key=CreatedAt,Value=$(date -Iseconds) \
    --region ${AWS_REGION}

# Create logical backup using mysqldump via SSM
log_info "Creating logical backup using mysqldump..."
BACKUP_FILE="backup-${SNAPSHOT_ID}.sql.gz"

# Get DB endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${DB_INSTANCE} \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region ${AWS_REGION})

# Note: This requires an EC2 instance with SSM agent and network access to RDS
# Alternatively, use AWS Lambda or ECS task for backup operations
log_info "Logical backup requires ECS task or Lambda function with MySQL client"
log_info "To create logical backup, run: mysqldump -h ${DB_ENDPOINT} -u admin -p --all-databases | gzip > ${BACKUP_FILE}"

# Export snapshot to S3 (optional)
log_info "Exporting snapshot to S3..."
EXPORT_TASK_ID="${SNAPSHOT_ID}-export"
aws rds start-export-task \
    --export-task-identifier ${EXPORT_TASK_ID} \
    --source-arn arn:aws:rds:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):snapshot:${SNAPSHOT_ID} \
    --s3-bucket-name ${S3_BUCKET} \
    --s3-prefix database-exports/ \
    --iam-role-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/rds-s3-export-role \
    --kms-key-id alias/aws/rds \
    --region ${AWS_REGION} || log_info "Export task not available or failed"

# Clean up old snapshots
log_info "Cleaning up old snapshots (older than ${RETENTION_DAYS} days)..."
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)

OLD_SNAPSHOTS=$(aws rds describe-db-snapshots \
    --db-instance-identifier ${DB_INSTANCE} \
    --snapshot-type manual \
    --query "DBSnapshots[?SnapshotCreateTime<'${CUTOFF_DATE}'].DBSnapshotIdentifier" \
    --output text \
    --region ${AWS_REGION})

if [ -n "$OLD_SNAPSHOTS" ]; then
    for snapshot in $OLD_SNAPSHOTS; do
        log_info "Deleting old snapshot: ${snapshot}"
        aws rds delete-db-snapshot \
            --db-snapshot-identifier ${snapshot} \
            --region ${AWS_REGION}
    done
else
    log_info "No old snapshots to delete"
fi

# Verify snapshot
SNAPSHOT_STATUS=$(aws rds describe-db-snapshots \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --query 'DBSnapshots[0].Status' \
    --output text \
    --region ${AWS_REGION})

if [ "$SNAPSHOT_STATUS" = "available" ]; then
    log_info "Backup completed successfully!"
    log_info "Snapshot ID: ${SNAPSHOT_ID}"
    log_info "Status: ${SNAPSHOT_STATUS}"
else
    log_error "Backup failed! Status: ${SNAPSHOT_STATUS}"
    exit 1
fi

# List recent snapshots
log_info "Recent snapshots:"
aws rds describe-db-snapshots \
    --db-instance-identifier ${DB_INSTANCE} \
    --snapshot-type manual \
    --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
    --output table \
    --region ${AWS_REGION}
