# Production Readiness Checklist

Complete this checklist before deploying to production.

## Infrastructure

### Networking
- [ ] VPC created with proper CIDR blocks
- [ ] Public and private subnets in multiple AZs
- [ ] Internet Gateway configured
- [ ] NAT Gateways in each AZ
- [ ] Route tables properly configured
- [ ] Security groups follow least privilege principle
- [ ] Network ACLs reviewed
- [ ] VPC Flow Logs enabled (optional)

### Compute
- [ ] ECS cluster created
- [ ] Task definitions configured with proper resources
- [ ] Auto-scaling policies configured
- [ ] Health checks implemented
- [ ] Desired task count set (minimum 2)
- [ ] Circuit breaker enabled for deployments
- [ ] Container insights enabled

### Load Balancing
- [ ] Application Load Balancer created
- [ ] Target groups configured with health checks
- [ ] HTTPS listener configured with ACM certificate
- [ ] HTTP to HTTPS redirect enabled
- [ ] Sticky sessions configured if needed
- [ ] Access logs enabled
- [ ] Deletion protection enabled

### Database
- [ ] RDS instance deployed in private subnets
- [ ] Multi-AZ enabled for production
- [ ] Automated backups configured (7+ days retention)
- [ ] Backup window scheduled during low traffic
- [ ] Maintenance window scheduled
- [ ] Enhanced monitoring enabled
- [ ] Performance Insights enabled
- [ ] Encryption at rest enabled
- [ ] SSL/TLS connections required
- [ ] Parameter group optimized
- [ ] Connection pooling configured in application
- [ ] Deletion protection enabled

### Cache
- [ ] ElastiCache Redis deployed
- [ ] Automatic backups enabled
- [ ] Maintenance window scheduled
- [ ] Encryption at rest enabled
- [ ] Encryption in transit enabled
- [ ] Appropriate eviction policy set

### Storage
- [ ] S3 buckets created with proper naming
- [ ] Versioning enabled on all buckets
- [ ] Encryption enabled (SSE-S3 or SSE-KMS)
- [ ] Lifecycle policies configured
- [ ] Bucket policies properly restrictive
- [ ] CORS configured for web access
- [ ] Access logging enabled

### CDN
- [ ] CloudFront distribution created
- [ ] Origins configured (ALB and S3)
- [ ] SSL/TLS certificate configured
- [ ] Caching policies optimized
- [ ] Compression enabled (Gzip/Brotli)
- [ ] Custom error pages configured
- [ ] Access logs enabled
- [ ] WAF associated (if using)

### Container Registry
- [ ] ECR repository created
- [ ] Image scanning enabled
- [ ] Lifecycle policy configured
- [ ] Repository policies set

## Security

### IAM
- [ ] Task execution role created with minimal permissions
- [ ] Task role created for application access
- [ ] RDS monitoring role configured
- [ ] Service-linked roles reviewed
- [ ] IAM policies follow least privilege
- [ ] MFA enabled for admin users
- [ ] Access keys rotated regularly

### Secrets Management
- [ ] All secrets stored in AWS Secrets Manager
- [ ] Database credentials rotated
- [ ] API keys properly secured
- [ ] No secrets in environment variables
- [ ] No secrets in code repository
- [ ] Access to secrets properly restricted

### Network Security
- [ ] Security groups properly configured
- [ ] No unnecessary ports open
- [ ] No direct internet access to private resources
- [ ] VPC endpoints for AWS services (optional)
- [ ] AWS Shield Standard enabled (automatic)
- [ ] AWS WAF configured (optional)

### Compliance
- [ ] CloudTrail enabled for audit logging
- [ ] Config rules configured (optional)
- [ ] GuardDuty enabled (optional)
- [ ] Security Hub enabled (optional)
- [ ] Compliance requirements reviewed
- [ ] GDPR compliance if applicable
- [ ] HIPAA compliance if applicable
- [ ] SOC2 requirements if applicable

## Application

