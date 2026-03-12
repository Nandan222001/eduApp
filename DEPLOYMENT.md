# Deployment Guide

This guide covers deploying the FastAPI application to AWS using either Terraform or CloudFormation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Deployment Methods](#deployment-methods)
- [Environment Configuration](#environment-configuration)
- [Database Backups](#database-backups)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

1. **AWS CLI** (v2+)
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Docker** (v20+)
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Terraform** (v1.6+) - if using Terraform
   ```bash
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

### AWS Setup

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

2. **Create S3 bucket for Terraform state** (if using Terraform):
   ```bash
   aws s3 mb s3://fastapi-terraform-state --region us-east-1
   aws s3api put-bucket-versioning --bucket fastapi-terraform-state --versioning-configuration Status=Enabled
   ```

3. **Create DynamoDB table for state locking** (if using Terraform):
   ```bash
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
     --region us-east-1
   ```

4. **Create ACM certificate:**
   ```bash
   aws acm request-certificate \
     --domain-name api.example.com \
     --validation-method DNS \
     --region us-east-1
   ```

## Infrastructure Setup

### Option 1: Using Terraform

1. **Navigate to terraform directory:**
   ```bash
   cd terraform
   ```

2. **Copy and configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

6. **Save outputs:**
   ```bash
   terraform output > ../outputs.txt
   ```

### Option 2: Using CloudFormation

1. **Deploy the infrastructure stack:**
   ```bash
   aws cloudformation create-stack \
     --stack-name fastapi-app-prod \
     --template-body file://cloudformation/infrastructure.yaml \
     --parameters \
       ParameterKey=Environment,ParameterValue=prod \
       ParameterKey=DBUsername,ParameterValue=postgres \
       ParameterKey=DBPassword,ParameterValue=YOUR_SECURE_PASSWORD \
       ParameterKey=CertificateArn,ParameterValue=YOUR_CERTIFICATE_ARN \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

2. **Wait for stack creation:**
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name fastapi-app-prod \
     --region us-east-1
   ```

3. **Get stack outputs:**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name fastapi-app-prod \
     --query 'Stacks[0].Outputs' \
     --region us-east-1
   ```

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

1. **Configure GitHub Secrets:**
   - Go to repository Settings > Secrets and Variables > Actions
   - Add the following secrets:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `DB_PASSWORD`
     - `SECRET_KEY`
     - `SENDGRID_API_KEY`
     - `SENTRY_DSN`
     - `CLOUDFRONT_DISTRIBUTION_ID`
     - `PRIVATE_SUBNETS`
     - `ECS_SECURITY_GROUP`
     - `SLACK_WEBHOOK` (optional)

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. **Monitor deployment:**
   - Go to Actions tab in GitHub
   - Watch the deployment workflow

### Method 2: Manual Deployment

1. **Build and push Docker image:**
   ```bash
   chmod +x scripts/deployment/deploy.sh
   ./scripts/deployment/deploy.sh prod
   ```

2. **Run database migrations:**
   ```bash
   aws ecs run-task \
     --cluster fastapi-app-prod-cluster \
     --task-definition fastapi-app-prod-migration \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
   ```

3. **Update ECS service:**
   ```bash
   aws ecs update-service \
     --cluster fastapi-app-prod-cluster \
     --service fastapi-app-prod-service \
     --force-new-deployment
   ```

### Method 3: Docker Compose (Development/Testing)

1. **Configure environment:**
   ```bash
   cp config/environments/.env.production .env.prod
   # Edit .env.prod with your values
   ```

2. **Start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Setup SSL certificates (using Let's Encrypt):**
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     -d api.example.com \
     --email admin@example.com \
     --agree-tos \
     --no-eff-email
   ```

## Environment Configuration

### Staging Environment

```bash
# Deploy to staging
./scripts/deployment/deploy.sh staging
```

### Production Environment

```bash
# Deploy to production (requires manual approval in GitHub Actions)
./scripts/deployment/deploy.sh prod
```

### Environment Variables

Managed through AWS Secrets Manager or Systems Manager Parameter Store:

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name fastapi-app-prod-secrets \
  --secret-string '{
    "secret_key": "YOUR_SECRET_KEY",
    "db_password": "YOUR_DB_PASSWORD",
    "sendgrid_api_key": "YOUR_SENDGRID_KEY",
    "sentry_dsn": "YOUR_SENTRY_DSN"
  }'
```

## Database Backups

### Automated Backups

AWS RDS automatically creates backups daily with 7-day retention.

### Manual Backups

```bash
# Create manual backup
chmod +x scripts/deployment/backup-database.sh
./scripts/deployment/backup-database.sh prod
```

### Restore from Backup

```bash
# Restore database
chmod +x scripts/deployment/restore-database.sh
./scripts/deployment/restore-database.sh prod SNAPSHOT_ID
```

### Backup to S3

Database backups are automatically exported to S3 bucket:
- Bucket: `fastapi-app-prod-backups`
- Retention: 365 days
- Transition to Glacier: 30 days

## Monitoring

### CloudWatch Dashboards

Access the CloudWatch dashboard:
```bash
aws cloudwatch get-dashboard \
  --dashboard-name fastapi-app-prod-dashboard
```

### Alarms

The following alarms are configured:
- ALB response time > 1s
- ALB 5XX errors > 10
- Unhealthy targets < 1
- ECS CPU > 80%
- ECS Memory > 80%
- RDS CPU > 80%
- RDS Storage < 5GB
- Redis CPU > 75%
- Redis Memory > 80%

### Logs

Access logs via CloudWatch Logs:
```bash
# View application logs
aws logs tail /ecs/fastapi-app-prod --follow

# View Nginx logs
aws logs tail /ecs/fastapi-app-prod-nginx --follow
```

### Sentry Integration

Application errors are automatically sent to Sentry. Configure `SENTRY_DSN` in environment variables.

## Rollback

### Automatic Rollback

ECS deployment circuit breaker automatically rolls back failed deployments.

### Manual Rollback

```bash
# Rollback to previous version
chmod +x scripts/deployment/rollback.sh
./scripts/deployment/rollback.sh prod

# Or specify a specific revision
./scripts/deployment/rollback.sh prod 5
```

## Scaling

### Manual Scaling

```bash
# Scale ECS service
aws ecs update-service \
  --cluster fastapi-app-prod-cluster \
  --service fastapi-app-prod-service \
  --desired-count 4
```

### Auto Scaling

Auto scaling is configured based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Request count per target (target: 1000)

Scheduled scaling:
- Scale down at 10 PM (minimum tasks)
- Scale up at 6 AM (full capacity)

## Troubleshooting

### Common Issues

1. **Deployment fails with 503 errors:**
   - Check ECS task health
   - Verify security group rules
   - Check ALB target group health

2. **Database connection errors:**
   - Verify RDS security group allows ECS tasks
   - Check database credentials in Secrets Manager
   - Ensure RDS instance is in available state

3. **High latency:**
   - Check CloudWatch metrics
   - Review RDS query performance
   - Check Redis cache hit rate
   - Consider scaling up ECS tasks

4. **SSL certificate errors:**
   - Verify ACM certificate is validated
   - Check ALB listener configuration
   - Ensure certificate domain matches

### Debug Commands

```bash
# Check ECS task status
aws ecs describe-tasks \
  --cluster fastapi-app-prod-cluster \
  --tasks $(aws ecs list-tasks --cluster fastapi-app-prod-cluster --query 'taskArns[0]' --output text)

# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn TARGET_GROUP_ARN

# View RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=fastapi-app-prod-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data
2. **Enable encryption** for RDS, S3, and EBS volumes
3. **Implement least privilege** IAM policies
4. **Enable VPC Flow Logs** for network monitoring
5. **Use AWS WAF** for web application firewall
6. **Enable CloudTrail** for audit logging
7. **Regular security patches** via automated ECS deployments
8. **Use private subnets** for application and database tiers

## Cost Optimization

1. **Use Fargate Spot** for non-critical workloads
2. **Implement auto-scaling** to match demand
3. **Use RDS Reserved Instances** for long-term savings
4. **Enable S3 lifecycle policies** for old data
5. **Use CloudFront** to reduce data transfer costs
6. **Monitor with AWS Cost Explorer**

## Support

For issues or questions:
- Check CloudWatch Logs
- Review Sentry error reports
- Contact DevOps team
- Create GitHub issue

## References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
