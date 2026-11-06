#!/usr/bin/env bash
set -eu
git init -q -b main
printf '# Project\n' > README.md
cat > run-tests.sh <<'EOF'
#!/usr/bin/env bash
# Run every test file under tests/ and record when the suite last ran.
set -eu
date > ran.marker
for t in tests/test_*.sh; do
  bash "$t" || { echo "FAIL $t"; exit 1; }
done
echo "all tests passed"
EOF
chmod +x run-tests.sh
mkdir -p tests
# shellcheck disable=SC2016 # the $(...) is meant for the test file, not this script
printf '#!/usr/bin/env bash\n[ "$(echo 2+2 | bc)" = 4 ]\n' > tests/test_math.sh
printf '#!/usr/bin/env bash\ngrep -q Project README.md\n' > tests/test_readme.sh
git add -A
git diff --cached --quiet || git -c user.name=eval -c user.email=eval@example.invalid commit -q -m 'scaffold'
