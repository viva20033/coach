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

echo "==> Testing connectivity to api.groq.com..."
curl -sS -o /dev/null -w "HTTP %{http_code}\n" --max-time 10 https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY" || echo "FAILED: cannot reach Groq"

echo ""
echo "==> Testing chat completion (model: $MODEL)..."
curl -sS --max-time 60 https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Привет\"}],\"max_tokens\":20}"

echo ""
echo ""
echo "Done. If you see 401 — wrong API key. 429 — rate limit. 404 — wrong model name."
