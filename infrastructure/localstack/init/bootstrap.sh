#!/usr/bin/env bash

set -euo pipefail

echo "========================================="
echo "CloudNative Platform Bootstrap"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for script in \
    01-create-s3.sh \
    02-create-sqs.sh \
    03-create-dynamodb.sh \
    04-create-secrets.sh
do
    echo
    echo "Running ${script}..."

    bash "${SCRIPT_DIR}/${script}"

done

echo
echo "========================================="
echo "Bootstrap completed successfully."
echo "========================================="