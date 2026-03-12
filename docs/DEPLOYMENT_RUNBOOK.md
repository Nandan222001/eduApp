# Deployment Runbook

Complete deployment guide for the Educational SaaS Platform covering all environments and deployment scenarios.

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Production Deployment](#production-deployment)
5. [Staging Deployment](#staging-deployment)
6. [Database Migrations](#database-migrations)
7. [Rollback Procedures](#rollback-procedures)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring Setup](#monitoring-setup)
10. [Emergency Procedures](#emergency-procedures)

---

## 1. Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (ALB)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
┌────────▼─────────┐           ┌────────▼─────────┐
│  Application     │           │  Application     │
│  Server 1        │           │  Server 2        │
│  (EC2/ECS)       │           │  (EC2/ECS)       │
└────────┬─────────┘           └────────┬─────────┘
         │                              │
         └───────────────┬──────────────┘
                         │
         ┌───────────────┴──────────────┐
         │                              │
┌────────▼─────────┐           ┌────────▼─────────┐
│   PostgreSQL     │           │     Redis        │
│   (RDS)          │           │   (ElastiCache)  │
└──────────────────┘           └──────────────────┘
```

### Deployment Strategies

- **Blue-Green Deployment**: Zero-downtime deployments
- **Rolling Updates**: Gradual instance replacement
- **Canary Releases**: Phased rollout to subset of users

### Supported Platforms

- **AWS**: Primary cloud provider
- **Docker/Kubernetes**: Container orchestration
- **Traditional VPS**: Direct server deployment

---

## 2. Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing (unit, integration, e2e)
  ```bash
  poetry run pytest
  cd frontend && npm test
  ```

- [ ] Code linting passes
  ```bash
  poetry run ruff check src/
  poetry run black src/ --check
  poetry run mypy src/
  ```

- [ ] Security scan completed
  ```bash
  poetry run bandit -r src/
  npm audit
  ```

- [ ] Code review approved
- [ ] Version number updated in `pyproject.toml` and `package.json`
- [ ] CHANGELOG.md updated
- [ ] Release notes prepared

### Infrastructure Readiness

- [ ] Database backups verified
- [ ] SSL certificates valid (not expiring within 30 days)
- [ ] DNS records configured
- [ ] CDN cache cleared (if needed)
- [ ] Environment variables updated in secrets manager
- [ ] Resource limits checked (CPU, memory, storage)
- [ ] Third-party service status verified

### Communication

- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Maintenance window announced (if downtime expected)
- [ ] On-call engineer identified
- [ ] Rollback plan prepared

### Documentation

- [ ] Deployment steps documented
- [ ] Configuration changes documented
- [ ] Migration steps documented
- [ ] Monitoring alerts configured

---

## 3. Environment Setup

### Environment Variables

**Production (.env.production):**

```bash
# Application
APP_NAME="Educational Platform"
APP_ENV=production
DEBUG=False
SECRET_KEY=${SECRET_KEY_FROM_VAULT}

# Database
DATABASE_URL=${RDS_CONNECTION_STRING}
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Redis
REDIS_URL=${ELASTICACHE_CONNECTION_STRING}
REDIS_CACHE_TTL=3600

# JWT
JWT_SECRET_KEY=${JWT_SECRET_FROM_VAULT}
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# AWS
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY}
AWS_S3_BUCKET_NAME=edu-platform-prod
AWS_REGION=us-east-1

# Email
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=${SES_USERNAME}
SMTP_PASSWORD=${SES_PASSWORD}

# Sentry
SENTRY_DSN=${SENTRY_DSN}
SENTRY_ENVIRONMENT=production

# Celery
CELERY_BROKER_URL=${REDIS_URL}/1
CELERY_RESULT_BACKEND=${REDIS_URL}/2

# CORS
CORS_ORIGINS=["https://app.yourplatform.com"]
FRONTEND_URL=https://app.yourplatform.com
```

### AWS Infrastructure Setup

**1. Create VPC and Subnets:**

```bash
# Using AWS CLI
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

**2. Create RDS Instance:**

```bash
aws rds create-db-instance \
    --db-instance-identifier edu-platform-prod \
    --db-instance-class db.t3.medium \
    --engine postgres \
    --engine-version 14.7 \
    --master-username postgres \
    --master-user-password ${DB_PASSWORD} \
    --allocated-storage 100 \
    --storage-type gp3 \
    --vpc-security-group-ids sg-xxx \
    --db-subnet-group-name edu-platform-subnet-group \
    --backup-retention-period 7 \
    --multi-az
```

**3. Create ElastiCache Redis:**

```bash
aws elasticache create-cache-cluster \
    --cache-cluster-id edu-platform-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --security-group-ids sg-xxx \
    --cache-subnet-group-name edu-platform-cache-subnet
```

**4. Create S3 Bucket:**

```bash
aws s3 mb s3://edu-platform-prod
aws s3api put-bucket-versioning \
    --bucket edu-platform-prod \
    --versioning-configuration Status=Enabled
```

**5. Create Application Load Balancer:**

```bash
aws elbv2 create-load-balancer \
    --name edu-platform-alb \
    --subnets subnet-xxx subnet-yyy \
    --security-groups sg-xxx \
    --scheme internet-facing \
    --type application
```

### Using Terraform

**terraform/main.tf:**

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "edu-platform-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "edu-platform-vpc"
    Environment = "production"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier             = "edu-platform-prod"
  engine                 = "postgres"
  engine_version         = "14.7"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  username               = "postgres"
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  backup_retention_period = 7
  multi_az               = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "edu-platform-final-snapshot"

  tags = {
    Name        = "edu-platform-postgres"
    Environment = "production"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "edu-platform-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.main.name

  tags = {
    Name        = "edu-platform-redis"
    Environment = "production"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "storage" {
  bucket = "edu-platform-prod"

  tags = {
    Name        = "edu-platform-storage"
    Environment = "production"
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "edu-platform-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

**Deploy Infrastructure:**

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 4. Production Deployment

### Method 1: Docker Deployment with ECS

**1. Build Docker Images:**

```bash
# Build backend image
docker build -t edu-platform-backend:${VERSION} -f Dockerfile.prod .

# Build frontend image
docker build -t edu-platform-frontend:${VERSION} -f frontend/Dockerfile.prod ./frontend

# Tag images
docker tag edu-platform-backend:${VERSION} ${ECR_REPO}/backend:${VERSION}
docker tag edu-platform-frontend:${VERSION} ${ECR_REPO}/frontend:${VERSION}

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ECR_REPO}
docker push ${ECR_REPO}/backend:${VERSION}
docker push ${ECR_REPO}/frontend:${VERSION}
```

**2. Update ECS Task Definition:**

```json
{
  "family": "edu-platform-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${ECR_REPO}/backend:${VERSION}",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "APP_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/edu-platform-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**3. Deploy to ECS:**

```bash
# Register new task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update service (rolling update)
aws ecs update-service \
    --cluster edu-platform-cluster \
    --service edu-platform-backend \
    --task-definition edu-platform-backend:${VERSION} \
    --force-new-deployment

# Wait for deployment
aws ecs wait services-stable \
    --cluster edu-platform-cluster \
    --services edu-platform-backend
```

### Method 2: Traditional Server Deployment

**1. Connect to Server:**

```bash
ssh -i ~/.ssh/production-key.pem ubuntu@production-server
```

**2. Pull Latest Code:**

```bash
cd /var/www/edu-platform
git fetch origin
git checkout v${VERSION}
```

**3. Update Dependencies:**

```bash
# Backend
poetry install --no-dev

# Frontend
cd frontend
npm ci --production
npm run build
cd ..
```

**4. Run Migrations:**

```bash
poetry run alembic upgrade head
```

**5. Restart Services:**

```bash
sudo systemctl restart edu-platform-backend
sudo systemctl restart edu-platform-celery-worker
sudo systemctl restart edu-platform-celery-beat
sudo systemctl reload nginx
```

### Method 3: Kubernetes Deployment

**1. Update Kubernetes Manifests:**

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edu-platform-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: edu-platform-backend
  template:
    metadata:
      labels:
        app: edu-platform-backend
        version: ${VERSION}
    spec:
      containers:
      - name: backend
        image: ${ECR_REPO}/backend:${VERSION}
        ports:
        - containerPort: 8000
        env:
        - name: APP_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: edu-platform-secrets
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**2. Apply Changes:**

```bash
# Update secrets
kubectl create secret generic edu-platform-secrets \
    --from-env-file=.env.production \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy
kubectl apply -f k8s/

# Watch rollout
kubectl rollout status deployment/edu-platform-backend

# Verify
kubectl get pods
kubectl get services
```

---

## 5. Staging Deployment

### Automated CI/CD Pipeline

**GitHub Actions (.github/workflows/deploy-staging.yml):**

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install poetry
          poetry install
      
      - name: Run tests
        run: |
          poetry run pytest
          poetry run ruff check src/
      
      - name: Run security scan
        run: poetry run bandit -r src/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/edu-platform-backend:$IMAGE_TAG -f Dockerfile.prod .
          docker push $ECR_REGISTRY/edu-platform-backend:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster edu-platform-staging \
            --service edu-platform-backend \
            --force-new-deployment
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment completed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 6. Database Migrations

### Pre-Migration Steps

**1. Backup Database:**

```bash
# Create backup
pg_dump -h ${DB_HOST} -U ${DB_USER} -d edu_platform_prod > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
psql -h ${DB_HOST} -U ${DB_USER} -d edu_platform_test < backup_pre_migration_*.sql

# Store backup securely
aws s3 cp backup_pre_migration_*.sql s3://edu-platform-backups/$(date +%Y%m%d)/
```

**2. Test Migration on Staging:**

```bash
# Run on staging first
poetry run alembic upgrade head

# Verify
poetry run alembic current
psql -h staging-db -U postgres -d edu_platform_staging -c "\dt"
```

### Running Migrations

**Zero-Downtime Migration Strategy:**

```bash
# 1. Deploy backward-compatible code first
# Code that works with both old and new schema

# 2. Run migration
poetry run alembic upgrade head

# 3. Verify migration
poetry run alembic current

# 4. Deploy new code
# Code that uses new schema

# 5. Clean up old schema (after verification period)
poetry run alembic revision -m "cleanup_old_columns"
```

**Migration Script:**

```bash
#!/bin/bash
# migrate.sh

set -e

echo "Starting migration process..."

# Backup
echo "Creating backup..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Check current version
echo "Current migration version:"
alembic current

# Show pending migrations
echo "Pending migrations:"
alembic history

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Verify
echo "New migration version:"
alembic current

echo "Migration completed successfully!"
```

### Rollback Migration

```bash
# Rollback one version
poetry run alembic downgrade -1

# Rollback to specific version
poetry run alembic downgrade <revision_id>

# Restore from backup (if needed)
psql $DATABASE_URL < backup_20240115_120000.sql
```

---

## 7. Rollback Procedures

### Application Rollback

**ECS/Fargate:**

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix edu-platform-backend

# Rollback to previous version
aws ecs update-service \
    --cluster edu-platform-cluster \
    --service edu-platform-backend \
    --task-definition edu-platform-backend:${PREVIOUS_VERSION}
```

**Kubernetes:**

```bash
# Rollback deployment
kubectl rollout undo deployment/edu-platform-backend

# Rollback to specific revision
kubectl rollout undo deployment/edu-platform-backend --to-revision=2

# Check rollout history
kubectl rollout history deployment/edu-platform-backend
```

**Traditional Server:**

```bash
# Checkout previous version
git checkout v${PREVIOUS_VERSION}

# Reinstall dependencies
poetry install --no-dev
cd frontend && npm ci --production && cd ..

# Restart services
sudo systemctl restart edu-platform-backend
```

### Database Rollback

```bash
# Rollback migration
poetry run alembic downgrade -1

# Or restore from backup
psql $DATABASE_URL < backup_pre_migration_20240115.sql
```

### Full System Rollback Procedure

```bash
#!/bin/bash
# rollback.sh

VERSION=$1

echo "Rolling back to version $VERSION..."

# 1. Rollback application
echo "Rolling back application..."
kubectl rollout undo deployment/edu-platform-backend --to-revision=$VERSION

# 2. Rollback database (if needed)
read -p "Rollback database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Rolling back database..."
    alembic downgrade -1
fi

# 3. Clear caches
echo "Clearing caches..."
redis-cli FLUSHALL

# 4. Verify
echo "Verifying rollback..."
kubectl get pods
curl https://api.yourplatform.com/health

echo "Rollback completed!"
```

---

## 8. Post-Deployment Verification

### Health Checks

**1. API Health:**

```bash
# Check health endpoint
curl https://api.yourplatform.com/health

# Expected response:
# {
#   "status": "healthy",
#   "environment": "production",
#   "version": "0.1.0",
#   "database": "connected",
#   "redis": "connected"
# }
```

**2. Database Connectivity:**

```bash
psql $DATABASE_URL -c "SELECT version();"
```

**3. Redis Connectivity:**

```bash
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

### Smoke Tests

**Run Automated Smoke Tests:**

```bash
# Run smoke test suite
poetry run pytest tests/smoke/

# Key endpoints
curl -X POST https://api.yourplatform.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test@example.com", "password": "test123"}'

# Check critical features
curl https://api.yourplatform.com/api/v1/students?page=1&size=10
curl https://api.yourplatform.com/api/v1/assignments
```

### Performance Verification

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 https://api.yourplatform.com/health

# Response time check
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourplatform.com/api/v1/students
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
----------\n
time_total:  %{time_total}\n
```

### Monitoring Verification

```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value=edu-platform-backend \
    --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average

# Check error logs
kubectl logs -l app=edu-platform-backend --tail=100 | grep ERROR

# Check Sentry for new errors
# Visit Sentry dashboard
```

---

## 9. Monitoring Setup

### CloudWatch Alarms

```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name edu-platform-high-cpu \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:xxx:alerts

# Memory Utilization
aws cloudwatch put-metric-alarm \
    --alarm-name edu-platform-high-memory \
    --alarm-description "Alert when memory exceeds 80%" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:xxx:alerts

# Database Connections
aws cloudwatch put-metric-alarm \
    --alarm-name edu-platform-db-connections \
    --alarm-description "Alert when DB connections exceed threshold" \
    --metric-name DatabaseConnections \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions arn:aws:sns:us-east-1:xxx:alerts
```

### Application Monitoring

**Sentry Integration:**

```python
# src/middleware/sentry_middleware.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

def init_sentry():
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        integrations=[FastApiIntegration()],
    )
```

### Log Aggregation

**CloudWatch Logs Setup:**

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/edu-platform-backend

# Set retention
aws logs put-retention-policy \
    --log-group-name /ecs/edu-platform-backend \
    --retention-in-days 30
```

---

## 10. Emergency Procedures

### System Down

**Immediate Actions:**

1. **Check System Status:**
   ```bash
   curl https://api.yourplatform.com/health
   curl https://app.yourplatform.com
   ```

2. **Check Service Status:**
   ```bash
   kubectl get pods
   aws ecs describe-services --cluster edu-platform-cluster --services edu-platform-backend
   ```

3. **Check Logs:**
   ```bash
   kubectl logs -l app=edu-platform-backend --tail=100
   aws logs tail /ecs/edu-platform-backend --follow
   ```

4. **Rollback if Recent Deployment:**
   ```bash
   kubectl rollout undo deployment/edu-platform-backend
   ```

5. **Notify Stakeholders:**
   - Post status update
   - Send email notification
   - Update status page

### Database Emergency

**Database Connection Issues:**

```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier edu-platform-prod

# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Kill long-running queries
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND (now() - query_start) > interval '5 minutes';"
```

**Database Restore:**

```bash
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier edu-platform-restored \
    --db-snapshot-identifier edu-platform-snapshot-20240115

# Restore from manual backup
psql $DATABASE_URL < backup_20240115.sql
```

### Traffic Spike

**Scale Up:**

```bash
# ECS
aws ecs update-service \
    --cluster edu-platform-cluster \
    --service edu-platform-backend \
    --desired-count 10

# Kubernetes
kubectl scale deployment edu-platform-backend --replicas=10

# Enable auto-scaling
kubectl autoscale deployment edu-platform-backend --min=3 --max=20 --cpu-percent=70
```

### Security Incident

**Immediate Response:**

1. **Isolate Affected Systems:**
   ```bash
   # Block suspicious IPs
   aws wafv2 update-ip-set \
       --scope REGIONAL \
       --id xxx \
       --addresses 1.2.3.4/32
   ```

2. **Rotate Credentials:**
   ```bash
   # Rotate database password
   aws rds modify-db-instance \
       --db-instance-identifier edu-platform-prod \
       --master-user-password ${NEW_PASSWORD}
   
   # Rotate API keys
   # Update in secrets manager and restart services
   ```

3. **Enable Additional Logging:**
   ```bash
   # Enable query logging
   aws rds modify-db-parameter-group \
       --db-parameter-group-name edu-platform-params \
       --parameters "ParameterName=log_statement,ParameterValue=all,ApplyMethod=immediate"
   ```

4. **Investigate:**
   - Review audit logs
   - Check Sentry for errors
   - Review CloudWatch logs
   - Analyze access patterns

---

## Deployment Checklist Summary

### Before Deployment
- [ ] Code tested and reviewed
- [ ] Database backed up
- [ ] Stakeholders notified
- [ ] Rollback plan ready

### During Deployment
- [ ] Deploy to staging first
- [ ] Run migrations
- [ ] Deploy application
- [ ] Monitor deployment progress

### After Deployment
- [ ] Run smoke tests
- [ ] Verify health checks
- [ ] Monitor logs and metrics
- [ ] Notify stakeholders of completion

### If Issues Occur
- [ ] Stop deployment
- [ ] Assess impact
- [ ] Execute rollback if needed
- [ ] Investigate root cause
- [ ] Document incident

---

## Support Contacts

**On-Call Schedule:**
- Primary: DevOps Team Lead
- Secondary: Senior Backend Engineer
- Escalation: CTO

**External Services:**
- AWS Support: [AWS Support Center](https://console.aws.amazon.com/support/)
- Sentry: [Sentry Dashboard](https://sentry.io)
- Status Page: https://status.yourplatform.com

---

This deployment runbook should be reviewed and updated regularly as infrastructure and processes evolve.

**Last Updated:** January 2024  
**Version:** 1.0  
**Next Review:** April 2024
