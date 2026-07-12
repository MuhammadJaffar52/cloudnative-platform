locals {
  project     = "cloudnative-platform"
  environment = "local"
  region       = "us-east-1"

  common_tags = {
    Project     = local.project
    Environment = local.environment
    ManagedBy   = "terraform"
  }
}