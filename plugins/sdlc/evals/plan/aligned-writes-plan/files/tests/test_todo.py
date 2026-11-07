import os
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import todo  # noqa: E402


class TodoTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.cwd = os.getcwd()
        os.chdir(self.dir)

    def tearDown(self):
        os.chdir(self.cwd)

    def run_cmd(self, *argv):
        out = StringIO()
        with redirect_stdout(out):
            code = todo.main(list(argv))
        return code, out.getvalue()

    def test_add_then_list(self):
        self.run_cmd("add", "buy", "milk")
        code, out = self.run_cmd("list")
        self.assertEqual(code, 0)
        self.assertEqual(out, "1. [ ] buy milk\n")

    def test_done(self):
        self.run_cmd("add", "a")
        self.run_cmd("done", "1")
        self.assertEqual(self.run_cmd("list")[1], "1. [x] a\n")


if __name__ == "__main__":
    unittest.main()
