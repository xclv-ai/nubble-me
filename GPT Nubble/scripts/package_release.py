#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Export curated research files without legacy history or private memos."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ["README.md", "METHOD.md", "WHAT_IS_NUBBLE.md", "CORE_VS_CLOUD.md",
         "LICENSE", "LICENSE.md", "LICENSE_STRATEGY.md", "NOTICE.md", "CITATION.md",
         "CONTRIBUTING.md", "SECURITY.md", "CHANGELOG.md", "requirements.txt", ".gitignore", ".gitattributes",
         "research/LITERATURE_REVIEW.md", "research/sources.json", "research/related-work-sources.json",
         "research/evaluation-sources.json", "research/related-work-notes.md", "research/evaluation-notes.md",
         "output/pdf/nubble-method-paper.pdf"]
DIRECTORIES = ["paper", "figures", "examples", "prompts", "schemas", "evaluation", "scripts", "tests"]


def main():
    subprocess.run([sys.executable, str(ROOT / "scripts/validate_release.py")], check=True)
    paths = {ROOT / name for name in FILES}
    for directory in DIRECTORIES:
        paths.update(p for p in (ROOT / directory).rglob("*")
                     if p.is_file() and "__pycache__" not in p.parts and p.suffix not in {".pyc", ".pyo"})
    manifest = []
    for path in sorted(paths):
        if not path.is_file() or not path.resolve().is_relative_to(ROOT):
            raise ValueError(f"Missing or nonportable release input: {path.name}")
        data = path.read_bytes()
        manifest.append({"path": str(path.relative_to(ROOT)), "bytes": len(data),
                         "sha256": hashlib.sha256(data).hexdigest()})
    release = {"version": "0.2", "research_status": "proposal-no-controlled-effectiveness-results",
               "code_license": "AGPL-3.0-only", "research_license": "CC-BY-4.0",
               "exclusions": ["legacy Git history", "parent application", "private implementation/audit memos", "credentials", "unpublished dashboard contents"],
               "files": manifest}
    destination = ROOT / "dist"
    destination.mkdir(exist_ok=True)
    manifest_bytes = (json.dumps(release, ensure_ascii=False, indent=2) + "\n").encode()
    (destination / "release-manifest.json").write_bytes(manifest_bytes)
    archive = destination / "nubble-method-v0.2.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        entries = [(entry["path"], (ROOT / entry["path"]).read_bytes()) for entry in manifest]
        entries.append(("release-manifest.json", manifest_bytes))
        for name, data in entries:
            info = zipfile.ZipInfo("nubble-method-v0.2/" + name, date_time=(2026, 10, 25, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            bundle.writestr(info, data)
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None, "Corrupt archive member"
        assert len(bundle.namelist()) == len(manifest) + 1
    print(f"Created {archive.name}: {len(manifest)} files plus checksum manifest, {archive.stat().st_size:,} bytes.")


if __name__ == "__main__":
    main()
