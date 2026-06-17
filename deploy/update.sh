#!/bin/bash
# Update app from GitHub (run on server as root)
#   bash /opt/izo-coach/deploy/update.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/izo-coach}"
BRANCH="${BRANCH:-main}"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root"
  exit 1
fi

cd "$APP_DIR"
echo "==> git pull..."
git pull origin "$BRANCH"

echo "==> Reinstall..."
bash "$APP_DIR/deploy/install-app.sh"

echo "Updated: https://trainer.izostudia.net"
