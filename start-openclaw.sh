#!/usr/bin/env bash
# Secure OpenClaw Gateway launcher for Replit.
# Never embed gateway credentials in static HTML or generate public token URLs.
set -euo pipefail

NODE="${OPENCLAW_NODE_BIN:-/nix/store/51gywl5jn4nna7al9waj142pw4vfhy0k-nodejs-22.19.0/bin/node}"
OPENCLAW_DIR="${OPENCLAW_DIR:-/home/runner/workspace/openclaw-lrs-agents}"
PORT="${OPENCLAW_PORT:-3000}"
BIND="${OPENCLAW_BIND:-lan}"
CONFIG_FILE="${HOME}/.openclaw/openclaw.json"

if [[ ! -x "${NODE}" ]]; then
  echo "OpenClaw startup refused: Node runtime not executable." >&2
  exit 1
fi

if [[ ! -f "${OPENCLAW_DIR}/openclaw.mjs" ]]; then
  echo "OpenClaw startup refused: gateway entrypoint not found." >&2
  exit 1
fi

# Requiring an existing configuration or an explicitly supplied credential
# avoids the old --allow-unconfigured shortcut. OpenClaw itself remains the
# authority for validating the gateway's authentication configuration.
if [[ ! -f "${CONFIG_FILE}" && -z "${OPENCLAW_GATEWAY_TOKEN:-}" && -z "${OPENCLAW_GATEWAY_PASSWORD:-}" ]]; then
  echo "OpenClaw startup refused: configure gateway authentication through the runtime secret store or OpenClaw onboarding." >&2
  exit 1
fi

cd "${OPENCLAW_DIR}"

echo "OpenClaw gateway starting on port ${PORT} (bind: ${BIND})."
echo "Open the Control UI via 'openclaw dashboard'; do not inject shared secrets into static UI assets."
if [[ "${BIND}" == "lan" ]]; then
  echo "Security warning: LAN binding requires verified gateway auth and trusted HTTPS ingress." >&2
fi

exec "${NODE}" openclaw.mjs gateway --port "${PORT}" --bind "${BIND}" "$@"
