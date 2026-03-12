# FastAPI Deployment Infrastructure

Complete production-ready deployment infrastructure for FastAPI backend with AWS, Docker, Terraform, and automated CI/CD.

## 🚀 Quick Links

- **[Quick Start Guide](DEPLOYMENT_QUICKSTART.md)** - Deploy in 30 minutes
- **[Complete Deployment Guide](DEPLOYMENT.md)** - Detailed instructions
- **[Architecture Documentation](INFRASTRUCTURE.md)** - Infrastructure details
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - Pre-launch verification
- **[Implementation Summary](DEPLOYMENT_SUMMARY.md)** - What was built

## 📋 Overview

This deployment infrastructure provides:

- ✅ **Multi-stage Docker builds** - Optimized production images
- ✅ **Nginx reverse proxy** - SSL termination, rate limiting, compression
- ✅ **AWS Infrastructure** - VPC, ECS Fargate, RDS, ElastiCache, S3, CloudFront
- ✅ **Infrastructure as Code** - Terraform modules + CloudFormation alternative
- ✅ **Automated CI/CD** - GitHub Actions with testing and deployment
- ✅ **Auto-scaling** - CPU, memory, and request-based scaling
- ✅ **High Availability** - Multi-AZ deployment with automatic failover
- ✅ **Monitoring** - CloudWatch dashboards, alarms, and Sentry integration
- ✅ **Backup Strategy** - Automated daily backups with retention
- ✅ **Security** - Encryption, secrets management, least privilege IAM
- ✅ **Zero-downtime deployments** - Rolling updates with health checks

## 🏗️ Architecture

```
Internet → CloudFront CDN → ALB (HTTPS) → ECS Fargate (FastAPI) → RDS PostgreSQL
                                     ↓                          ↘
                                  Redis                         S3
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Compute** | ECS Fargate | Container orchestration |
| **Database** | RDS PostgreSQL 16 | Primary data store |
| **Cache** | ElastiCache Redis 7 | Caching layer |
| **Storage** | S3 | Static files, media, backups |
| **CDN** | CloudFront | Content delivery |
| **Load Balancer** | ALB | Traffic distribution, SSL |
| **Registry** | ECR | Docker images |
| **Monitoring** | CloudWatch | Metrics, logs, alarms |
| **Error Tracking** | Sentry | Application errors |

## 🛠️ Prerequisites

### Required Tools
- AWS CLI v2+
- Docker v20+
- Terraform v1.6+ (or use CloudFormation)
- Git

### AWS Requirements
- AWS account with admin access
- ACM certificate for your domain
- Configured AWS credentials

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Configure AWS
```bash
aws configure
```

### 3. Deploy Infrastructure

**Using Terraform:**
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply
```

**Using CloudFormation:**
```bash
aws cloudformation create-stack \
  --stack-name fastapi-app-prod \
  --template-body file://cloudformation/infrastructure.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_IAM
```

### 4. Deploy Application
```bash
# Using scripts
chmod +x scripts/deployment/deploy.sh
./scripts/deployment/deploy.sh prod

# Or using Makefile
make deploy ENV=prod
```

### 5. Verify Deployment
```bash
make health ENV=prod
```

**Done!** Your application is now running in production. 🎉

## 📁 Project Structure

```
├── Dockerfile.prod              # Production Docker image
├── docker-compose.prod.yml      # Production stack
├── Makefile                     # Convenient commands
│
├── nginx/                       # Nginx configuration
│   ├── Dockerfile
│   ├── nginx.conf
│   └── proxy_params
│
├── terraform/                   # Terraform IaC
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── vpc/
│       ├── ecs/
│       ├── rds/
│       └── ... (10 modules total)
│
├── cloudformation/              # CloudFormation alternative
│   └── infrastructure.yaml
│
├── .github/workflows/           # CI/CD pipelines
│   ├── deploy.yml
│   └── infrastructure.yml
│
├── scripts/deployment/          # Deployment scripts
│   ├── deploy.sh
│   ├── rollback.sh
│   ├── backup-database.sh
│   ├── restore-database.sh
│   ├── health-check.sh
│   ├── migrate.sh
│   └── setup-ssl.sh
│
└── config/environments/         # Environment configs
    ├── .env.staging
    └── .env.production
```

## 🔧 Common Commands

### Deployment
```bash
make deploy ENV=prod           # Deploy to production
make deploy ENV=staging        # Deploy to staging
make rollback ENV=prod         # Rollback deployment
```

### Database
```bash
make backup ENV=prod           # Create database backup
make restore ENV=prod          # Restore from backup
make migrate ENV=prod          # Run migrations
```

### Monitoring
```bash
make health ENV=prod           # Health check
make logs ENV=prod             # View logs
```

### Infrastructure
```bash
make tf-init                   # Initialize Terraform
make tf-plan                   # Preview changes
make tf-apply                  # Apply changes
```

## 🔐 Security

### Network Security
- VPC with public/private subnet isolation
- Security groups with least privilege
- Private subnets for databases and application
- NAT Gateways for controlled internet access

### Data Security
- Encryption at rest (RDS, Redis, S3)
- Encryption in transit (SSL/TLS everywhere)
- AWS Secrets Manager for credentials
- No secrets in code or environment variables

### Application Security
- Non-root container user
- Rate limiting via Nginx
- Security headers (CSP, HSTS, X-Frame-Options)
- CORS configuration
- Input validation

## 📊 Monitoring

### CloudWatch
- **Dashboards**: Real-time metrics visualization
- **Alarms**: 10+ pre-configured alarms
- **Logs**: Centralized application logs
- **Insights**: Query and analyze logs

