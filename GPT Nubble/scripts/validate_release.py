#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Offline artifact checks, not an inference engine or a semantic truth oracle.

The stdlib checks a documented structural subset plus reference/constraint rules.
If installed, jsonschema additionally evaluates the published complete schema.
Internal implementation/audit memos are excluded from portable link checks.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
INTERNAL = {"REPO_REVIEW.md", "research/control-room-evidence.md"}
SKIP_DIRS = {".git", ".venv", "tmp", "dist", "__pycache__"}
OUTCOMES = {"act", "verify", "monitor", "maintain", "abstain"}


def structural(value, rule, schema, path, errors):
    if "$ref" in rule:
        target = schema
        for part in rule["$ref"].removeprefix("#/").split("/"):
            target = target[part]
        structural(value, target, schema, path, errors)
    types = rule.get("type")
    if types:
        types = [types] if isinstance(types, str) else types
        matches = {"object": isinstance(value, dict), "array": isinstance(value, list),
                   "string": isinstance(value, str), "null": value is None,
                   "boolean": isinstance(value, bool),
                   "number": isinstance(value, (int, float)) and not isinstance(value, bool),
                   "integer": isinstance(value, int) and not isinstance(value, bool)}
        if not any(matches.get(t, False) for t in types):
            errors.append(f"{path}: expected type {types}")
            return
    if "const" in rule and value != rule["const"]:
        errors.append(f"{path}: expected constant {rule['const']!r}")
    if "enum" in rule and value not in rule["enum"]:
        errors.append(f"{path}: value outside declared enum")
    if isinstance(value, dict):
        for key in rule.get("required", []):
            if key not in value:
                errors.append(f"{path}: missing required field {key}")
        properties = rule.get("properties", {})
        if rule.get("additionalProperties") is False:
            for key in value.keys() - properties.keys():
                errors.append(f"{path}: unexpected field {key}")
        for key, item in value.items():
            if key in properties:
                structural(item, properties[key], schema, f"{path}.{key}", errors)
    elif isinstance(value, list):
        if len(value) < rule.get("minItems", 0):
            errors.append(f"{path}: too few items")
        if "items" in rule:
            for i, item in enumerate(value):
                structural(item, rule["items"], schema, f"{path}[{i}]", errors)
    elif isinstance(value, str) and len(value) < rule.get("minLength", 0):
        errors.append(f"{path}: text too short")
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        if value < rule.get("minimum", float("-inf")):
            errors.append(f"{path}: below minimum")


def fixture_checks(data, schema, errors):
    structural(data, schema, schema, "fixture", errors)
    if errors:
        # Continue only when essential containers remain structurally safe.
        if not isinstance(data, dict) or not isinstance(data.get("source"), dict):
            return
    source = data.get("source", {})
    contexts = data.get("contexts", [])
    outputs = data.get("outputs", [])
    if not isinstance(contexts, list) or not isinstance(outputs, list):
        return
    spans = source.get("spans", [])
    span_ids = {s.get("id") for s in spans if isinstance(s, dict)}
    context_ids = [c.get("id") for c in contexts if isinstance(c, dict)]
    if len(context_ids) != len(set(context_ids)):
        errors.append("fixture: duplicate context IDs")
    context_map = {c["id"]: c for c in contexts if isinstance(c, dict) and "id" in c}
    if len(span_ids) != len(spans):
        errors.append("source: duplicate or invalid span IDs")
    for span in spans:
        if isinstance(span, dict) and span.get("text", "") not in source.get("full_text", ""):
            errors.append(f"source: span {span.get('id')} not present in full_text")

    def refs(ids, allowed, label):
        if isinstance(ids, list):
            for value in ids:
                if value not in allowed:
                    errors.append(f"{label}: unknown span or assumption {value}")

    for output in outputs:
        if not isinstance(output, dict):
            continue
        name = output.get("id", "output")
        context = context_map.get(output.get("context_id"))
        if context is None:
            errors.append(f"{name}: unknown context {output.get('context_id')}")
            continue
        refs(output.get("short", {}).get("evidence_span_ids", []), span_ids, name)
        for fact in output.get("source_facts", []):
            refs(fact.get("evidence_span_ids", []), span_ids, name)
        inference = output.get("conditional_inference", {})
        refs(inference.get("evidence_span_ids", []), span_ids, name)
        assumption_ids = {a.get("id") for a in context.get("assumptions", [])}
        refs(inference.get("assumption_ids", []), assumption_ids, name)
        outcome = output.get("outcome")
        if outcome not in OUTCOMES:
            errors.append(f"{name}: unknown outcome {outcome}")
        step = output.get("proposed_next_step", {})
        if outcome == "maintain" and (step.get("executable") is not False or step.get("action") is not None):
            errors.append(f"{name}: maintain requires no executable action")
        if outcome == "abstain":
            if inference.get("status") != "insufficient-evidence":
                errors.append(f"{name}: abstain requires insufficient-evidence inference status")
            if step.get("executable") is not False or step.get("action") is not None:
                errors.append(f"{name}: abstain requires no executable action")
        if outcome in {"act", "verify"} and (step.get("executable") is not True or not isinstance(step.get("action"), dict)):
            errors.append(f"{name}: act/verify requires an explicit proposed action")
        action = step.get("action")
        if isinstance(action, dict):
            limits = context.get("constraints", {})
            resources = limits.get("resources", {})
            if resources.get("hard"):
                for field, cap in [("estimated_minutes", "max_new_action_minutes"), ("estimated_spend_usd", "max_new_spend_usd")]:
                    if action.get(field, 0) > resources.get(cap, float("inf")):
                        errors.append(f"{name}: proposed action exceeds resource limit {cap}")
            authority = limits.get("authority", {})
            if authority.get("hard") and (action.get("category") not in authority.get("allowed_categories", []) or action.get("category") in authority.get("prohibited_categories", [])):
                errors.append(f"{name}: proposed action exceeds reader authority")


