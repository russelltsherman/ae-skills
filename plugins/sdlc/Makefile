.PHONY: check evals

# Verify the harness: plugin validation, shellcheck, the .specs/ lint and its
# tests. Makes no model calls. See scripts/check.sh.
check:
	bash scripts/check.sh

# Run the skills' eval cases: real, billed model runs, never part of check.
# make evals [SKILL=<skill>] [ARGS="<claude plugin eval options>"].
# See scripts/evals.sh.
evals:
	@bash scripts/evals.sh
