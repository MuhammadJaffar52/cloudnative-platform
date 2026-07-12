#!/usr/bin/env bash

set -euo pipefail

PROFILE="localstack"
ENDPOINT="http://localhost:4566"
TABLE_NAME="platform-config"

echo "Checking DynamoDB table..."

if aws dynamodb describe-table \
    --table-name "$TABLE_NAME" \
    --endpoint-url="$ENDPOINT" \
    --profile "$PROFILE" \
    >/dev/null 2>&1; then

    echo "Table already exists."

else

    echo "Creating table..."

    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions AttributeName=id,AttributeType=S \
        --key-schema AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url="$ENDPOINT" \
        --profile "$PROFILE"

    echo "Table created."

fi