---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/sdlc:intent I'm Dana Reyes. From issue #12: I want tasks to have due dates so I can see what is due soon. Scope: one optional due date per task, set when adding a task or later; `list` shows it. No reminders and no notifications; those are out of scope. Users: it's just me, it's my personal list. Dates are YYYY-MM-DD. Old todo.json files without due dates must keep working. Success is that I can add a task with a due date and `list` shows the date, with overdue tasks marked. That's everything. Write it.
