# check-target and eval-target for the workflow plugin. `make check` runs every
# check and makes no model calls; each check target runs one check on its own.
# `make evals` runs the skills' eval cases as billed model runs, and `make check`
# never runs it.

.PHONY: check validate shellcheck lint-readmes lint-evals evals

check:
	@bash scripts/check.sh

validate:
	@bash scripts/validate.sh

shellcheck:
	@bash scripts/shellcheck.sh

lint-readmes:
	@bash scripts/lint-readmes.sh

lint-evals:
	@bash scripts/lint-evals.sh

evals:
	@SKILL="$(SKILL)" ARGS="$(ARGS)" bash scripts/evals.sh
