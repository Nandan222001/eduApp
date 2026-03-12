# Deployment Scripts

This directory contains scripts for deploying and managing the FastAPI application on AWS.

## Scripts Overview

### deploy.sh
Main deployment script that handles the complete deployment process.

**Usage:**
```bash
./deploy.sh <environment>
```

**What it does:**
1. Builds Docker image
2. Pushes to ECR
3. Creates database backup (production only)
4. Runs database migrations
5. Updates ECS service
6. Invalidates CloudFront cache (production only)
7. Performs health check

**Example:**
```bash
./deploy.sh prod
```

### rollback.sh
Rolls back to a previous deployment version.

**Usage:**
```bash
./rollback.sh <environment> [revision]
```

**What it does:**
1. Creates database backup
2. Updates ECS service to previous task definition
3. Waits for stability
4. Performs health check

**Example:**
```bash
./rollback.sh prod        # Rollback to previous version
./rollback.sh prod 5      # Rollback to specific revision
```

### backup-database.sh
Creates manual database backup and manages retention.

**Usage:**
```bash
./backup-database.sh <environment>
```

**What it does:**
1. Creates RDS snapshot
2. Exports snapshot to S3
3. Tags snapshot with metadata
4. Deletes old snapshots (30+ days)

**Example:**
```bash
./backup-database.sh prod
```

### restore-database.sh
Restores database from a snapshot.

**Usage:**
```bash
./restore-database.sh <environment> <snapshot-id>
```

**What it does:**
1. Creates new RDS instance from snapshot
2. Configures with same settings as original
3. Provides new endpoint for testing

**Example:**
```bash
./restore-database.sh prod fastapi-app-prod-db-manual-20240101-120000
```

### health-check.sh
Comprehensive health check of all infrastructure components.

**Usage:**
```bash
./health-check.sh <environment>
```

**What it checks:**
1. ALB health and response time
2. ECS service and tasks
3. Target group health
4. RDS status
5. Redis status
6. CloudWatch alarms
7. API endpoints

**Example:**
```bash
./health-check.sh prod
```

### migrate.sh
Runs database migrations as an ECS task.

**Usage:**
```bash
./migrate.sh <environment>
```

**What it does:**
1. Gets VPC configuration
2. Runs migration task in ECS
3. Waits for completion
4. Shows logs on failure

**Example:**
```bash
./migrate.sh prod
```

### setup-ssl.sh
Sets up SSL certificates using Let's Encrypt.

**Usage:**
```bash
./setup-ssl.sh <domain> <email>
```

**What it does:**
1. Starts certbot container
2. Requests SSL certificate
3. Creates symlinks for Nginx
4. Reloads Nginx configuration

**Example:**
```bash
./setup-ssl.sh api.example.com admin@example.com
```

## Environment Variables

Required environment variables:
- `AWS_REGION`: AWS region (default: us-east-1)
- `PROJECT_NAME`: Project name (default: fastapi-app)

## Prerequisites

Before running these scripts:

1. **AWS CLI configured:**
   ```bash
   aws configure
   ```

2. **Docker installed:**
   ```bash
   docker --version
   ```

3. **Scripts executable:**
   ```bash
   chmod +x scripts/deployment/*.sh
   ```

4. **Infrastructure deployed:**
   - VPC and networking
   - ECS cluster
   - RDS database
   - ElastiCache Redis
   - ECR repository

## Common Workflows

### Initial Deployment
```bash
# 1. Deploy infrastructure
cd terraform
terraform apply

# 2. Deploy application
cd ..
./scripts/deployment/deploy.sh prod
```

### Update Application
```bash
# Build and deploy new version
./scripts/deployment/deploy.sh prod
```

### Rollback Deployment
```bash
# Rollback if deployment fails
./scripts/deployment/rollback.sh prod
```

### Regular Backup
```bash
# Create manual backup before major changes
./scripts/deployment/backup-database.sh prod
```

### Check System Health
```bash
# Verify all components are healthy
./scripts/deployment/health-check.sh prod
```

### Database Migration
```bash
# Run migrations after code changes
./scripts/deployment/migrate.sh prod
```

## Troubleshooting

### Script Fails with "Command not found"
```bash
# Make scripts executable
chmod +x scripts/deployment/*.sh
```

### AWS CLI Not Configured
```bash
# Configure AWS credentials
aws configure
```

### Permission Denied
```bash
# Check IAM permissions
aws sts get-caller-identity
```

### Docker Build Fails
```bash
# Check Docker is running
docker ps
```

### ECS Task Not Starting
```bash
# Check task logs
aws logs tail /ecs/fastapi-app-prod --follow
```

### Database Connection Error
```bash
# Verify security groups allow ECS to RDS
aws ec2 describe-security-groups --group-ids sg-xxx
```

## Safety Features

### Pre-deployment Checks
- Environment validation
- AWS authentication verification
- Resource availability check

### Backup Before Changes
- Database snapshots before deployment
- Task definition versions preserved
- Rollback capability maintained

### Health Monitoring
- Automatic health checks after deployment
- Service stability verification
- Alarm monitoring

### Failure Handling
- Automatic rollback on circuit breaker trigger
- Error logging and reporting
- Exit codes for automation

## Best Practices

1. **Always test in staging first:**
   ```bash
   ./scripts/deployment/deploy.sh staging
   ```

2. **Create backup before production deployment:**
   ```bash
   ./scripts/deployment/backup-database.sh prod
   ```

3. **Monitor deployment:**
   ```bash
   ./scripts/deployment/health-check.sh prod
   ```

4. **Keep rollback ready:**
   ```bash
   # Have rollback command ready
   ./scripts/deployment/rollback.sh prod
   ```

5. **Check logs after deployment:**
   ```bash
   aws logs tail /ecs/fastapi-app-prod --follow
   ```

## Automation

These scripts are designed to be used in CI/CD pipelines:

### GitHub Actions Example
```yaml
- name: Deploy to production
  run: |
    chmod +x scripts/deployment/deploy.sh
    ./scripts/deployment/deploy.sh prod
```

### GitLab CI Example
```yaml
deploy:
  script:
    - chmod +x scripts/deployment/deploy.sh
    - ./scripts/deployment/deploy.sh prod
```

### Jenkins Example
```groovy
stage('Deploy') {
    steps {
        sh 'chmod +x scripts/deployment/deploy.sh'
        sh './scripts/deployment/deploy.sh prod'
    }
}
```

## Support

For issues with deployment scripts:
1. Check script logs
2. Verify AWS permissions
3. Check CloudWatch Logs
4. Review DEPLOYMENT.md
5. Contact DevOps team
