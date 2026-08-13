#!/usr/bin/env bash
# Production build + submit (Android + iOS)
# Usage: bash scripts/store-submit-all.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Production build (android + ios)..."
eas build --profile production --platform all --non-interactive

echo "==> Submit android..."
eas submit --platform android --profile production --non-interactive

echo "==> Submit ios..."
eas submit --platform ios --profile production --non-interactive

echo "==> Tamam. Play Console ve App Store Connect'ten inceleme durumunu takip et."
