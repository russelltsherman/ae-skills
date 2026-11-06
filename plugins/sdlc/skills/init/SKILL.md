---
name: init
description: Set up the current project for the sdlc plugin. Copies the planning rules into .specs/_rules/, writes the .claude/sdlc.md opt-in marker, and adds a short sdlc section to .claude/CLAUDE.md. Creates only what is missing, never overwrites, and never commits. Run it as /sdlc:init.
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" *)
---

# init

Set up this project for the `sdlc` plugin by running the plugin's init script. The script does all the file work and prints a report; your part is to run it and hand its report to the operator.

Run this command exactly as written, as one Bash call:

```
bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" "${CLAUDE_PLUGIN_ROOT}" "${CLAUDE_PROJECT_DIR}"
```

Keep the command exactly as it is, quotes included, with nothing before or after it. The plugin pre-approves only this exact form, so any change (a `cd` first, dropped quotes, or anything appended such as `; echo $?` or `2>&1`) stops the run for a permission prompt. You do not need to capture the exit status yourself: the Bash tool reports it, and the script prints its errors to the same output.

## When it succeeds (exit 0)

Show the operator the script's report unchanged, in a code block. Each line is one of:

- `created <path>`: the file did not exist, and init wrote it.
- `updated .claude/CLAUDE.md (added sdlc section)`: the file existed, and init added the sdlc section at its end.
- `skipped <path> (exists)` or `skipped .claude/CLAUDE.md (has sdlc section)`: already there, left untouched.

Then tell the operator, in a sentence or two, to review the created and updated files and commit them when they are happy with them. `.claude/sdlc.md` is meant to be committed: it opts the project in for everyone, CI included. If every line says `skipped`, say the project is already set up and there is nothing to commit.

## When it fails (non-zero exit)

Show the operator the script's output unchanged, including the `error:` line, and stop. The error says which check failed or which file could not be written; any lines before it are files that were already written.

## What not to do

Do nothing beyond running the script and reporting. Do not create, edit or fix files yourself, retry with a different command, or run git: no `git add`, no commit. The operator decides what gets committed, and the script's guarantee that it never overwrites anything holds only when it is the only thing writing.