def visible_markdown(text):
    return re.sub(r"^```[^\n]*\n.*?^```\s*$", "", text, flags=re.M | re.S)


def anchors(text):
    result = set(re.findall(r'<a\s+(?:id|name)=[\"\']([^\"\']+)', text))
    counts = Counter()
    for title in re.findall(r"^#{1,6}\s+(.+)$", visible_markdown(text), re.M):
        slug = "".join(c for c in title.lower() if c.isalnum() or c in " -_").replace(" ", "-")
        suffix = f"-{counts[slug]}" if counts[slug] else ""
        counts[slug] += 1
        result.add(slug + suffix)
    return result


def markdown_checks(root, errors):
    checked = 0
    for path in sorted(root.rglob("*.md")):
        relative = path.relative_to(root)
        if str(relative) in INTERNAL or any(p in SKIP_DIRS for p in relative.parts):
            continue
        text = path.read_text(encoding="utf-8")
        if text.count("```") % 2:
            errors.append(f"{relative}: unbalanced code fence")
        for target in re.findall(r"!?\[[^\]]*\]\(([^)\n]+)\)", visible_markdown(text)):
            target = target.strip().strip("<>")
            if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", target):
                continue
            location, _, fragment = unquote(target).partition("#")
            dest = (path.parent / location).resolve() if location else path
            checked += 1
            if not dest.is_relative_to(root):
                errors.append(f"{relative}: local link escapes release root")
            elif not dest.is_file():
                errors.append(f"{relative}: missing local target {target}")
            elif fragment and dest.suffix == ".md" and fragment not in anchors(dest.read_text()):
                errors.append(f"{relative}: missing anchor {target}")
    return checked


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--skip-optional-jsonschema", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    errors = []
    try:
        data = json.loads((root / "examples/nubble-example.json").read_text())
        schema = json.loads((root / "schemas/nubble.schema.json").read_text())
        fixture_checks(data, schema, errors)
    except (OSError, ValueError, TypeError, KeyError) as error:
        errors.append(f"fixture/schema read or structure error: {error}")
        data = {}
    optional = "not requested"
    if not args.skip_optional_jsonschema:
        try:
            import jsonschema
        except ImportError:
            optional = "not installed; stdlib subset only"
        else:
            optional = "full JSON Schema validation enabled"
            try:
                jsonschema.Draft202012Validator.check_schema(schema)
                for error in jsonschema.Draft202012Validator(schema).iter_errors(data):
                    errors.append(f"JSON Schema: {error.message}")
            except (NameError, jsonschema.SchemaError) as error:
                errors.append(f"schema error: {error}")
    checked = markdown_checks(root, errors)
    for error in errors:
        print(error, file=sys.stderr)
    print(f"stdlib contract: {len(data.get('contexts', []))} contexts, {len(data.get('outputs', []))} outputs; {checked} local links; {len(errors)} errors; {optional}.")
    return bool(errors)


if __name__ == "__main__":
    raise SystemExit(main())
