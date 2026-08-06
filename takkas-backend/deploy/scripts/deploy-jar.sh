#!/usr/bin/env bash
# JAR deploy script — lokal makineden veya CI'dan çalıştırılır
# Usage: ./deploy/scripts/deploy-jar.sh user@host /path/to/key.pem
set -euo pipefail

REMOTE="${1:?Usage: deploy-jar.sh user@host [key.pem]}"
KEY="${2:-}"

SCP_OPTS=()
if [[ -n "$KEY" ]]; then
  SCP_OPTS=(-i "$KEY")
fi

if command -v mvn &>/dev/null; then
  echo "==> Maven build (lokal)..."
  mvn -B package -DskipTests -q
else
  echo "Maven yok — GitHub Actions artifact veya sunucuda build kullan."
  echo "  GitHub: Actions -> Backend Build -> artifact indir"
  echo "  Sunucu: git clone && cd takkas-backend && mvn -B package -DskipTests"
  JAR="${JAR_PATH:-}"
  if [[ -z "$JAR" || ! -f "$JAR" ]]; then
    echo "HATA: JAR_PATH=/path/to/takkas-backend-*.jar belirt veya Maven kur"
    exit 1
  fi
fi

JAR="${JAR:-$(ls target/takkas-backend-*.jar 2>/dev/null | head -1)}"
if [[ ! -f "$JAR" ]]; then
  echo "HATA: JAR bulunamadi: $JAR"
  exit 1
fi
echo "==> Uploading $JAR to $REMOTE:/opt/takkas/takkas-backend.jar"
scp "${SCP_OPTS[@]}" "$JAR" "$REMOTE:/opt/takkas/takkas-backend.jar"

if [[ -f .env ]]; then
  echo "==> Uploading .env"
  scp "${SCP_OPTS[@]}" .env "$REMOTE:/opt/takkas/.env"
fi

echo "==> Restarting service..."
ssh "${SCP_OPTS[@]}" "$REMOTE" "sudo systemctl restart takkas && sudo systemctl status takkas --no-pager"

echo "==> Deploy tamamlandı."
