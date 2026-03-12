# Deployment Quick Start Guide

Get your FastAPI application deployed to AWS in production in under 30 minutes.

## Prerequisites Checklist

- [ ] AWS account with admin access
- [ ] AWS CLI v2+ installed and configured
- [ ] Docker installed (v20+)
- [ ] Terraform v1.6+ installed (or use CloudFormation)
- [ ] Domain name and DNS access
- [ ] Git repository access

## Step 1: AWS Setup (5 minutes)

### 1.1 Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter region: us-east-1
# Enter output format: json
```

### 1.2 Create ACM Certificate
```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.example.com \
  --validation-method DNS \
  --region us-east-1

# Get validation records
aws acm describe-certificate \
  --certificate-arn <certificate-arn> \
  --region us-east-1

# Add DNS records to validate (in your DNS provider)
# Wait for validation (usually 5-10 minutes)
```

### 1.3 Create Terraform State Storage (if using Terraform)
```bash
# S3 bucket for state
aws s3 mb s3://fastapi-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket fastapi-terraform-state \
  --versioning-configuration Status=Enabled

# DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

## Step 2: Infrastructure Deployment (10 minutes)

### Option A: Using Terraform (Recommended)

```bash
# Navigate to terraform directory
cd terraform

# Copy and edit configuration
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edit with your values

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy infrastructure
terraform apply -auto-approve

# Save outputs
terraform output > ../terraform-outputs.txt
cd ..
```

### Option B: Using CloudFormation

```bash
# Deploy stack
aws cloudformation create-stack \
  --stack-name fastapi-app-prod \
  --template-body file://cloudformation/infrastructure.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=DBPassword,ParameterValue=$(openssl rand -base64 32) \
    ParameterKey=CertificateArn,ParameterValue=<your-cert-arn> \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for completion (10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name fastapi-app-prod \
  --region us-east-1

# Get outputs
aws cloudformation describe-stacks \
  --stack-name fastapi-app-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1 > cloudformation-outputs.json
```

## Step 3: Configure Secrets (2 minutes)

```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name fastapi-app-prod-secrets \
  --secret-string '{
    "secret_key": "'$(openssl rand -hex 32)'",
    "db_password": "'$(openssl rand -base64 32)'",
    "sendgrid_api_key": "YOUR_SENDGRID_API_KEY",
    "sentry_dsn": "YOUR_SENTRY_DSN",
    "aws_access_key_id": "YOUR_AWS_KEY",
    "aws_secret_access_key": "YOUR_AWS_SECRET"
  }' \
  --region us-east-1
```

## Step 4: Application Deployment (5 minutes)

### 4.1 Build and Push Docker Image
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -f Dockerfile.prod -t fastapi-app:latest .

# Tag and push
docker tag fastapi-app:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/fastapi-app-prod:latest
docker push \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/fastapi-app-prod:latest
```

### 4.2 Deploy Application
```bash
# Using deployment script
chmod +x scripts/deployment/deploy.sh
./scripts/deployment/deploy.sh prod

# OR manually update ECS
aws ecs update-service \
  --cluster fastapi-app-prod-cluster \
  --service fastapi-app-prod-service \
  --force-new-deployment \
  --region us-east-1
```

## Step 5: Run Database Migrations (2 minutes)

```bash
# Using script
chmod +x scripts/deployment/migrate.sh
./scripts/deployment/migrate.sh prod

# OR manually
aws ecs run-task \
  --cluster fastapi-app-prod-cluster \
  --task-definition fastapi-app-prod-migration \
  --launch-type FARGATE \
  --region us-east-1
```

## Step 6: Configure DNS (3 minutes)

```bash
# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names fastapi-app-prod-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text \
  --region us-east-1)

echo "ALB DNS: $ALB_DNS"

# Create DNS CNAME record in your DNS provider:
# Type: CNAME
# Name: api
# Value: <ALB_DNS>
# TTL: 300

# OR using Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$ALB_DNS'"}]
      }
    }]
  }'
