module "s3" {
  source = "../../modules/s3"

  bucket_name        = "cloudnative-platform-local"
  versioning_enabled = true
  force_destroy      = true

  tags = local.common_tags
}

module "sqs" {
  source = "../../modules/sqs"

  queue_name = "cloudnative-platform-queue"

  visibility_timeout_seconds = 30

  message_retention_seconds = 345600

  tags = local.common_tags

}


module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name = "cloudnative-platform-table"

  hash_key = "id"

  billing_mode = "PAY_PER_REQUEST"

  tags = local.common_tags
}
module "secrets_manager" {
  source = "../../modules/secrets-manager"

  secret_name = "cloudnative-platform-secret"

  secret_value = jsonencode({
    username = "admin"
    password = "ChangeMe123!"
  })

  tags = local.common_tags
}