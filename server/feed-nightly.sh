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

log() {
  echo "$(date '+%H:%M:%S') $1" | tee -a "$LOG"
}

log "=== Weekly feed generation started ==="

CATEGORIES=("ai-news" "ai-branding" "ai-ecommerce" "a16z-portfolio")
SUCCESS=0
FAIL=0

for cat in "${CATEGORIES[@]}"; do
  log "Generating ${cat}..."
  if npx tsx server/feed-pipeline.ts --category "$cat" >> "$LOG" 2>&1; then
    log "${cat} ✓"
    ((SUCCESS++))
  else
    log "${cat} FAILED (exit code $?)"
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
fi

log "=== Weekly feed complete ==="
