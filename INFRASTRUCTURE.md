# Infrastructure Documentation

## Architecture Overview

The FastAPI application is deployed on AWS using a modern, scalable architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       CloudFront CDN                         │
│                  (Content Delivery Network)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Load Balancer                   │
│                      (SSL Termination)                       │
└─────────┬───────────────────────────────────┬───────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────┐                 ┌──────────────────┐
│  ECS Fargate     │                 │  ECS Fargate     │
│  (FastAPI App)   │                 │  (FastAPI App)   │
│  - Task 1        │                 │  - Task 2        │
└────┬─────────────┘                 └────┬─────────────┘
     │                                     │
     └───────────┬─────────────────────────┘
                 │
     ┌───────────┴──────────┬─────────────────┐
     │                      │                 │
     ▼                      ▼                 ▼
┌──────────┐          ┌──────────┐      ┌─────────┐
│   RDS    │          │  Redis   │      │   S3    │
│(PostgreSQL)         │(ElastiCache)    │(Storage)│
│Multi-AZ  │          │          │      │         │
└──────────┘          └──────────┘      └─────────┘
```

## Components

### 1. Networking Layer

#### VPC (Virtual Private Cloud)
- **CIDR**: 10.0.0.0/16
- **Availability Zones**: 2 (for high availability)
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24
  - Contains ALB, NAT Gateways
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24
  - Contains ECS tasks, RDS, ElastiCache

#### Internet Gateway
- Provides internet access for public subnets

#### NAT Gateways
- 2 NAT Gateways (one per AZ)
- Allows private subnets to access internet for updates

#### Security Groups
- **ALB Security Group**: Allows HTTP/HTTPS from internet
- **ECS Security Group**: Allows traffic from ALB on port 8000
- **RDS Security Group**: Allows PostgreSQL from ECS
- **Redis Security Group**: Allows Redis from ECS

### 2. Compute Layer

#### ECS Fargate Cluster
- **Service**: Runs FastAPI application containers
- **Task Definition**: Defines container configuration
- **CPU**: 512 units (configurable)
- **Memory**: 1024 MB (configurable)
- **Desired Count**: 2 tasks (minimum)
- **Auto Scaling**: 2-10 tasks based on CPU/Memory/Request count

#### Task Definition Features
- Health checks on /health endpoint
- CloudWatch logs integration
- Secrets management via AWS Secrets Manager
- Environment-based configuration
- Multi-stage Docker builds for optimization

#### Auto Scaling Policies
1. **CPU-based**: Target 70% utilization
2. **Memory-based**: Target 80% utilization
3. **Request-based**: Target 1000 requests per target
4. **Scheduled**: Scale down at night, up in morning

### 3. Load Balancing

#### Application Load Balancer (ALB)
- **Type**: Application Load Balancer
- **Scheme**: Internet-facing
- **Listeners**:
  - HTTP (80): Redirects to HTTPS
  - HTTPS (443): Forwards to target group
- **SSL/TLS**: ACM certificate with TLS 1.2+
- **Health Checks**: HTTP GET /health every 30s

#### Target Group
- **Protocol**: HTTP
- **Port**: 8000
- **Target Type**: IP (Fargate)
- **Deregistration Delay**: 30 seconds
- **Health Check**:
  - Path: /health
  - Interval: 30s
  - Timeout: 5s
  - Healthy threshold: 2
  - Unhealthy threshold: 3

### 4. Database Layer

#### RDS PostgreSQL
- **Engine**: PostgreSQL 16.1
- **Instance Class**: db.t3.micro (production: db.t3.small or higher)
- **Storage**: 20GB GP3 (auto-scaling enabled)
- **Multi-AZ**: Yes (production)
- **Backup**:
  - Automated daily backups
  - 7-day retention period
  - Backup window: 03:00-04:00 UTC
  - Manual snapshots supported
- **Encryption**: At-rest encryption enabled
- **Performance Insights**: Enabled (7-day retention)
- **CloudWatch Logs**: PostgreSQL logs exported
- **Connection Pooling**: Handled by application (SQLAlchemy)

#### Database Features
- Automated minor version upgrades
- Deletion protection enabled
- Parameter group optimizations
- Monitoring with CloudWatch alarms

### 5. Cache Layer

#### ElastiCache Redis
- **Engine**: Redis 7.0
- **Node Type**: cache.t3.micro (production: cache.t3.small or higher)
- **Nodes**: 1 (production: consider cluster mode)
- **Backup**:
  - Automated snapshots
  - 5-day retention period
  - Snapshot window: 03:00-05:00 UTC
- **Configuration**:
  - Max memory policy: allkeys-lru
  - Timeout: 300 seconds
  - Persistence: AOF enabled

### 6. Storage Layer

#### S3 Buckets

##### Static Files Bucket
- **Purpose**: Static assets, uploads
- **Versioning**: Enabled
- **Encryption**: AES-256
- **Public Access**: Allowed (via CloudFront)
- **CORS**: Configured for web access
- **Lifecycle**:
  - Move to IA after 90 days
  - Move to Glacier after 180 days

##### Media Files Bucket
- **Purpose**: User-generated content
- **Versioning**: Enabled
- **Encryption**: AES-256
- **Public Access**: Blocked (presigned URLs)

##### Backups Bucket
- **Purpose**: Database backups, exports
- **Versioning**: Enabled
- **Encryption**: AES-256
- **Lifecycle**:
  - Move to Glacier after 30 days
  - Delete after 365 days

### 7. CDN Layer

#### CloudFront Distribution
- **Origin**: ALB for dynamic content, S3 for static
- **SSL/TLS**: TLS 1.2 minimum
- **Caching**:
  - Static files: 1 day default, 1 year max
  - API endpoints: No cache
  - Media files: 1 hour default
- **Compression**: Gzip and Brotli enabled
- **Custom Errors**: 404 and 500 pages
- **Geo-restriction**: None (configurable)

### 8. Container Registry

#### ECR (Elastic Container Registry)
- **Repository**: fastapi-app-{environment}
- **Image Scanning**: Enabled on push
- **Encryption**: AES-256
- **Lifecycle Policy**:
  - Keep last 10 tagged images
  - Delete untagged images after 7 days

### 9. Monitoring & Logging

#### CloudWatch Logs
- **Log Groups**:
  - /ecs/fastapi-app-{env} (application logs)
  - /ecs/fastapi-app-{env}-nginx (nginx logs)
- **Retention**: 30 days
- **Insights**: Available for query and analysis

#### CloudWatch Alarms
- ALB response time > 1 second
- ALB 5XX errors > 10
- Unhealthy targets < 1
- ECS CPU > 80%
- ECS Memory > 80%
- RDS CPU > 80%
- RDS Storage < 5GB
- RDS Connections > 80
- Redis CPU > 75%
- Redis Memory > 80%

#### CloudWatch Dashboard
Custom dashboard with:
- ALB metrics (response time, requests, errors)
- ECS metrics (CPU, memory, task count)
- RDS metrics (CPU, connections, storage)
- Redis metrics (CPU, memory, cache hits)

#### Sentry Integration
- Error tracking and performance monitoring
- Release tracking
- Source maps support
- Configurable sample rates

### 10. Security

#### IAM Roles
- **ECS Task Execution Role**: Pull images, write logs
- **ECS Task Role**: Access S3, Secrets Manager
- **RDS Enhanced Monitoring Role**: CloudWatch metrics

#### Secrets Management
- **AWS Secrets Manager**: Database credentials, API keys
- **Environment Variables**: Non-sensitive configuration
- **Parameter Store**: Application configuration

#### Network Security
- Private subnets for application and data tiers
- Security groups with least privilege
- No direct internet access for private resources
- SSL/TLS encryption in transit
- Encryption at rest for all data stores

#### Compliance Features
- VPC Flow Logs (optional)
- CloudTrail logging (recommended)
- AWS Config rules (optional)
- GuardDuty threat detection (optional)

### 11. Backup Strategy

#### Automated Backups
1. **RDS**: Daily automated snapshots, 7-day retention
2. **Redis**: Daily snapshots, 5-day retention
3. **S3**: Versioning enabled on all buckets

#### Manual Backups
- Pre-deployment database snapshots
- On-demand RDS snapshots
- Export to S3 for long-term storage

#### Disaster Recovery
- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 15 minutes
- Multi-AZ deployment for automatic failover
- Point-in-time recovery available
- Cross-region backup replication (optional)

### 12. Cost Optimization

#### Resource Right-Sizing
- Start with minimal resources (t3.micro)
- Monitor and scale based on actual usage
- Use Fargate Spot for non-critical workloads

#### Storage Optimization
- S3 lifecycle policies for old data
- RDS storage auto-scaling
- Delete old snapshots automatically

#### Network Optimization
- CloudFront caching reduces origin requests
- NAT Gateways data transfer optimization
- VPC endpoints for AWS services (optional)

#### Reserved Capacity
- RDS Reserved Instances for long-term savings
- Savings Plans for consistent ECS usage
- Commit to 1-year or 3-year terms

#### Cost Monitoring
- AWS Cost Explorer
- Budget alerts
- Resource tagging for cost allocation

## Deployment Environments

### Development
- Minimal resources
- Single AZ
- Smaller instance types
- No CloudFront
- Local Docker Compose option

### Staging
- Production-like configuration
- Reduced capacity
- Single NAT Gateway
- Testing SSL certificates
- Pre-production validation

### Production
- Full redundancy
- Multi-AZ deployment
- Auto-scaling enabled
- CloudFront CDN
- Enhanced monitoring
- Automated backups

## Scaling Considerations

### Horizontal Scaling
- ECS auto-scaling (2-10 tasks)
- Multi-AZ for high availability
- ALB distributes traffic evenly

### Vertical Scaling
- Increase task CPU/Memory
- Upgrade RDS instance class
- Upgrade Redis node type

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling
- Query optimization
- Caching strategy

### Performance Optimization
- CloudFront CDN for static content
- Redis caching for database queries
- Connection pooling
- Async operations with Celery

## High Availability

### Multi-AZ Architecture
- Subnets in 2+ availability zones
- RDS Multi-AZ automatic failover
- Multiple NAT Gateways
- ECS tasks distributed across AZs

### Health Checks
- ALB health checks every 30s
- ECS container health checks
- Automatic task replacement on failure

### Circuit Breakers
- ECS deployment circuit breaker
- Automatic rollback on failures
- Blue/green deployments supported

## Maintenance Windows

### Scheduled Maintenance
- **RDS**: Monday 04:00-05:00 UTC
- **Redis**: Sunday 05:00-07:00 UTC
- **Auto-scaling**: Reduced capacity 22:00-06:00 UTC

### Backup Windows
- **RDS**: Daily 03:00-04:00 UTC
- **Redis**: Daily 03:00-05:00 UTC

## Infrastructure as Code

### Terraform Modules
- VPC and networking
- Security groups
- RDS database
- ElastiCache Redis
- S3 buckets
- ECR repository
- ECS cluster and services
- ALB and target groups
- CloudFront distribution
- Auto-scaling policies
- CloudWatch alarms
- IAM roles and policies

### CloudFormation Alternative
- Complete infrastructure stack
- Nested stacks for modularity
- Change sets for safety

## Migration Path

### From Docker Compose to AWS
1. Build infrastructure with Terraform/CloudFormation
2. Push images to ECR
3. Run database migrations
4. Deploy ECS service
5. Configure DNS
6. Test and validate
7. Migrate traffic gradually

### Zero-Downtime Deployments
1. Deploy new tasks
2. Wait for health checks
3. Drain old tasks
4. Automatic rollback on failure

## Troubleshooting

### Common Issues
1. **Tasks not starting**: Check IAM roles, security groups
2. **Database connection errors**: Verify security groups, credentials
3. **High latency**: Check CloudWatch metrics, scale resources
4. **SSL errors**: Verify ACM certificate, ALB listener
5. **Deployment failures**: Check task logs, rollback if needed

### Debugging Tools
- CloudWatch Logs
- ECS Task logs
- ALB access logs
- VPC Flow Logs
- AWS X-Ray (optional)

## Documentation References

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [ALB Best Practices](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/best-practices.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Support and Maintenance

For infrastructure support:
- Check DEPLOYMENT.md for deployment procedures
- Review CloudWatch dashboards for metrics
- Contact DevOps team for infrastructure issues
- Refer to runbooks for common scenarios
