#!/usr/bin/env bash

set -euo pipefail

PROFILE="localstack"
ENDPOINT="http://localhost:4566"
QUEUE_NAME="cloudnative-events"

echo "Checking SQS queue..."

if aws sqs get-queue-url \
    --queue-name "$QUEUE_NAME" \
    --endpoint-url="$ENDPOINT" \
    --profile "$PROFILE" \
    >/dev/null 2>&1; then

    echo "Queue already exists."

else

    echo "Creating queue..."

    aws sqs create-queue \
        --queue-name "$QUEUE_NAME" \
        --endpoint-url="$ENDPOINT" \
        --profile "$PROFILE"

    echo "Queue created."

fi