### Configuration
- [ ] Environment variables properly set
- [ ] Debug mode disabled
- [ ] Proper logging level configured (WARNING or INFO)
- [ ] CORS origins properly restricted
- [ ] Rate limiting configured
- [ ] Maximum upload size configured
- [ ] Timeout values appropriate

### Database
- [ ] Connection pooling configured
- [ ] Database indexes optimized
- [ ] Migrations tested in staging
- [ ] Backup and restore tested
- [ ] Query performance optimized
- [ ] N+1 query problems resolved

### Code Quality
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Linting passes (ruff/black)
- [ ] Type checking passes (mypy)
- [ ] Security scan completed
- [ ] Dependencies updated
- [ ] No known vulnerabilities

### API
- [ ] API documentation up to date
- [ ] Authentication implemented
- [ ] Authorization properly configured
- [ ] Input validation on all endpoints
- [ ] Error handling comprehensive
- [ ] Rate limiting per endpoint
- [ ] API versioning strategy

### Performance
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] Static assets optimized
- [ ] API response times acceptable

## Monitoring & Logging

### CloudWatch
- [ ] Log groups created with retention policy
- [ ] Application logs properly structured
- [ ] Error logs searchable
- [ ] CloudWatch Insights queries ready
- [ ] Custom metrics published

### Alarms
- [ ] ALB response time alarm
- [ ] ALB 5XX error alarm
- [ ] Target health alarm
- [ ] ECS CPU utilization alarm
- [ ] ECS memory utilization alarm
- [ ] RDS CPU utilization alarm
- [ ] RDS storage space alarm
- [ ] RDS connection count alarm
- [ ] Redis CPU utilization alarm
- [ ] Redis memory utilization alarm
- [ ] SNS topic for notifications
- [ ] Email/Slack notifications configured

### Dashboards
- [ ] CloudWatch dashboard created
- [ ] Key metrics visualized
- [ ] Real-time monitoring available
- [ ] Historical data accessible

### Error Tracking
- [ ] Sentry configured and tested
- [ ] Error notifications working
- [ ] Source maps uploaded
- [ ] Release tracking configured
- [ ] Performance monitoring enabled

## Backup & Disaster Recovery

### Database Backups
- [ ] Automated daily backups enabled
- [ ] Backup retention period set (7+ days)
- [ ] Manual snapshots taken before major changes
- [ ] Backup restoration tested
- [ ] Point-in-time recovery available
- [ ] Cross-region backup (optional)

### Application Backups
- [ ] ECS task definitions versioned
- [ ] Docker images tagged properly
- [ ] Configuration backed up
- [ ] Infrastructure as code in Git

### Disaster Recovery Plan
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Disaster recovery runbook created
- [ ] Failover procedures documented
- [ ] Recovery procedures tested
- [ ] Team trained on recovery process

## Deployment

### CI/CD Pipeline
- [ ] GitHub Actions/GitLab CI configured
- [ ] Automated tests in pipeline
- [ ] Automated deployment configured
- [ ] Deployment notifications working
- [ ] Manual approval for production
- [ ] Rollback procedure automated

### Deployment Process
- [ ] Blue-green deployment strategy (optional)
- [ ] Canary deployments (optional)
- [ ] Health checks before traffic shift
- [ ] Automatic rollback on failure
- [ ] Database migration strategy
- [ ] Zero-downtime deployments

### Documentation
- [ ] Deployment guide complete
- [ ] Infrastructure documentation complete
- [ ] API documentation published
- [ ] Runbooks for common scenarios
- [ ] Troubleshooting guide available
- [ ] Architecture diagrams updated

## DNS & SSL

### Domain Configuration
- [ ] Domain registered
- [ ] DNS provider configured
- [ ] A/CNAME records created
- [ ] TTL values appropriate
- [ ] SPF/DKIM/DMARC for email

### SSL/TLS
- [ ] ACM certificate requested
- [ ] Certificate validated
- [ ] Certificate applied to ALB
- [ ] HTTPS enforced (HTTP redirects)
- [ ] TLS 1.2+ only
- [ ] HSTS header configured
- [ ] Certificate expiry monitoring

