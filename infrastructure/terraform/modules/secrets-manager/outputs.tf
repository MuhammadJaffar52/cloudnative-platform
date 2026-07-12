output "secret_name" {
  description = "Secret name"
  value       = aws_secretsmanager_secret.this.name
}

output "secret_arn" {
  description = "Secret ARN"
  value       = aws_secretsmanager_secret.this.arn
}

output "secret_id" {
  description = "Secret ID"
  value       = aws_secretsmanager_secret.this.id
}