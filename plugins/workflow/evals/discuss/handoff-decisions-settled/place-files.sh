#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
mkdir -p .handoff
cat > .handoff/session.md <<'EOF'
# Handoff: session storage

## Summary
Worked out where user sessions are stored and how long they last.

## Decisions
### Accepted
- Postgres is the session store. Reason: it is already run in production. (Raised by user; accepted.)
- Sessions expire after 30 days idle. Reason: matches the security policy. (Raised by Claude; accepted.)
### Rejected
- Redis for sessions. Reason: one more service to run. (Raised by Claude; rejected.)

## Open questions
- Should sessions be revocable per device? (Raised by user; no response.)

## Dead ends and constraints
None.

## References
None.

## Left out
None.
EOF
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
