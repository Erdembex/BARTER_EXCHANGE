#!/usr/bin/env bash
# Oracle Ubuntu imajinda varsayilan iptables sadece 22 acik — HTTP/API portlarini ac
# Usage: sudo bash deploy/scripts/open-vm-ports.sh
set -euo pipefail

for port in 80 443 8080; do
  if ! sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 5 -p tcp --dport "$port" -j ACCEPT
    echo "==> Port $port acildi"
  else
    echo "==> Port $port zaten acik"
  fi
done

if [[ -d /etc/iptables ]]; then
  sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
  echo "==> Kurallar /etc/iptables/rules.v4 kaydedildi"
fi

sudo iptables -L INPUT -n --line-numbers | head -12
