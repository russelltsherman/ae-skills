# User turns recorded into history.jsonl, in order, one per line below.
# Re-record with the plan's step 6 commands (isolated config, CLAUDE_CODE_DISABLE_AUTO_MEMORY=1, --disallowedTools Bash).

Read config.example.toml — I want to settle where our CLI keeps its config.
I tried comments in the old JSON config and the loader rejected them, so JSON is out.
Decided: TOML at ~/.config/mycli/config.toml.
