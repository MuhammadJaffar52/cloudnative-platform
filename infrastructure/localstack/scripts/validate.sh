#!/usr/bin/env bash

set -euo pipefail

PROFILE="localstack"
ENDPOINT="http://localhost:4566"

echo "Validating LocalStack..."

echo "Checking S3..."
aws s3 ls \
    --endpoint-url="$ENDPOINT" \
    --profile="$PROFILE"

echo "Checking SQS..."
aws sqs list-queues \
    --endpoint-url="$ENDPOINT" \
    --profile="$PROFILE"

echo "Checking DynamoDB..."
aws dynamodb list-tables \
    --endpoint-url="$ENDPOINT" \
    --profile="$PROFILE"

echo "Checking Secrets..."
aws secretsmanager list-secrets \
    --endpoint-url="$ENDPOINT" \
    --profile="$PROFILE"

echo
echo "Validation completed successfully."