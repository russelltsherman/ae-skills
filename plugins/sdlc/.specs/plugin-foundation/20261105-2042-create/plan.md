---
agent: claude
operator: Russell Sherman
---
# Plan: create the plugin foundation

## Files that change
- .claude-plugin/plugin.json (new)
- ../../.claude-plugin/marketplace.json
- README.md (new)
- .claude/CLAUDE.md (new)
- refs/.gitignore (new)

## Order of work
1. Write `.claude-plugin/plugin.json` in `plugins/sdlc/` with `name` `sdlc`, `version` `0.1.0`, `description` `an implementation of Anthropics AI Native Software Development Lifecycle`, `author` `{"name": "Russell Sherman", "url": "https://github.com/russelltsherman/ae-skills"}` and `keywords` `["skills"]`, and no other keys (R1, R12).
2. Add an entry to `plugins` in `../../.claude-plugin/marketplace.json`: `name` `sdlc`, `source` `./plugins/sdlc`, and the manifest's `description`, copied exactly. Leave the other entries alone (R2).
3. Write `README.md` (R4). It has:
   - the first line `# sdlc`;
   - what the plugin is: Anthropic's AI-native SDLC playbook as a Claude Code plugin, with a skill for each stage that writes or reads that stage's document in `.specs/`;
   - the install commands `/plugin marketplace add russelltsherman/ae-skills` and `/plugin install sdlc@ae-skills`;
   - its current state: Phase 0, with no stage skills released yet, and a pointer to `ROADMAP.md`;
   - no skill or command name the plugin does not ship.
   The exact wording is written during implementation (operator decision, 2026-11-05).
4. Write `refs/.gitignore` containing `*` (R13).
5. Write `.claude/CLAUDE.md`, with no `CLAUDE.md` at the plugin root. It points to `INTENT.md` and `ROADMAP.md` and has the sections `## Commands` (the two validate commands, `--plugin-dir`, `claude plugin tag`), `## Planning documents` (read `.specs/_rules/` first; never create the next document unasked; record only operator decisions; `.specs/_rules/` is the canonical copy `init` ships, changed under `specs-rules`), and no `## Conventions` or `## Things to get right` section. It stays at 50 lines or fewer (R5, R6, R10).
6. Check the documents this change is planned from, which it does not write: `INTENT.md` and `ROADMAP.md` (R7), `.specs/_rules/` (R8, R9) and the three skill intents (R11), with the commands under `## Proof`. If one fails, stop and show the failure to the operator before editing anything, and add the file to `## Files that change` (R7, R8, R9, R11).
7. Run both validate commands and every check under `## Proof`. If `--profile directory` reports `README_TRIVIAL`, add sentences to `README.md` and run it again (R3, R4, R12, R13, R14).

## Risks
- The validator decides whether the README is long enough, and its word count is lower than `wc -w` (spec R4). Step 7 relies only on the validator's result.
- The README could promise a skill that doesn't exist yet, such as `/intent` (spec R4). Step 3 names no skill or command, and the Proof includes reading the README for one.
- `../../.claude-plugin/marketplace.json` is shared with the other plugins in the marketplace (spec R2). Step 2 only adds the `sdlc` entry, and `git diff` on the file must show only that entry.
- A document this change is planned from could fail its check (spec R7–R9, R11). Editing it would change an input this change's intent was written against, so step 6 stops for the operator rather than editing it unasked.
- `refs/.gitignore` ignores itself, so it is never committed (spec R13, Out of scope). On a fresh clone, a newly mirrored `refs/` would not be ignored until the file is written again. This plan accepts that, following the operator's decision.
- Agents do not commit for now. The work is left uncommitted for the operator to review, and the operator decides when to commit, with `Plan-Approved-By: Russell Sherman` on the first implementation commit.

## Proof
Every command runs from `plugins/sdlc/`.
- R1: `jq -e '. == {"name":"sdlc","version":"0.1.0","description":"an implementation of Anthropics AI Native Software Development Lifecycle","author":{"name":"Russell Sherman","url":"https://github.com/russelltsherman/ae-skills"},"keywords":["skills"]}' .claude-plugin/plugin.json` prints `true`.
- R2: `jq -e --slurpfile m .claude-plugin/plugin.json '[.plugins[] | select(.name == "sdlc")] | length == 1 and .[0].source == "./plugins/sdlc" and .[0].description == $m[0].description' ../../.claude-plugin/marketplace.json` prints `true`. `git diff ../../.claude-plugin/marketplace.json` shows only the `sdlc` entry.
- R3: `claude plugin validate --strict .` and `claude plugin validate --profile directory .` both exit 0.
- R4: `head -1 README.md` prints `# sdlc`. `claude plugin validate --profile directory . 2>&1 | grep -c README_TRIVIAL` prints `0`. Manual check: the operator reads `README.md` and confirms it says what the plugin does, how to install it and that it is in Phase 0, and that it names no skill or command the plugin does not ship.
- R5: `test -f .claude/CLAUDE.md && test ! -e CLAUDE.md` exits 0.
- R6: `test "$(wc -l < .claude/CLAUDE.md)" -le 50` exits 0, `grep -cx '## Commands' .claude/CLAUDE.md` prints `1`, and `grep -cxE '## (Conventions|Things to get right)' .claude/CLAUDE.md` prints `0`.
- R7: `test -f INTENT.md && test -f ROADMAP.md` exits 0. `grep -oE '^\| D[0-9]+ \|' ROADMAP.md | grep -oE '[0-9]+'` prints exactly the output of `seq 1 22`, and `grep -oE '^- \[[ x]\] \*\*F[0-9]+\.' ROADMAP.md | grep -oE '[0-9]+'` prints exactly the output of `seq 1 6`.
- R8: `grep -c` finds `<YYYYMMDD-HHMM>-<change>/`, `` `a-z`, `0-9` and `-` `` and `reserved` in `.specs/_rules/naming.md`. Manual check: the operator reads the Slugs section and confirms it states R8.
- R9: `grep -c 'No `status`'` prints `1` for each of the three templates, and `grep -c 'Plan-Approved-By: <operator>' .specs/_rules/plan_template.md` prints `1`. Manual check: the operator confirms that `intent_template.md` and `spec_template.md` together say `C`, `Q`, `R` and `K` IDs are never renumbered.
- R10: `grep -c` finds ``canonical copy that `init` ships`` and `specs-rules` in `.claude/CLAUDE.md`.
- R11: for each of `intent-skill`, `spec-skill` and `plan-skill`, `.specs/<feature>/<YYYYMMDD-HHMM>-create/intent.md` exists. Its front-matter keys are `agent operator origin type risk spec`, its first line after the front matter starts with `# Intent: `, and `grep '^## '` lists `Problem`, `Proposed outcome`, `Affected users and systems`, `Constraints`, `Open questions` and `Action already taken`, in that order.
- R12: `test -f INTENT.md && test -f ROADMAP.md && test -d .specs`, run from `plugins/sdlc/`, exits 0, and `refs/.gitignore` exists there.
- R13: `git ls-files refs` prints nothing.
- R14: `find skills agents commands hooks -type f 2>/dev/null` prints nothing.
