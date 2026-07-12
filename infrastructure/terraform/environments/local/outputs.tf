output "bucket_name" {
  value = module.s3.bucket_name
}

output "bucket_arn" {
  value = module.s3.bucket_arn
}

output "queue_name" {
  value = module.sqs.queue_name
}

output "queue_url" {
  value = module.sqs.queue_url
}

output "queue_arn" {
  value = module.sqs.queue_arn
}

output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  value = module.dynamodb.table_arn
}

output "dynamodb_table_id" {
  value = module.dynamodb.table_id
}

output "secret_name" {
  value = module.secrets_manager.secret_name
}

output "secret_arn" {
  value = module.secrets_manager.secret_arn
}

output "secret_id" {
  value = module.secrets_manager.secret_id
}