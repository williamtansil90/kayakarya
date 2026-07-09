#!/bin/bash
set -e

CONF_SRC="$(dirname "$0")/nginx/kayakarya.com.conf"
CONF_DEST="/etc/nginx/sites-available/kayakarya.com"

echo "Deploying nginx config for kayakarya.com..."
sudo cp "$CONF_SRC" "$CONF_DEST"
sudo ln -sf "$CONF_DEST" /etc/nginx/sites-enabled/kayakarya.com
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx reloaded. kayakarya.com -> http://127.0.0.1:18080"
