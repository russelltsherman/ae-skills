#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
mkdir -p services/orders services/payments
cat > services/orders/client.py <<'EOF'
def fetch(url, session):
    for attempt in range(3):  # retry up to 3 times
        resp = session.get(url)
        if resp.ok:
            return resp
    raise RuntimeError("orders fetch failed")
EOF
cat > services/payments/client.py <<'EOF'
import backoff

@backoff.on_exception(backoff.expo, Exception, max_tries=5)  # retry
def charge(session, payload):
    return session.post("/charge", json=payload)
EOF
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
