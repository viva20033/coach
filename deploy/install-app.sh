#!/bin/bash
# Install / update IZO Coach from git checkout at /opt/izo-coach
# Run as root: bash deploy/install-app.sh

set -euo pipefail

DOMAIN="${DOMAIN:-trainer.izostudia.net}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(dirname "$SCRIPT_DIR")}"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/install-app.sh"
  exit 1
fi

echo "==> App directory: $APP_DIR"
cd "$APP_DIR"

echo "==> Backend: Python venv..."
cd "$APP_DIR/backend"
if [[ ! -d .venv ]]; then
  python3.12 -m venv .venv
fi
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

if [[ ! -f .env ]]; then
  echo "==> Creating .env from template..."
  cp "$APP_DIR/deploy/production.env.example" .env
  SECRET=$(openssl rand -hex 32)
  sed -i "s/CHANGE_ME_long_random_string/$SECRET/" .env
  echo ""
  echo "!!! Set GROQ_API_KEY: nano $APP_DIR/backend/.env !!!"
  echo ""
fi

touch izo_coach.db 2>/dev/null || true
chown -R www-data:www-data "$APP_DIR/backend"

echo "==> Frontend: build..."
cd "$APP_DIR/frontend"
if [[ -f package-lock.json ]]; then
  npm ci --silent
else
  npm install --silent
fi
npm run build
chown -R www-data:www-data "$APP_DIR/frontend/dist"

echo "==> Nginx..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/izo-coach
ln -sf /etc/nginx/sites-available/izo-coach /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Systemd..."
cp "$APP_DIR/deploy/izo-coach.service" /etc/systemd/system/izo-coach.service
systemctl daemon-reload
systemctl enable izo-coach
systemctl restart izo-coach

echo ""
echo "=========================================="
echo "  IZO Coach ready"
echo "  http://$DOMAIN"
echo "  journalctl -u izo-coach -f"
echo "=========================================="
