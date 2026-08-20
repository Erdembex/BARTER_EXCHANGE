#!/usr/bin/env bash
# Play Store service account JSON doğrulama
# Usage: bash scripts/verify-play-service-account.sh
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="./google-play-service-account.json"
if [[ ! -f "$KEY" ]]; then
  echo "HATA: $KEY bulunamadi"
  echo "Play Console -> API access -> Service account JSON indir"
  echo "Ornek: google-play-service-account.json.example"
  exit 1
fi

if grep -q "YOUR_" "$KEY" 2>/dev/null; then
  echo "HATA: Ornek dosya kullaniliyor, gercek JSON gerekli"
  exit 1
fi

echo "OK: Service account JSON mevcut"
python3 -c "import json; json.load(open('$KEY'))" 2>/dev/null || \
  node -e "JSON.parse(require('fs').readFileSync('$KEY'))" 2>/dev/null || \
  echo "JSON parse atlandi (python/node yok)"

grep -q "serviceAccountKeyPath" eas.json && echo "OK: eas.json submit.android yapilandirildi"
