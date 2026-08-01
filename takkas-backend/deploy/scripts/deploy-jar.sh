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

echo "==> Maven build..."
mvn -B package -DskipTests -q

JAR=$(ls target/takkas-backend-*.jar | head -1)
echo "==> Uploading $JAR to $REMOTE:/opt/takkas/takkas-backend.jar"
scp "${SCP_OPTS[@]}" "$JAR" "$REMOTE:/opt/takkas/takkas-backend.jar"

if [[ -f .env ]]; then
  echo "==> Uploading .env"
  scp "${SCP_OPTS[@]}" .env "$REMOTE:/opt/takkas/.env"
fi

echo "==> Restarting service..."
ssh "${SCP_OPTS[@]}" "$REMOTE" "sudo systemctl restart takkas && sudo systemctl status takkas --no-pager"

echo "==> Deploy tamamlandı."
