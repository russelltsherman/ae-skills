---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/sdlc:intent I'm Sam Ortiz. The export command only writes CSV. I want it to write JSON as well. It's for me, and for a script of mine that reads the export. CSV stays the default; JSON only when I ask for it. The CSV output must not change at all. The JSON is a list of tasks with the same fields as todo.json. Success is that `todo.py export --format json` prints valid JSON. That's everything. Write it.
