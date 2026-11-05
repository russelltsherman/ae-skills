---
agent: claude
operator: Russell Sherman
---
# Plan: Create plugin-foundation

Paths are relative to the plugin directory, `plugins/workflow/`.

## Files that change
- .claude-plugin/plugin.json
- ../../.claude-plugin/marketplace.json
- .claude/CLAUDE.md
- ROADMAP.md

## Order of work
1. Before any edit, record a checksum snapshot of the files that must not change, in a temporary file outside the repo: `snap=$(mktemp) && shasum INTENT.md .specs/_rules/*.md docs/skills/README_TEMPLATE.md README.md TODO.md $(git ls-files skills/greet evals/greet) > "$snap"`. A snapshot is used instead of `git diff` because `TODO.md` is ignored by git and `docs/skills/README_TEMPLATE.md` holds the operator's uncommitted edits (C5, C6).
2. In `.claude-plugin/plugin.json`, set `description` to `Skills for how I work with Claude in any project or session, plus repo-wide policies.` Change no other key; `keywords` stays `["skills"]` (C1, C3).
3. In `../../.claude-plugin/marketplace.json`, set the `description` of the entry whose `name` is `workflow` to the same sentence. Change no other entry or key (C2).
4. In `.claude/CLAUDE.md`, remove the extra blank line before `## Commands`, leave the `## Commands` section as it is, and add after it a section `## Planning` with the line: "Before creating, finding or editing anything under `.specs/`, read `.specs/CLAUDE.md` and the rule file it names." (C4).
5. Run every item in `## Proof`.
6. Once every item in `## Proof` passes, mark F1, F2, F3 and F4 done in `ROADMAP.md` (`- [ ]` to `- [x]`), changing nothing else in the file (C1 to C6).

## Risks
- Hand-editing JSON can leave it invalid, which would break plugin loading and the marketplace listing. Both files are parsed with `jq` and validated with `claude plugin validate --strict` in `## Proof`.
- The marketplace manifest sits outside the plugin directory and lists `sdlc` too. Step 3 edits only the `workflow` entry, and `## Proof` checks the `sdlc` entry is unchanged.
- An edit could reach a protected file by accident (C5, C6). The snapshot from step 1 is checked with `shasum -c` at the end.

## Proof
- `jq -r .description .claude-plugin/plugin.json` prints `Skills for how I work with Claude in any project or session, plus repo-wide policies.` (C1).
- `jq -r '.plugins[] | select(.name=="workflow") | .description' ../../.claude-plugin/marketplace.json` prints the same sentence (C2).
- `git diff ../../.claude-plugin/marketplace.json` shows only the `workflow` entry's `description` line changed (C2).
- `jq -c .keywords .claude-plugin/plugin.json` prints `["skills"]`, and `git diff .claude-plugin/plugin.json` shows only the `description` line changed (C3).
- `grep -n '^## Planning' .claude/CLAUDE.md` and `grep -nF '.specs/CLAUDE.md' .claude/CLAUDE.md` each find the new section and line, and `git diff .claude/CLAUDE.md` shows the `## Commands` section unchanged (C4).
- `shasum -c "$snap"` reports `OK` for every file in the step 1 snapshot (C5, C6).
- `make validate` exits 0 in the plugin directory, and `claude plugin validate --strict .` run from the repo root prints `Validation passed` for the marketplace manifest (C1, C2).
- After step 6, `grep -c '^- \[x\] \*\*F[1-4]\.' ROADMAP.md` prints `4`, and `git diff ROADMAP.md` shows only those four lines changed.
