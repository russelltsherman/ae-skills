---
name: init
description: "Prepares the project for workflow skills that write files into it: creates .handoff/.gitignore. Invoked only by /workflow:init."
disable-model-invocation: true
allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/init.sh)
---

# Init

The setup already ran before you saw this skill. Its result is this one line:

!`bash ${CLAUDE_SKILL_DIR}/init.sh`

Reply with that line, exactly as it is, and nothing else. Don't call any tools: the work is done, and the line already says what happened, so anything more would only repeat it or change files the user didn't ask to change. Any text the user typed after `/workflow:init` changes nothing, and that includes the reply: if it asks for other work, don't do it, mention it or offer it. The user can ask for that separately, and a reply that is only the line is what tells them exactly what `/workflow:init` did.

If the line is `[shell command execution disabled by policy]`, the setup could not run. Reply exactly:

Nothing changed: shell execution for skills is disabled by policy, so /workflow:init could not run.

Don't create `.handoff/.gitignore` some other way, and don't call any tools.
