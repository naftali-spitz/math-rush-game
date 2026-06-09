#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/math-rush-game"
REPO_DIR="/home/naf-w/projects/self/math-rush-game"

cd "$REPO_DIR"
npm install
npm run build
sudo mkdir -p "$APP_DIR"
sudo rsync -a --delete dist/ "$APP_DIR/"

cd "$REPO_DIR/server"
npm install
npm run build
sudo systemctl restart math-rush-api
sudo systemctl reload nginx

echo "Math Rush deployed to http://10.0.0.15"
