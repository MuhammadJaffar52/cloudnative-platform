#!/usr/bin/env bash

set -euo pipefail

PROFILE="localstack"
ENDPOINT="http://localhost:4566"
BUCKET="cloudnative-platform-artifacts"

echo "Checking S3 bucket..."

if aws s3api head-bucket \
    --bucket "$BUCKET" \
    --endpoint-url="$ENDPOINT" \
    --profile "$PROFILE" \
    >/dev/null 2>&1; then

    echo "Bucket already exists."

else

    echo "Creating bucket..."

    aws s3api create-bucket \
        --bucket "$BUCKET" \
        --endpoint-url="$ENDPOINT" \
        --profile "$PROFILE"

    echo "Bucket created."

fi