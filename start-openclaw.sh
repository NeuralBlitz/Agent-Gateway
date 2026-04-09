#!/usr/bin/env bash
# OpenClaw Gateway launcher for Replit - Simple Chat UI
set -uo pipefail

NODE="/nix/store/51gywl5jn4nna7al9waj142pw4vfhy0k-nodejs-22.19.0/bin/node"
OPENCLAW_DIR="/home/runner/workspace/openclaw-lrs-agents"
PORT="${OPENCLAW_PORT:-3000}"
CONFIG_FILE="${HOME}/.openclaw/openclaw.json"
UI_INDEX="${OPENCLAW_DIR}/dist/control-ui/index.html"

DOMAIN="${REPLIT_DEV_DOMAIN:-localhost}"

cd "$OPENCLAW_DIR"
mkdir -p "${HOME}/.openclaw"

TOKEN=""
if [ -f "$CONFIG_FILE" ]; then
  TOKEN=$($NODE -e "
const fs = require('fs');
try { const c = JSON.parse(fs.readFileSync('${CONFIG_FILE}','utf8')); console.log(c?.gateway?.auth?.token||''); } catch { console.log(''); }
" 2>/dev/null)
fi

# Inject correct WS URL into chat UI
if [ -n "$TOKEN" ] && [ -f "$UI_INDEX" ]; then
  $NODE -e "
const fs = require('fs');
const path = '${UI_INDEX}';
let html = fs.readFileSync(path, 'utf8');
html = html.replace(\"const TOKEN = '[^']*';\", \"const TOKEN = '${TOKEN}';\");
html = html.replace('const HOST = window.location.host;', 'const HOST = \"' + '${DOMAIN}' + '\";');
fs.writeFileSync(path, html);
console.log('Chat UI configured: wss://' + '${DOMAIN}');
" 2>/dev/null || true
fi

echo ""
echo "🦞 OpenClaw Chat — https://${DOMAIN}"
echo ""

exec "$NODE" openclaw.mjs gateway \
  --port "$PORT" \
  --bind lan \
  --allow-unconfigured \
  "$@"
