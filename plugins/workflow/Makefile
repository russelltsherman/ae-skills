# check-target for the workflow plugin. `make check` runs every check and makes
# no model calls; each other target runs one check on its own.

.PHONY: check validate shellcheck lint-readmes lint-evals

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
