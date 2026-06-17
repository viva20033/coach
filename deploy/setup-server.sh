#!/bin/bash
# One-time server preparation for Ubuntu 24.04 LXC
# Run as root: bash deploy/setup-server.sh

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating system..."
apt-get update
apt-get upgrade -y

echo "==> Installing packages..."
apt-get install -y \
  nginx \
  certbot \
  python3-certbot-nginx \
  python3.12 \
  python3.12-venv \
  python3-pip \
  git \
  curl \
  rsync \
  ufw

# Node.js 20 LTS (Vite 6 needs modern Node)
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

mkdir -p /var/www/certbot
mkdir -p /opt/izo-coach

echo ""
echo "Server is ready."
echo "Next: upload the project to /opt/izo-coach and run:"
echo "  bash /opt/izo-coach/deploy/install-app.sh"
