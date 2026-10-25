"""Portable scholarly-source and submission metadata checks."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_paper', ROOT / 'scripts/build_paper.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class PaperSubmissionTests(unittest.TestCase):
    def test_escape_keeps_citations_and_math(self):
        rendered = build.inline('Cost & scope: 5% at $p<0.4$ [@gao2023alce; @liu2023verifiability].')
        self.assertIn(r'Cost \& scope: 5\%', rendered)
        self.assertIn('$p<0.4$', rendered)
        self.assertIn(r'\citep{gao2023alce,liu2023verifiability}', rendered)

    def test_native_math_and_proof_environments(self):
        rendered = build.render_body('::: proposition Example\n\nA claim.\n\n```math\na_b=0\n```\n\n:::\n\n::: proof\n\nA proof.\n\n:::')
        self.assertIn(r'\begin{proposition}[Example]', rendered)
        self.assertIn('a_b=0', rendered)
        self.assertIn(r'\begin{proof}', rendered)
        self.assertNotIn('```', rendered)

    def test_author_gate_requires_real_metadata(self):
        errors = build.metadata_errors({'authors': [], 'title': 'A paper', 'abstract': 'An abstract'})
        self.assertTrue(any('author' in error.lower() for error in errors))

    def test_author_gate_rejects_placeholder(self):
        errors = build.metadata_errors({'authors': [{'name': 'Author pending', 'affiliation': 'TBD'}], 'title': 'A paper', 'abstract': 'Abstract'})
        self.assertTrue(errors)

    def test_unknown_citation_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Unknown citation'):
            build.validate_citations('Claim [@missing].', {'known'})

    def test_bibliography_is_not_rendered_twice(self):
        text = build.render_body('## 1. Introduction\n\nText.\n\n<!-- GENERATED-REFERENCES -->\n\nHidden references')
        self.assertNotIn('Hidden references', text)

    def test_abstract_metadata_limit(self):
        errors = build.metadata_errors({'authors': [{'name': 'Jane Example', 'affiliation': 'Independent Researcher'}], 'title': 'Test', 'abstract': 'x'*1921})
        self.assertTrue(any('1920' in error for error in errors))

    def test_source_allowlist_excludes_build_outputs(self):
        for path in ['main.pdf','main.aux','main.log','/tmp/private.tex','../private.tex','figures/product.png']:
            self.assertFalse(build.allowed_source(path), path)
        for path in ['main.tex','main.bbl','references.bib','figures/nubble-framework.png']:
            self.assertTrue(build.allowed_source(path), path)


if __name__ == '__main__':
    unittest.main()
