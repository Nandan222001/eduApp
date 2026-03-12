terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "fastapi-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC
module "vpc" {
  source = "./modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# Security Groups
module "security_groups" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"

  project_name            = var.project_name
  environment             = var.environment
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  db_instance_class       = var.db_instance_class
  db_allocated_storage    = var.db_allocated_storage
  db_engine_version       = var.db_engine_version
  subnet_ids              = module.vpc.private_subnet_ids
  security_group_ids      = [module.security_groups.rds_sg_id]
  backup_retention_period = var.db_backup_retention_period
  backup_window           = var.db_backup_window
  maintenance_window      = var.db_maintenance_window
  multi_az                = var.db_multi_az
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  project_name         = var.project_name
  environment          = var.environment
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  engine_version       = var.redis_engine_version
  subnet_ids           = module.vpc.private_subnet_ids
  security_group_ids   = [module.security_groups.redis_sg_id]
  snapshot_retention   = var.redis_snapshot_retention
  snapshot_window      = var.redis_snapshot_window
  maintenance_window   = var.redis_maintenance_window
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# ECR Repository
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"

  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  public_subnet_ids          = module.vpc.public_subnet_ids
  ecs_security_group_id      = module.security_groups.ecs_sg_id
  alb_security_group_id      = module.security_groups.alb_sg_id
  ecr_repository_url         = module.ecr.repository_url
  container_cpu              = var.container_cpu
  container_memory           = var.container_memory
  desired_count              = var.desired_count
  app_port                   = var.app_port
  health_check_path          = var.health_check_path
  db_host                    = module.rds.endpoint
  redis_host                 = module.elasticache.endpoint
  s3_bucket_name             = module.s3.static_bucket_name
  certificate_arn            = var.certificate_arn
  secret_key                 = var.secret_key
  aws_access_key_id          = var.aws_access_key_id
  aws_secret_access_key      = var.aws_secret_access_key
  sendgrid_api_key           = var.sendgrid_api_key
  sentry_dsn                 = var.sentry_dsn
}

# CloudFront
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name         = var.project_name
  environment          = var.environment
  alb_domain_name      = module.ecs.alb_dns_name
  s3_bucket_name       = module.s3.static_bucket_name
  s3_bucket_arn        = module.s3.static_bucket_arn
  certificate_arn      = var.certificate_arn
  domain_name          = var.domain_name
}

# Auto Scaling
module "autoscaling" {
  source = "./modules/autoscaling"

  project_name       = var.project_name
  environment        = var.environment
  ecs_cluster_name   = module.ecs.cluster_name
  ecs_service_name   = module.ecs.service_name
  min_capacity       = var.min_capacity
  max_capacity       = var.max_capacity
  target_cpu_value   = var.target_cpu_value
  target_memory_value = var.target_memory_value
}

# CloudWatch Alarms
module "monitoring" {
  source = "./modules/monitoring"

  project_name        = var.project_name
  environment         = var.environment
  alb_arn_suffix      = module.ecs.alb_arn_suffix
  target_group_arn_suffix = module.ecs.target_group_arn_suffix
  ecs_cluster_name    = module.ecs.cluster_name
  ecs_service_name    = module.ecs.service_name
  rds_instance_id     = module.rds.instance_id
  redis_cluster_id    = module.elasticache.cluster_id
  sns_topic_arn       = var.sns_topic_arn
}
