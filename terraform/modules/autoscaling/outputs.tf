output "autoscaling_target_id" {
  description = "Auto scaling target ID"
  value       = aws_appautoscaling_target.ecs.id
}

output "cpu_policy_arn" {
  description = "CPU auto scaling policy ARN"
  value       = aws_appautoscaling_policy.cpu.arn
}

output "memory_policy_arn" {
  description = "Memory auto scaling policy ARN"
  value       = aws_appautoscaling_policy.memory.arn
}
