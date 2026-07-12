#!/usr/bin/env bash

set -euo pipefail

PROFILE="localstack"
ENDPOINT="http://localhost:4566"
SECRET_NAME="platform/database/password"

echo "Checking secret..."

if aws secretsmanager describe-secret \
    --secret-id "$SECRET_NAME" \
    --endpoint-url="$ENDPOINT" \
    --profile "$PROFILE" \
    >/dev/null 2>&1; then

    echo "Secret already exists."

else

    echo "Creating secret..."

    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --secret-string "ChangeMe123!" \
        --endpoint-url="$ENDPOINT" \
        --profile "$PROFILE"

    echo "Secret created."

fi