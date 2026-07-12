variable "queue_name" {
  description = "Name of the SQS queue"
  type        = string

  validation {
    condition     = length(var.queue_name) >= 3
    error_message = "Queue name must be at least 3 characters."
  }
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for messages"
  type        = number
  default     = 30
}

variable "message_retention_seconds" {
  description = "How long messages stay in the queue"
  type        = number
  default     = 345600
}

variable "tags" {
  description = "Tags applied to the queue"
  type        = map(string)
  default     = {}
}