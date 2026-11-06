#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
mkdir -p docs
cat > docs/proposal.md <<'EOF'
# Proposal: event-driven invoicing

Replace the nightly billing batch job with event-driven invoicing.
Each order emits an event on the Kafka topic billing.events, and the
invoicer consumes it within a minute. Goal: invoices go out the same
hour instead of the next morning.
EOF
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