```

## Step 7: Verify Deployment (3 minutes)

```bash
# Run health check
chmod +x scripts/deployment/health-check.sh
./scripts/deployment/health-check.sh prod

# Test endpoints
curl https://api.example.com/health
curl https://api.example.com/docs

# Check logs
aws logs tail /ecs/fastapi-app-prod --follow
```

## Step 8: Setup CI/CD (Optional, 5 minutes)

### Configure GitHub Actions

1. Add repository secrets:
   - Go to Settings > Secrets and Variables > Actions
   - Add: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DB_PASSWORD`, etc.

2. Push to main branch:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

3. Monitor deployment in Actions tab

## Verification Checklist

After deployment, verify:

- [ ] Application is accessible at https://api.example.com
- [ ] Health endpoint returns 200: https://api.example.com/health
- [ ] API docs accessible: https://api.example.com/docs
- [ ] ECS tasks are running (2+)
- [ ] Database is accessible from application
- [ ] Redis is accessible from application
- [ ] CloudWatch logs are being written
- [ ] SSL certificate is valid
- [ ] CloudFront is serving content (if configured)

## Quick Commands Reference

```bash
# Deploy
make deploy ENV=prod

# Rollback
make rollback ENV=prod

# Backup database
make backup ENV=prod

# Health check
make health ENV=prod

# View logs
make logs ENV=prod

# Run migrations
make migrate ENV=prod
```

## Common Issues

### Issue: ECS tasks fail to start
**Solution:**
```bash
# Check task logs
aws ecs describe-tasks --cluster fastapi-app-prod-cluster \
  --tasks $(aws ecs list-tasks --cluster fastapi-app-prod-cluster \
  --query 'taskArns[0]' --output text)

# Check security groups allow traffic
```

### Issue: Cannot connect to database
**Solution:**
```bash
# Verify security group allows ECS -> RDS
aws ec2 describe-security-groups \
  --group-ids <rds-sg-id> \
  --query 'SecurityGroups[0].IpPermissions'
```

### Issue: 502 Bad Gateway
**Solution:**
```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Verify health check path is correct
```

### Issue: SSL certificate error
**Solution:**
```bash
# Verify certificate is validated
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --query 'Certificate.Status'

# Check ALB listener has correct certificate
```

## Rollback Plan

If deployment fails:

```bash
# 1. Rollback application
./scripts/deployment/rollback.sh prod

# 2. Restore database if needed
./scripts/deployment/restore-database.sh prod <snapshot-id>

# 3. Verify health
./scripts/deployment/health-check.sh prod
```

## Next Steps

After successful deployment:

1. **Setup Monitoring**
   - Configure CloudWatch alarms
   - Setup SNS notifications
   - Integrate with Sentry

2. **Optimize Performance**
   - Enable CloudFront CDN
   - Configure auto-scaling
   - Optimize database queries

3. **Security Hardening**
   - Enable AWS WAF
   - Setup VPC Flow Logs
   - Configure AWS GuardDuty
   - Regular security scans

4. **Backup Strategy**
   - Schedule automated backups
   - Test restore procedures
   - Document recovery process

5. **Cost Optimization**
   - Review resource usage
   - Consider Reserved Instances
   - Implement lifecycle policies

## Support

Need help?
- Check DEPLOYMENT.md for detailed guide
- Review INFRASTRUCTURE.md for architecture details
- Check CloudWatch Logs for errors
- Review Terraform/CloudFormation outputs

## Estimated Costs

Approximate monthly AWS costs for minimal production setup:
- ECS Fargate (2 tasks): ~$30
- RDS (db.t3.micro): ~$15
- ElastiCache (cache.t3.micro): ~$12
- ALB: ~$20
- NAT Gateway: ~$35
- Data Transfer: ~$10
- CloudWatch Logs: ~$5
- **Total: ~$127/month**

Scale up for production workloads as needed.

## Success!

Your FastAPI application is now running in production on AWS! 🚀

Access your application:
- API: https://api.example.com
- Docs: https://api.example.com/docs
- Health: https://api.example.com/health
