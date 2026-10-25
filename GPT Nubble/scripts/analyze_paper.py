#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Reproduce a declared decision-model illustration and optional metadata audit.

This computes hypothetical payoffs, not Nubble/LLM/user performance. The optional
audit reads only five public JSON snapshots from a specified Git revision.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
import subprocess
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
AUDIT_REVISION = "d1a3f84a91c1616f0bdb9935f97b5c7ef7071f7a"
CATEGORIES = ["a16z-portfolio", "ai-branding", "ai-ecommerce", "ai-news", "pokpok-personalized"]


def decision_values(p, gain=6.0, loss=4.0, verification_cost=.5, verification_feasible=True):
    if not 0 <= p <= 1 or gain <= 0 or loss <= 0 or verification_cost < 0:
        raise ValueError("Invalid probability, payoff, or cost")
    return {"maintain": 0.0, "act": p * gain - (1 - p) * loss,
            "verify": p * gain - verification_cost if verification_feasible else None}


def choose(values):
    # Stable order retains the less demanding option when values tie.
    available = [(key, value) for key, value in values.items() if value is not None]
    best = max(value for _, value in available)
    return next(key for key, value in available if abs(value - best) <= 1e-12)


def gross_information_value(p, gain=6.0, loss=4.0):
    values = decision_values(p, gain, loss, verification_cost=0)
    return values["verify"] - max(values["act"], values["maintain"])


def common_optimal_actions(payoff_tables):
    if not payoff_tables:
        raise ValueError("At least one evidence-conditioned payoff table is required")
    optimal = [{key for key, value in table.items() if value == max(table.values())} for table in payoff_tables]
    return set.intersection(*optimal)


def audit_record(story):
    parsed = urlparse(story.get("source_url", ""))
    sections = story.get("sections", [])
    return {"usable_source_url": parsed.scheme in {"http", "https"} and bool(parsed.hostname),
            "all_four_depths_present": bool(sections) and all(
                isinstance(section, dict) and all(isinstance(section.get(key), str) and section[key].strip()
                    for key in ["summary", "condensed", "standard", "expanded"])
                for section in sections)}


def audit_repo(repo, revision):
    resolved = subprocess.check_output(["git", "-C", str(repo), "rev-parse", revision], text=True).strip()
    rows = []
    for category in CATEGORIES:
        path = f"client/public/data/feed/{category}/latest.json"
        raw = subprocess.check_output(["git", "-C", str(repo), "show", f"{resolved}:{path}"])
        data = json.loads(raw)
        checks = [audit_record(story) for story in data["stories"]]
        rows.append({"category": category, "snapshot_date": data["date"], "records": len(checks),
                     "usable_source_urls": sum(row["usable_source_url"] for row in checks),
                     "four_depth_records": sum(row["all_four_depths_present"] for row in checks),
                     "path": path, "sha256": hashlib.sha256(raw).hexdigest()})
    return {"repository": "https://github.com/xclv-ai/nubble-me", "revision": resolved,
            "selection": "All five client/public/data/feed/*/latest.json snapshots at the pinned revision",
            "scope": "Descriptive metadata audit only; URL syntax is not source truth or support validation",
            "rows": rows, "records": sum(row["records"] for row in rows),
            "usable_source_urls": sum(row["usable_source_urls"] for row in rows),
            "four_depth_records": sum(row["four_depth_records"] for row in rows)}


