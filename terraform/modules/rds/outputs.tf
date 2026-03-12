output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "address" {
  description = "RDS address"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}
