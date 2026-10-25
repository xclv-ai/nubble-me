# SPDX-License-Identifier: AGPL-3.0-only
"""Analytical checks for explicitly hypothetical decision models."""
import importlib.util
from pathlib import Path
import unittest

PATH = Path(__file__).resolve().parents[1] / "scripts/analyze_paper.py"
SPEC = importlib.util.spec_from_file_location("paper_analysis", PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class DecisionModelTests(unittest.TestCase):
    def test_verification_can_be_worthwhile_under_declared_model(self):
        values = MODULE.decision_values(.3, verification_cost=.5)
        self.assertAlmostEqual(values["act"], -1)
        self.assertAlmostEqual(values["maintain"], 0)
        self.assertAlmostEqual(values["verify"], 1.3)
        self.assertEqual(MODULE.choose(values), "verify")

    def test_verification_cost_can_make_maintaining_optimal(self):
        self.assertEqual(MODULE.choose(MODULE.decision_values(.1, verification_cost=.8)), "maintain")

    def test_known_high_probability_can_favor_action(self):
        self.assertEqual(MODULE.choose(MODULE.decision_values(.9, verification_cost=.8)), "act")

    def test_time_constraint_removes_verification(self):
        values = MODULE.decision_values(.3, verification_cost=.5, verification_feasible=False)
        self.assertIsNone(values["verify"])
        self.assertEqual(MODULE.choose(values), "maintain")

    def test_free_information_value_is_nonnegative(self):
        for i in range(101):
            self.assertGreaterEqual(MODULE.gross_information_value(i / 100), -1e-12)
        self.assertAlmostEqual(MODULE.gross_information_value(.4), 2.4)

    def test_verification_threshold_matches_direct_comparison(self):
        for i in range(1, 100):
            p = i / 100
            threshold = MODULE.gross_information_value(p)
            self.assertEqual(MODULE.choose(MODULE.decision_values(p, verification_cost=max(0, threshold - .001))), "verify")
            self.assertNotEqual(MODULE.choose(MODULE.decision_values(p, verification_cost=threshold + .001)), "verify")

    def test_representation_collision_has_no_common_optimal_action(self):
        self.assertEqual(MODULE.common_optimal_actions([
            {"act": -4, "maintain": 0}, {"act": 6, "maintain": 0}]), set())

    def test_ties_can_leave_a_common_optimal_action(self):
        self.assertEqual(MODULE.common_optimal_actions([
            {"act": 0, "maintain": 0}, {"act": -4, "maintain": 0}]), {"maintain"})

    def test_invalid_probabilities_are_rejected(self):
        for p in [-.1, 1.1]:
            with self.assertRaises(ValueError):
                MODULE.decision_values(p)

    def test_metadata_audit_does_not_count_unknown_as_url(self):
        row = MODULE.audit_record({"source_url": "unknown", "sections": [{"summary": "x", "condensed": "x", "standard": "x", "expanded": "x"}]})
        self.assertFalse(row["usable_source_url"])
        self.assertTrue(row["all_four_depths_present"])
        self.assertFalse(MODULE.audit_record({"source_url": "https://example.com/a", "sections": []})["all_four_depths_present"])


if __name__ == "__main__":
    unittest.main()