def draw_model(destination):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.colors import ListedColormap
    import numpy as np

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10,
                         "svg.fonttype": "none", "svg.hashsalt": "nubble-analytical-model-v03"})
    fig, axes = plt.subplots(1, 2, figsize=(10.6, 4.5), layout="constrained")
    p = np.linspace(0, 1, 501)
    act, maintain, verify = 10 * p - 4, np.zeros_like(p), 6 * p - .5
    axes[0].plot(p, maintain, color="#7B8582", label="Maintain")
    axes[0].plot(p, act, color="#B77A20", label="Act")
    axes[0].plot(p, verify, color="#185D58", label="Verify, cost k = 0.5")
    axes[0].plot(p, np.maximum.reduce([act, maintain, verify]), color="#202C29", lw=2.1, ls="--", label="Best feasible expected value")
    axes[0].set(xlabel="Declared probability p of eligibility", ylabel="Expected utility (declared units)", title="A. Utility depends on uncertainty and cost", xlim=(0, 1))
    axes[0].legend(loc="upper left", fontsize=8)
    axes[0].grid(alpha=.18)
    costs = np.linspace(0, 3, 301)
    region = np.zeros((len(costs), len(p)))
    labels = ["Maintain", "Act", "Verify"]
    for i, cost in enumerate(costs):
        for j, probability in enumerate(p):
            region[i, j] = ["maintain", "act", "verify"].index(choose(decision_values(float(probability), verification_cost=float(cost))))
    image = axes[1].imshow(region, origin="lower", extent=(0, 1, 0, 3), aspect="auto",
                           cmap=ListedColormap(["#DCE2DE", "#F0CF8D", "#5B9A8D"]), vmin=-.5, vmax=2.5)
    axes[1].plot(p, np.minimum(6 * p, 4 * (1 - p)), color="#202C29", ls="--", lw=1.5)
    axes[1].set(xlabel="Declared probability p of eligibility", ylabel="Verification cost k (declared units)", title="B. Preferred option when verification fits B")
    bar = fig.colorbar(image, ax=axes[1], ticks=[0, 1, 2], fraction=.045, pad=.025)
    bar.ax.set_yticklabels(labels)
    fig.suptitle("Illustrative decision model - not measured user or LLM performance", fontsize=12, fontweight="bold")
    for extension in ["png", "svg"]:
        path = destination / f"nubble-verification-model.{extension}"
        fig.savefig(path, dpi=220, metadata={"Date": None} if extension == "svg" else {"Software": "Nubble analytical illustration"})
        if extension == "svg":
            path.write_text("\n".join(line.rstrip() for line in path.read_text().splitlines()) + "\n")
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-repo", type=Path)
    parser.add_argument("--audit-revision", default=AUDIT_REVISION)
    parser.add_argument("--no-figures", action="store_true")
    args = parser.parse_args()
    destination = ROOT / "paper/analysis"
    destination.mkdir(exist_ok=True)
    rows = []
    for i in range(101):
        p = i / 100
        values = decision_values(p)
        rows.append({"p": p, **values, "preferred": choose(values), "gross_information_value": gross_information_value(p)})
    with (destination / "verification_model.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)
    result = {"classification": "Hypothetical model calculation, not experimental effectiveness evidence",
              "parameters": {"gain_if_eligible": 6, "loss_if_ineligible": 4, "verification_cost": .5,
                             "verification_assumption": "Perfect revelation of eligibility; optional choice after checking",
                             "time": "Verification is available only if its review time fits the remaining budget"},
              "max_gross_information_value": gross_information_value(.4),
              "example_p_03": decision_values(.3), "example_p_01_k_08": decision_values(.1, verification_cost=.8),
              "example_p_09_k_08": decision_values(.9, verification_cost=.8),
              "action_threshold_without_verification": .4, "verification_interval_k_05": [.5 / 6, 1 - .5 / 4]}
    (destination / "verification_model.json").write_text(json.dumps(result, indent=2) + "\n")
    if args.audit_repo:
        audit = audit_repo(args.audit_repo, args.audit_revision)
        (destination / "metadata_audit.json").write_text(json.dumps(audit, indent=2) + "\n")
        with (destination / "metadata_audit.csv").open("w", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=list(audit["rows"][0]))
            writer.writeheader(); writer.writerows(audit["rows"])
        print(f"Metadata audit: {audit['records']} records; {audit['usable_source_urls']} usable source URLs; {audit['four_depth_records']} four-depth records.")
    if not args.no_figures:
        draw_model(ROOT / "figures")
    print("Reproduced declared decision model; no human or model effectiveness result is claimed.")


if __name__ == "__main__":
    main()
