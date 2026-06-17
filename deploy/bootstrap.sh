#!/bin/bash
# First-time deploy on Ubuntu 24.04 LXC from GitHub
# Run as root on the server:
#   curl -fsSL https://raw.githubusercontent.com/viva20033/coach/main/deploy/bootstrap.sh | bash
# Or after cloning:
#   bash deploy/bootstrap.sh

set -euo pipefail

REPO="${REPO:-https://github.com/viva20033/coach.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/izo-coach}"
DOMAIN="${DOMAIN:-trainer.izostudia.net}"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/bootstrap.sh"
  exit 1
fi

echo "=========================================="
echo "  IZO Coach — deploy from GitHub"
echo "  Repo:   $REPO"
echo "  Domain: $DOMAIN"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR=""

# If bootstrap run via curl, clone first to get all scripts
if [[ -z "$SCRIPT_DIR" ]] || [[ ! -f "${SCRIPT_DIR}/setup-server.sh" ]]; then
  apt-get update -qq
  apt-get install -y -qq git
  rm -rf "$APP_DIR"
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  SCRIPT_DIR="$APP_DIR/deploy"
fi

echo "==> Step 1/3: Server packages..."
bash "$SCRIPT_DIR/setup-server.sh"

echo "==> Step 2/3: Clone / update code..."
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
fi

echo "==> Step 3/3: Install application..."
bash "$APP_DIR/deploy/install-app.sh"

echo ""
echo "Done! Open http://$DOMAIN"
echo "Then: nano $APP_DIR/backend/.env  (set GROQ_API_KEY)"
echo "      systemctl restart izo-coach"
echo "      certbot --nginx -d $DOMAIN"
