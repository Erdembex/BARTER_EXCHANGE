#!/usr/bin/env bash
# S3 bucket erişim doğrulama (AWS CLI gerekli)
# Usage: AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... bash deploy/scripts/verify-s3.sh bex-media-prod
set -euo pipefail

BUCKET="${1:-bex-media-prod}"
REGION="${AWS_S3_REGION:-eu-central-1}"

if ! command -v aws &>/dev/null; then
  echo "AWS CLI yok. Kur: https://aws.amazon.com/cli/"
  exit 1
fi

echo "==> S3 bucket: s3://${BUCKET} (${REGION})"
aws s3 ls "s3://${BUCKET}" --region "$REGION"

TEST_KEY="health-check-$(date +%s).txt"
echo "test" | aws s3 cp - "s3://${BUCKET}/${TEST_KEY}" --region "$REGION"
aws s3 rm "s3://${BUCKET}/${TEST_KEY}" --region "$REGION"

echo "OK: S3 read/write/delete calisiyor"
echo "Backend .env: STORAGE_PROVIDER=s3, AWS_S3_BUCKET=${BUCKET}"
