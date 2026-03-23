#!/bin/bash
# Nubble.me — Weekly Feed Generation
# Runs all 4 feed categories via NotebookLM pipeline, saves to JSON + Supabase,
# then commits and pushes to trigger Vercel deploy.
#
# Usage: ./server/feed-nightly.sh
# Scheduled via launchd: ~/Library/LaunchAgents/com.nubble.feed-nightly.plist

set -euo pipefail

cd /Users/v.konovalov/dev/nubble-me

# Load environment
export NLM_PATH="${HOME}/.local/bin/nlm"
export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.nvm/versions/node/$(ls ${HOME}/.nvm/versions/node/ | tail -1)/bin:${PATH}"

# Load Supabase credentials from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

DATE=$(date +%Y-%m-%d)
LOG="server/data/feed/nightly-${DATE}.log"
MAX_RETRIES=2
RETRY_DELAY=30

log() {
  echo "$(date '+%H:%M:%S') $1" | tee -a "$LOG"
}

run_category() {
  local cat="$1"
  local attempt=1

  while [ $attempt -le $((MAX_RETRIES + 1)) ]; do
    if [ $attempt -gt 1 ]; then
      log "${cat} — retry ${attempt}/$((MAX_RETRIES + 1)) (waiting ${RETRY_DELAY}s)..."
      sleep $RETRY_DELAY
    fi

    if npx tsx server/feed-pipeline.ts --category "$cat" >> "$LOG" 2>&1; then
      log "${cat} ✓"
      return 0
    fi

    log "${cat} attempt ${attempt} failed (exit code $?)"
    ((attempt++))
  done

  log "${cat} FAILED after $((MAX_RETRIES + 1)) attempts"
  return 1
}

log "=== Weekly feed generation started ==="

CATEGORIES=("ai-news" "ai-branding" "ai-ecommerce" "a16z-portfolio")
SUCCESS=0
FAIL=0

for cat in "${CATEGORIES[@]}"; do
  log "Generating ${cat}..."
  if run_category "$cat"; then
    ((SUCCESS++))
  else
    ((FAIL++))
  fi
done

log "Results: ${SUCCESS} succeeded, ${FAIL} failed"

# Commit + push if any feeds were generated
if [ "$SUCCESS" -gt 0 ]; then
  log "Committing and pushing..."
  git add client/public/data/feed/ server/data/feed/
  git commit -m "Weekly feed ${DATE} (${SUCCESS}/4 categories)" --no-verify 2>> "$LOG" || true
  git push origin main 2>> "$LOG" || log "Push failed — will retry next run"
  log "Deploy triggered"
else
  log "No feeds generated — skipping deploy"
  # Send failure notification via Resend
  if [ -n "${RESEND_API_KEY:-}" ]; then
    curl -s -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer ${RESEND_API_KEY}" \
      -H 'Content-Type: application/json' \
      -d "{
        \"from\": \"nubble <hey@hey.pokpok.ai>\",
        \"to\": [\"ceo@xclv.com\"],
        \"subject\": \"[nubble] Feed generation failed ${DATE}\",
        \"text\": \"All 4 feed categories failed on ${DATE}.\\n\\nCheck log: server/data/feed/nightly-${DATE}.log\\n\\nRun manually: cd ~/dev/nubble-me && npm run feed:nightly\"
      }" >> "$LOG" 2>&1 || log "Failed to send notification email"
    log "Failure notification sent"
  fi
fi

log "=== Weekly feed complete ==="