### Metrics Monitored
- ALB response time and error rates
- ECS CPU and memory utilization
- RDS performance and connections
- Redis cache performance
- Target health status

### Alerting
- SNS notifications for critical alarms
- Slack integration (optional)
- Email notifications
- PagerDuty integration (optional)

## 💾 Backup & Recovery

### Automated Backups
- **RDS**: Daily snapshots, 7-day retention
- **Redis**: Daily snapshots, 5-day retention
- **S3**: Versioning enabled
- **Pre-deployment**: Automatic snapshots

### Manual Backups
```bash
make backup ENV=prod           # Create manual backup
```

### Restore Procedures
```bash
make restore ENV=prod          # Restore from backup
```

### Disaster Recovery
- **RTO**: < 1 hour
- **RPO**: < 15 minutes
- Multi-AZ deployment for automatic failover
- Documented recovery procedures

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

1. **Test** - Run tests, linting, type checking
2. **Build** - Build Docker image and push to ECR
3. **Scan** - Security vulnerability scanning
4. **Deploy Staging** - Automatic deployment to staging
5. **Deploy Production** - Manual approval required
6. **Notify** - Slack/email notifications

### Deployment Features
- Zero-downtime deployments
- Automatic rollback on failure
- Health check validation
- Database migration automation
- CloudFront cache invalidation

## 📈 Scaling

### Auto-Scaling Policies
- **CPU-based**: Target 70% utilization
- **Memory-based**: Target 80% utilization
- **Request-based**: Target 1000 requests/target
- **Scheduled**: Scale down at night, up in morning

### Scaling Ranges
- **Minimum**: 2 tasks
- **Maximum**: 10 tasks
- **Staging**: 1-3 tasks

### Manual Scaling
```bash
aws ecs update-service \
  --cluster fastapi-app-prod-cluster \
  --service fastapi-app-prod-service \
  --desired-count 4
```

## 💰 Cost Optimization

### Minimal Setup (~$127/month)
- Perfect for small applications
- Can handle moderate traffic
- Includes all core features

### Production Setup (~$300-500/month)
- Recommended for production workloads
- Higher performance and availability
- Includes reserved capacity discounts

### Cost Reduction Tips
- Use auto-scaling to match demand
- Implement S3 lifecycle policies
- Consider Reserved Instances/Savings Plans
- Monitor with AWS Cost Explorer
- Set up budget alerts

## 🧪 Testing

### Staging Environment
- Production-like configuration
- Test deployments before production
- Reduced capacity for cost savings

### Health Checks
```bash
make health ENV=staging
```

### Load Testing
- Use tools like Apache JMeter or Locust
- Test before production deployment
- Verify auto-scaling behavior

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Complete deployment guide |
| [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) | 30-minute quick start |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Architecture documentation |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Pre-launch checklist |
| [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) | Implementation summary |
| [scripts/deployment/README.md](scripts/deployment/README.md) | Script documentation |

## 🐛 Troubleshooting

### Common Issues

**ECS tasks not starting:**
```bash
aws ecs describe-tasks --cluster <cluster> --tasks <task-id>
aws logs tail /ecs/fastapi-app-prod --follow
```

**Database connection errors:**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

**SSL certificate issues:**
```bash
# Verify certificate status
aws acm describe-certificate --certificate-arn <arn>
```

**High response times:**
```bash
# Check metrics and scale if needed
make health ENV=prod
```

### Getting Help
1. Check CloudWatch Logs
2. Review Sentry error reports
3. Check DEPLOYMENT.md troubleshooting section
4. Open GitHub issue
5. Contact DevOps team

## 🔄 Rollback Procedures

### Automatic Rollback
- ECS circuit breaker automatically rolls back failed deployments
- Triggered by health check failures

### Manual Rollback
```bash
make rollback ENV=prod
```

### Rollback with Specific Revision
```bash
./scripts/deployment/rollback.sh prod 5
```

## 🎯 Best Practices

### Before Deployment
1. ✅ Test in staging environment
2. ✅ Create database backup
3. ✅ Review changes in Terraform plan
4. ✅ Notify team of deployment
5. ✅ Have rollback plan ready

### During Deployment
1. 👀 Monitor health checks
2. 👀 Watch CloudWatch metrics
3. 👀 Check error rates
4. 👀 Verify functionality

### After Deployment
1. ✅ Verify all services healthy
2. ✅ Check application logs
3. ✅ Test critical functionality
4. ✅ Monitor for 24 hours
5. ✅ Document any issues

## 🤝 Contributing

### Making Infrastructure Changes
1. Create feature branch
2. Make changes to Terraform/code
3. Test in staging environment
4. Create pull request
5. Get approval from team
6. Merge and deploy

### Updating Documentation
- Keep documentation up to date
- Add examples for new features
- Update version numbers
- Review quarterly

## 📞 Support

### Resources
- 📖 [Documentation](DEPLOYMENT.md)
- 💬 [GitHub Discussions](#)
- 🐛 [Issue Tracker](#)
- 📧 Email: devops@example.com

### Emergency Contacts
- On-call engineer: [PagerDuty/Phone]
- DevOps lead: [Contact info]
- AWS Support: [Support plan tier]

## 📜 License

[Your License Here]

## 🙏 Acknowledgments

Built with:
- FastAPI
- Docker
- Terraform
- AWS ECS Fargate
- PostgreSQL
- Redis
- Nginx

---

**Ready to deploy?** Start with the [Quick Start Guide](DEPLOYMENT_QUICKSTART.md)!

**Questions?** Check the [Complete Deployment Guide](DEPLOYMENT.md)!

**Need architecture details?** Read the [Infrastructure Documentation](INFRASTRUCTURE.md)!
