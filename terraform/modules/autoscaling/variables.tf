variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
}

variable "target_cpu_value" {
  description = "Target CPU utilization"
  type        = number
}

variable "target_memory_value" {
  description = "Target memory utilization"
  type        = number
}

variable "target_request_count" {
  description = "Target request count per target"
  type        = number
  default     = 1000
}

variable "alb_target_group_label" {
  description = "ALB target group label for request count scaling"
  type        = string
  default     = ""
}
