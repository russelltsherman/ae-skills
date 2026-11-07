# todo

A small command-line todo list for one person.

Tasks are stored in `todo.json` in the current directory, as a JSON list of
objects with `text` and `done` fields.

## Usage

    python3 todo.py add "buy milk"   # add a task
    python3 todo.py list             # list tasks, numbered
    python3 todo.py done 2           # mark task 2 done

## Tests

    bash scripts/test.sh             # run every test
    bash scripts/test.sh --help      # options
