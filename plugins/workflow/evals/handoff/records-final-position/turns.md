# User turns recorded into history.jsonl, in order, one per line below.
# Re-record with the plan's step 6 commands, plus --disallowedTools Glob Grep Read Agent, so Claude can't inspect and cite the recording directory.

Let's store sessions in Redis.
Actually change that: sessions go in Postgres; Redis is one more service to run.
