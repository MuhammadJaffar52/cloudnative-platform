#!/usr/bin/env bash

set -euo pipefail

curl -fs http://localhost:4566/_localstack/health >/dev/null

echo "LocalStack is healthy."