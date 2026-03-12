variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "allowed_principals" {
  description = "List of IAM principals allowed to push/pull images"
  type        = list(string)
  default     = ["*"]
}
