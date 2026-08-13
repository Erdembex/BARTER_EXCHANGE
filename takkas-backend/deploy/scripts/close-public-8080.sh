#!/usr/bin/env bash
# Test sonrasi dis erisimden 8080'i kapat (Nginx uzerinden 80 yeterli)
# Usage: sudo bash deploy/scripts/close-public-8080.sh
set -euo pipefail

if sudo iptables -C INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null; then
  sudo iptables -D INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || true
  # line-number delete fallback
  while sudo iptables -C INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null; do
    sudo iptables -D INPUT -p tcp --dport 8080 -j ACCEPT
  done
  echo "==> iptables: 8080 kurali kaldirildi"
fi

if [[ -d /etc/iptables ]]; then
  sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
fi

echo "==> Oracle Console Security List'ten 8080 ingress kuralini da sil."
echo "    API: curl http://127.0.0.1/actuator/health (nginx uzerinden dis test)"
