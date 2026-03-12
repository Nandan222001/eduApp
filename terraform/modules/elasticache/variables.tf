variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Redis subnet group"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "snapshot_retention" {
  description = "Snapshot retention (days)"
  type        = number
  default     = 5
}

variable "snapshot_window" {
  description = "Snapshot window"
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = ""
}