## Performance

### Load Testing
- [ ] Load testing completed
- [ ] Performance benchmarks met
- [ ] Scalability verified
- [ ] Bottlenecks identified and resolved
- [ ] Auto-scaling tested under load

### Caching
- [ ] Redis caching implemented
- [ ] Cache hit rate monitored
- [ ] Cache invalidation strategy
- [ ] CloudFront caching optimized
- [ ] Browser caching headers set

### Database Performance
- [ ] Slow query log analyzed
- [ ] Indexes optimized
- [ ] Connection pooling tuned
- [ ] Read replicas for read-heavy loads (optional)
- [ ] Query caching enabled

## Cost Optimization

### Resource Sizing
- [ ] Instance sizes appropriate for load
- [ ] Auto-scaling configured properly
- [ ] Unused resources identified
- [ ] Reserved Instances considered
- [ ] Savings Plans evaluated

### Storage Optimization
- [ ] S3 lifecycle policies configured
- [ ] Old snapshots deleted
- [ ] Unused volumes removed
- [ ] Storage tiering implemented

### Monitoring
- [ ] AWS Cost Explorer reviewed
- [ ] Budget alerts configured
- [ ] Resource tagging for cost allocation
- [ ] Monthly cost reports automated

## Compliance & Legal

### Data Protection
- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] PII handling procedures
- [ ] Data retention policies
- [ ] Data deletion procedures
- [ ] GDPR compliance (if EU users)

### Audit & Compliance
- [ ] Audit logging enabled
- [ ] Access logs retained
- [ ] Compliance requirements met
- [ ] Regular security audits scheduled
- [ ] Penetration testing completed

### Legal
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] Cookie policy (if applicable)
- [ ] DMCA agent registered (if content platform)
- [ ] Legal review completed

## Team Readiness

### Documentation
- [ ] Architecture documentation complete
- [ ] API documentation published
- [ ] Deployment procedures documented
- [ ] Troubleshooting guides available
- [ ] Contact information updated

### Training
- [ ] Team trained on infrastructure
- [ ] On-call rotation established
- [ ] Escalation procedures defined
- [ ] Incident response plan created
- [ ] Post-mortem process defined

### Communication
- [ ] Status page configured
- [ ] Incident communication plan
- [ ] Customer notification procedures
- [ ] Internal communication channels
- [ ] Stakeholder updates scheduled

## Go-Live Checklist

### Pre-Launch (1 week before)
- [ ] All items above completed
- [ ] Staging environment matches production
- [ ] Full regression testing completed
- [ ] Performance testing passed
- [ ] Security scan completed
- [ ] Backup and restore tested
- [ ] Rollback procedure tested

### Launch Day
- [ ] Final backup created
- [ ] Team on standby
- [ ] Monitoring dashboards open
- [ ] Customer support briefed
- [ ] Status page ready
- [ ] Deployment started
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Performance monitoring
- [ ] Error rate monitoring

### Post-Launch (First 24 hours)
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Check for anomalies
- [ ] Verify backups working
- [ ] Document any issues
- [ ] Team debriefing scheduled

### Post-Launch (First Week)
- [ ] Review all metrics
- [ ] Address any issues
- [ ] Optimize performance
- [ ] Update documentation
- [ ] Conduct retrospective
- [ ] Plan improvements

## Sign-Off

### Team Sign-Off
- [ ] Development Team Lead: _________________ Date: _______
- [ ] DevOps Engineer: _______________________ Date: _______
- [ ] Security Officer: _______________________ Date: _______
- [ ] QA Lead: ______________________________ Date: _______
- [ ] Product Manager: _______________________ Date: _______

### Approval to Deploy
- [ ] Technical Director: _____________________ Date: _______
- [ ] Final approval to deploy to production

---

**Notes:**
- Items marked as (optional) are recommended but not required
- Some items may not apply to all applications
- Add custom items specific to your application
- Update this checklist based on your requirements

**Last Updated:** [Date]
**Next Review:** [Date]
