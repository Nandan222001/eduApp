output "static_bucket_name" {
  description = "Static files bucket name"
  value       = aws_s3_bucket.static.id
}

output "static_bucket_arn" {
  description = "Static files bucket ARN"
  value       = aws_s3_bucket.static.arn
}

output "media_bucket_name" {
  description = "Media files bucket name"
  value       = aws_s3_bucket.media.id
}

output "media_bucket_arn" {
  description = "Media files bucket ARN"
  value       = aws_s3_bucket.media.arn
}

output "backups_bucket_name" {
  description = "Backups bucket name"
  value       = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  description = "Backups bucket ARN"
  value       = aws_s3_bucket.backups.arn
}
