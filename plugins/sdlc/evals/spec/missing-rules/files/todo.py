"""A small command-line todo list. Tasks live in todo.json."""
import csv
import json
import sys
from pathlib import Path

STORE = Path("todo.json")


def load():
    if not STORE.exists():
        return []
    return json.loads(STORE.read_text())


def save(tasks):
    STORE.write_text(json.dumps(tasks, indent=2) + "\n")


def main(argv):
    if not argv:
        print("usage: todo.py add TEXT | list | done N | export")
        return 2
    cmd, args = argv[0], argv[1:]
    tasks = load()
    if cmd == "add":
        tasks.append({"text": " ".join(args), "done": False})
        save(tasks)
    elif cmd == "list":
        for i, t in enumerate(tasks, 1):
            print(f"{i}. [{'x' if t['done'] else ' '}] {t['text']}")
    elif cmd == "done":
        tasks[int(args[0]) - 1]["done"] = True
        save(tasks)
    elif cmd == "export":
        w = csv.writer(sys.stdout)
        w.writerow(["text", "done"])
        for t in tasks:
            w.writerow([t["text"], t["done"]])
    else:
        print(f"unknown command: {cmd}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
