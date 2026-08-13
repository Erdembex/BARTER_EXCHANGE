#!/usr/bin/env bash
# BEX — EAS production secrets kurulumu
# Usage: ./scripts/setup-eas-secrets.sh api.bex.app
set -euo pipefail

API_DOMAIN="${1:-}"
if [[ -z "$API_DOMAIN" ]]; then
  echo "Usage: ./scripts/setup-eas-secrets.sh api.SENIN-DOMAIN"
  exit 1
fi

cd "$(dirname "$0")/.."

if ! eas whoami &>/dev/null; then
  echo "Once: npx eas login"
  exit 1
fi

API_URL="https://${API_DOMAIN}"

set_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "  ATLA: $name — ortam degiskeni veya arguman ver"
    return
  fi
  echo "  -> $name"
  eas secret:create --name "$name" --value "$value" --force
}

echo "==> Secrets (API: $API_URL)"
set_secret EXPO_PUBLIC_API_BASE_URL "$API_URL"
set_secret EXPO_PUBLIC_EAS_PROJECT_ID "${EXPO_PUBLIC_EAS_PROJECT_ID:-}"
set_secret EXPO_PUBLIC_FIREBASE_API_KEY "${EXPO_PUBLIC_FIREBASE_API_KEY:-}"
set_secret EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN "${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-}"
set_secret EXPO_PUBLIC_FIREBASE_PROJECT_ID "${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-}"
set_secret EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET "${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:-}"
set_secret EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}"
set_secret EXPO_PUBLIC_FIREBASE_APP_ID "${EXPO_PUBLIC_FIREBASE_APP_ID:-}"
set_secret EXPO_PUBLIC_USE_DEMO_DATA "false"

echo ""
eas secret:list
echo ""
echo "Sonraki: npm run build:preview:android"
