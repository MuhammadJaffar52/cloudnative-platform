variable "secret_name" {
  description = "Secrets Manager secret name"
  type        = string
}

variable "secret_value" {
  description = "Secret value"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}