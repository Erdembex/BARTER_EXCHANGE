# AWS S3 bucket kurulum notları
# Detay: docs/DEPLOYMENT.md — Faz 2

## 1. Bucket oluştur

- AWS Console → S3 → Create bucket
- Name: `bex-media-prod` (global unique)
- Region: `eu-central-1`
- Block all public access: **ON**
- Versioning: recommended

## 2. IAM policy

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::bex-media-prod",
      "arn:aws:s3:::bex-media-prod/*"
    ]
  }]
}
```

## 3. Backend env

```bash
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=bex-media-prod
AWS_S3_REGION=eu-central-1
```

## 4. Mevcut dosyaları migrate et (local → S3)

```bash
# uploads/ klasöründeki dosyaları aws s3 sync ile aktar
aws s3 sync ./uploads/ s3://bex-media-prod/ --exclude ".*"
```

Key formatı backend ile uyumlu: `{userId}/{filename}`
