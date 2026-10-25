# SPDX-License-Identifier: AGPL-3.0-only
"""Offline contract tests: real CLI, hand-authored fixture and adverse mutations."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "validate_release.py"


class ReleaseValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "schemas").mkdir()
        (self.root / "examples").mkdir()
        (self.root / "schemas" / "nubble.schema.json").write_bytes(
            (REPO / "schemas" / "nubble.schema.json").read_bytes())
        self.fixture = json.loads((REPO / "examples" / "nubble-example.json").read_text())

    def run_validation(self, data=None):
        (self.root / "examples" / "nubble-example.json").write_text(
            json.dumps(self.fixture if data is None else data), encoding="utf-8")
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--root", str(self.root),
             "--skip-optional-jsonschema"], capture_output=True, text=True,
            check=False)

    def test_valid_fictional_fixture_passes_offline(self):
        result = self.run_validation()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("stdlib contract", result.stdout)

    def test_dangling_span_is_rejected(self):
        data = copy.deepcopy(self.fixture)
        data["outputs"][0]["source_facts"][0]["evidence_span_ids"] = ["S999"]
        result = self.run_validation(data)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unknown span", result.stderr)

    def test_unknown_reader_context_is_rejected(self):
        data = copy.deepcopy(self.fixture)
        data["outputs"][0]["context_id"] = "nonexistent-reader"
        result = self.run_validation(data)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unknown context", result.stderr)

    def test_maintain_cannot_hide_an_executable_action(self):
        data = copy.deepcopy(self.fixture)
        data["outputs"][1]["proposed_next_step"] = copy.deepcopy(
            data["outputs"][0]["proposed_next_step"])
        result = self.run_validation(data)
        self.assertEqual(result.returncode, 1)
        self.assertIn("maintain requires no executable action", result.stderr)

    def test_abstain_cannot_claim_a_confident_unsupported_outcome(self):
        data = copy.deepcopy(self.fixture)
        inference = data["outputs"][2]["conditional_inference"]
        inference.update(status="confident", evidence_span_ids=[],
                         statement="The pilot will definitely improve conversion by 40%.")
        result = self.run_validation(data)
        self.assertEqual(result.returncode, 1)
        self.assertIn("abstain requires insufficient-evidence", result.stderr)

    def test_action_must_fit_hard_resources_and_authority(self):
        data = copy.deepcopy(self.fixture)
        action = data["outputs"][0]["proposed_next_step"]["action"]
        action.update(category="engineering", estimated_minutes=31)
        result = self.run_validation(data)
        self.assertEqual(result.returncode, 1)
        self.assertIn("resource limit", result.stderr)
        self.assertIn("authority", result.stderr)

    def test_missing_required_field_is_rejected(self):
        data = copy.deepcopy(self.fixture)
        del data["source"]["retrieval_scope"]
        result = self.run_validation(data)
        self.assertEqual(result.returncode, 1)
        self.assertIn("retrieval_scope", result.stderr)

    def test_markdown_duplicate_headings_and_explicit_ids_resolve(self):
        (self.root / "README.md").write_text(
            "# Guide\n[Second](notes.md#same-heading-1) [Span](notes.md#s1)\n"
            "```md\n[Illustrative only](does-not-exist.md)\n```\n")
        (self.root / "notes.md").write_text(
            '# Notes\n## Same heading\n## Same heading\n<a id="s1"></a>\n')
        result = self.run_validation()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_markdown_missing_anchor_is_rejected(self):
        (self.root / "README.md").write_text("# Guide\n[Bad](README.md#missing)\n")
        result = self.run_validation()
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing anchor", result.stderr)

    def test_markdown_missing_file_is_rejected(self):
        (self.root / "README.md").write_text("# Guide\n[Bad](absent.md)\n")
        result = self.run_validation()
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing local target", result.stderr)


if __name__ == "__main__":
    unittest.main()
