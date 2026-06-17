#!/bin/bash
# Test Groq API from the server. Run as root:
#   bash /opt/izo-coach/deploy/test-groq.sh

set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/izo-coach/backend/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${GROQ_API_KEY:-}" ]] || [[ "$GROQ_API_KEY" == "your_groq_api_key_here" ]]; then
  echo "ERROR: GROQ_API_KEY is not set in $ENV_FILE"
  exit 1
fi

MODEL="${GROQ_MODEL:-llama-3.3-70b-versatile}"
PROXY_ARGS=()
if [[ -n "${GROQ_HTTP_PROXY:-}" ]]; then
  PROXY_ARGS=(--proxy "$GROQ_HTTP_PROXY")
  echo "Using proxy: $GROQ_HTTP_PROXY"
fi

echo "==> Server public IP (for comparison with your PC):"
curl -4 -s --max-time 5 https://ifconfig.me || echo "(could not detect)"
echo ""

echo "==> Testing connectivity to api.groq.com (IPv4)..."
HTTP_CODE=$(curl -4 -sS -o /tmp/groq-test-body.txt -w "%{http_code}" --max-time 15 \
  "${PROXY_ARGS[@]}" \
  https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "User-Agent: IZO-Coach/1.0") || HTTP_CODE="000"
echo "HTTP $HTTP_CODE"
head -c 300 /tmp/groq-test-body.txt
echo ""

if [[ "$HTTP_CODE" == "403" ]]; then
  echo ""
  echo "!!! 403 Forbidden — Groq/Cloudflare blocks requests from this server's IP."
  echo "    This is NOT a wrong API key (that would be 401)."
  echo "    Fix: route traffic through a proxy (VPN, SOCKS5, HTTP proxy)."
  echo "    Add to $ENV_FILE:"
  echo "      GROQ_HTTP_PROXY=socks5://HOST:PORT"
  echo "    Then: systemctl restart izo-coach"
fi

echo ""
echo "==> Testing chat completion (model: $MODEL)..."
curl -4 -sS --max-time 60 "${PROXY_ARGS[@]}" \
  https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: IZO-Coach/1.0" \
  -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Привет\"}],\"max_tokens\":20}"

echo ""
echo ""
echo "Done. 401 = bad key | 403 = IP blocked | 429 = rate limit"
