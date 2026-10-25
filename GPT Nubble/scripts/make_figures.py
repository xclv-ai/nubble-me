#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Reproduce the original conceptual figures for the Nubble Method paper.

Requirements: Python 3 and Matplotlib. No external fonts or assets are used.
Run from any directory; outputs default to the repository's figures/ directory.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


COLORS = {
    "paper": "#F8F5ED",
    "white": "#FFFDF7",
    "ink": "#222C2C",
    "muted": "#52605E",
    "teal": "#185D58",
    "teal_light": "#E4EEE8",
    "amber": "#B36C14",
    "amber_light": "#F8E9CA",
    "rose": "#92534E",
    "rose_light": "#F2E4DF",
    "line": "#B5BFBA",
    "gray_light": "#EDEFEA",
}

STATUS = "Proposed framework — no performance results"

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 15,
        "text.color": COLORS["ink"],
        "axes.labelcolor": COLORS["ink"],
        "svg.fonttype": "none",
        "svg.hashsalt": "nubble-method-conceptual-figures-v1",
        "figure.facecolor": COLORS["paper"],
        "savefig.facecolor": COLORS["paper"],
        "lines.solid_capstyle": "round",
    }
)


def canvas(title: str, subtitle: str, height: float = 7.2):
    fig = plt.figure(figsize=(12.8, height))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    txt(ax, 0.04, 0.953, title, size=25, weight="bold", family="DejaVu Serif")
    txt(ax, 0.04, 0.903, subtitle, size=14.5, color="muted")
    ax.plot([0.04, 0.96], [0.867, 0.867], color=COLORS["line"], lw=1)
    txt(ax, 0.04, 0.034, STATUS, size=12.5, color="muted")
    txt(ax, 0.96, 0.034, "NUBBLE METHOD  /  CONCEPTUAL", size=10.5,
        color="muted", ha="right", weight="bold")
    return fig, ax


def txt(ax, x, y, text, *, size=15, weight="normal", color="ink",
        ha="left", va="center", family="DejaVu Sans", linespacing=1.35):
    return ax.text(x, y, text, fontsize=size, fontweight=weight,
                   color=COLORS.get(color, color), ha=ha, va=va,
                   fontfamily=family, linespacing=linespacing,
                   transform=ax.transAxes, zorder=5)


def card(ax, x, y, w, h, *, fill="white", edge="line", lw=1.25,
         radius=0.012):
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.006,rounding_size={radius}",
        linewidth=lw, edgecolor=COLORS.get(edge, edge),
        facecolor=COLORS.get(fill, fill), transform=ax.transAxes, zorder=2,
    )
    ax.add_patch(patch)
    return patch


def arrow(ax, start, end, *, color="teal", style="-", lw=1.7,
          connectionstyle="arc3,rad=0", head=13):
    patch = FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=head,
        linewidth=lw, color=COLORS.get(color, color), linestyle=style,
        shrinkA=0, shrinkB=0, connectionstyle=connectionstyle,
        transform=ax.transAxes, zorder=3,
    )
    ax.add_patch(patch)
    return patch


def line(ax, points, *, color="teal", lw=1.7, style="-"):
    xs, ys = zip(*points)
    ax.plot(xs, ys, color=COLORS.get(color, color), lw=lw, ls=style,
            transform=ax.transAxes, zorder=1)


def framework():
    fig, ax = canvas(
        "Three representations, one source of evidence",
        "Nubble selects and interprets information against an explicit reader context and a limited attention budget.",
        height=7.5,
    )

    card(ax, 0.367, 0.727, 0.586, 0.103, fill="teal_light", edge="teal")
    txt(ax, 0.388, 0.798, "READER CONTEXT", size=12, weight="bold", color="teal")
    txt(ax, 0.388, 0.756, "Goal  •  current plan  •  constraints  •  decision horizon", size=15)
    arrow(ax, (0.508, 0.721), (0.508, 0.662), style="--", color="teal", head=12)
    arrow(ax, (0.814, 0.721), (0.814, 0.662), style="--", color="teal", head=12)
    txt(ax, 0.177, 0.777, "LIMITED ATTENTION", size=12, weight="bold", color="muted", ha="center")
    txt(ax, 0.177, 0.736, "Choose depth; preserve access.", size=13.5, color="muted", ha="center")

    positions = [0.047, 0.367, 0.687]
    width, y, height = 0.266, 0.333, 0.317
    fills = ["white", "teal_light", "amber_light"]
    edges = ["muted", "teal", "amber"]
    for x, fill, edge in zip(positions, fills, edges):
        card(ax, x, y, width, height, fill=fill, edge=edge, lw=1.5)
    headings = [("FULL", "Available original"), ("SHORT", "Personalized selection"), ("SO WHAT?", "Conditional implication")]
    for x, (label, heading), color in zip(positions, headings, edges):
        txt(ax, x + 0.018, 0.615, label, size=12, weight="bold", color=color)
        txt(ax, x + 0.018, 0.565, heading, size=17, weight="bold")

    txt(ax, 0.065, 0.468, "Original text and source spans\nAttribution and retrieval scope\nA snippet remains a snippet", size=14.7)
    txt(ax, 0.385, 0.468, "What matters to this reader?\nSelect source-supported facts\nCompress within the budget", size=14.7)
    txt(ax, 0.705, 0.468, "What could this change?\nLabel assumptions\nand uncertainty\nPropose a feasible next step", size=14.3)
    txt(ax, 0.065, 0.365, "Preserved evidence", size=12.5, weight="bold", color="muted")
    txt(ax, 0.385, 0.365, "Generated representation", size=12.5, weight="bold", color="teal")
    txt(ax, 0.705, 0.365, "Generated proposal", size=12.5, weight="bold", color="amber")

    arrow(ax, (0.319, 0.516), (0.359, 0.516), color="teal")
    arrow(ax, (0.639, 0.516), (0.679, 0.516), color="amber")

    # A support path bypasses the generated summary: factual support for an
    # implication must remain linked to the source itself.
    line(ax, [(0.179, 0.326), (0.179, 0.263), (0.820, 0.263)], color="teal")
    arrow(ax, (0.820, 0.263), (0.820, 0.326), color="teal", head=12)
    txt(ax, 0.500, 0.275, "Direct source evidence supports both generated views", size=13,
        weight="bold", color="teal", ha="center", va="bottom")

    card(ax, 0.047, 0.104, 0.906, 0.102, fill="gray_light", edge="line")
    txt(ax, 0.067, 0.171, "EVIDENCE ACCESS", size=11.5, weight="bold", color="muted")
    txt(ax, 0.067, 0.130,
        "Both generated views link to the original; generated prose never reconstructs the original.",
        size=14.1)
    return fig


def evidence_graph():
    fig, ax = canvas(
        "From evidence to a conditional next step",
        "Keep source facts, reader context, assumptions, inferences and proposed actions separately inspectable.",
        height=8.1,
    )
    card(ax, 0.047, 0.563, 0.267, 0.247, fill="white", edge="teal", lw=1.5)
    txt(ax, 0.066, 0.772, "SOURCE FACTS", size=12, weight="bold", color="teal")
    txt(ax, 0.066, 0.715, "Source-supported facts", size=16, weight="bold")
    txt(ax, 0.066, 0.632, "Claim → exact source span\nProvenance, scope and date\nOmissions remain unknown", size=14.5)

    card(ax, 0.047, 0.355, 0.267, 0.166, fill="teal_light", edge="teal")
    txt(ax, 0.066, 0.487, "EXPLICIT READER CONTEXT", size=12, weight="bold", color="teal")
    txt(ax, 0.066, 0.423, "Goal and current plan\nConstraints and horizon", size=14.7)

    card(ax, 0.373, 0.478, 0.267, 0.332, fill="amber_light", edge="amber", lw=1.5)
    txt(ax, 0.392, 0.772, "CONDITIONAL INFERENCE", size=12, weight="bold", color="amber")
    txt(ax, 0.392, 0.712, "What might follow", size=17, weight="bold")
    txt(ax, 0.392, 0.622, "If facts and context hold,\nthis consequence may follow.\nState the reasoning and\nwhat would change the\nconclusion.", size=14.4)
    txt(ax, 0.392, 0.509, "Inference ≠ source fact.", size=13, weight="bold", color="amber")

    card(ax, 0.373, 0.355, 0.267, 0.076, fill="rose_light", edge="rose")
    txt(ax, 0.392, 0.407, "ASSUMPTIONS", size=11.6, weight="bold", color="rose")
    txt(ax, 0.392, 0.377, "Explicit and testable", size=12.6, color="rose")

    card(ax, 0.699, 0.478, 0.254, 0.332, fill="white", edge="ink", lw=1.5)
    txt(ax, 0.718, 0.772, "PROPOSED ACTION", size=12, weight="bold", color="ink")
    txt(ax, 0.718, 0.712, "A feasible next step", size=17, weight="bold")
    txt(ax, 0.718, 0.620, "Who could do what?\nWhen? Under what condition?\nLink to evidence and\nthe reader’s constraints.", size=14.3)
    txt(ax, 0.718, 0.509, "Reader retains the decision.", size=13, weight="bold", color="muted")

    arrow(ax, (0.320, 0.688), (0.365, 0.688), color="teal")
    arrow(ax, (0.320, 0.443), (0.365, 0.548), color="teal", style="--")
    arrow(ax, (0.507, 0.438), (0.507, 0.470), color="rose", style="--", head=12)
    arrow(ax, (0.646, 0.646), (0.691, 0.646), color="amber")
    line(ax, [(0.180, 0.816), (0.180, 0.837), (0.325, 0.837)], color="teal", lw=1.1)
    line(ax, [(0.685, 0.837), (0.826, 0.837), (0.826, 0.816)], color="teal", lw=1.1)
    txt(ax, 0.505, 0.837, "Evidence links remain available throughout", size=11.5, color="teal", ha="center", va="center")

    txt(ax, 0.047, 0.300, "POSSIBLE DECISION STATUSES", size=11.5, weight="bold", color="muted")
    txt(ax, 0.953, 0.300, "Select by support, feasibility and risk", size=12.3, color="muted", ha="right")
    outcomes = [
        ("Act", "Take a supported\nnext step.", "teal_light", "teal"),
        ("Verify", "Resolve a material\nunknown first.", "teal_light", "teal"),
        ("Monitor", "Watch a stated\ntrigger or horizon.", "teal_light", "teal"),
        ("Maintain plan", "Supported inaction:\nno change warranted.", "amber_light", "amber"),
        ("Abstain", "Insufficient evidence\nor unresolved risk.", "rose_light", "rose"),
    ]
    for i, (name, body, fill, edge) in enumerate(outcomes):
        x = 0.047 + i * 0.185
        card(ax, x, 0.099, 0.166, 0.159, fill=fill, edge=edge, lw=1.1)
        txt(ax, x + 0.012, 0.221, name, size=15.2, weight="bold", color=edge)
        txt(ax, x + 0.012, 0.150, body, size=12.7)
    return fig


def study_design():
    fig, ax = canvas(
        "A study to isolate the So-What Layer",
        "Proposed preregistered comparison under the same attention budget; no empirical results shown.",
        height=7.7,
    )

    txt(ax, 0.047, 0.813, "MATCHED INPUTS", size=12, weight="bold", color="muted")
    inputs = [
        (0.637, "Source", "Same available original"),
        (0.465, "Reader context", "Goal, plan, constraints\nand decision horizon"),
        (0.293, "Decision task", "Judge a feasible next step"),
    ]
    for y, title, detail in inputs:
        card(ax, 0.047, y, 0.224, 0.125, fill="white", edge="line")
        txt(ax, 0.063, y + 0.088, title, size=16, weight="bold")
        txt(ax, 0.063, y + 0.038, detail, size=12.4, color="muted")

    # Randomize representation within counterbalanced source/context/task blocks.
    line(ax, [(0.280, 0.699), (0.301, 0.699), (0.301, 0.355), (0.280, 0.355)], color="muted", lw=1.3)
    arrow(ax, (0.302, 0.528), (0.356, 0.528), color="muted", head=12)
    txt(ax, 0.329, 0.802, "RANDOMIZE", size=11.3, weight="bold", color="muted", ha="center")
    txt(ax, 0.329, 0.766, "representation", size=11.5, color="muted", ha="center")
    line(ax, [(0.352, 0.326), (0.352, 0.725)], color="muted", lw=1.3)

    arms = [
        (0.677, "A", "Original only", "white", "muted"),
        (0.544, "B", "Generic summary", "gray_light", "muted"),
        (0.411, "C", "Personalized summary", "teal_light", "teal"),
        (0.278, "D", "Personalized + So What", "amber_light", "amber"),
    ]
    for y, label, description, fill, edge in arms:
        arrow(ax, (0.352, y + 0.048), (0.374, y + 0.048), color="muted", lw=1.2, head=10)
        card(ax, 0.382, y, 0.286, 0.096, fill=fill, edge=edge, lw=1.3)
        txt(ax, 0.398, y + 0.048, label, size=17, weight="bold", color=edge)
        txt(ax, 0.430, y + 0.048, description, size=15, weight="bold")
        line(ax, [(0.674, y + 0.048), (0.706, y + 0.048)], color="muted", lw=1.1)
    line(ax, [(0.706, 0.326), (0.706, 0.725)], color="muted", lw=1.3)
    arrow(ax, (0.706, 0.528), (0.744, 0.528), color="muted", head=12)

    card(ax, 0.753, 0.278, 0.200, 0.495, fill="white", edge="ink", lw=1.5)
    txt(ax, 0.770, 0.737, "BLINDED ASSESSMENT", size=11.5, weight="bold")
    txt(ax, 0.770, 0.673, "Decision quality", size=16, weight="bold")
    txt(ax, 0.770, 0.611, "Task-specific rubric\nRaters masked to arm", size=13.7)
    ax.plot([0.770, 0.936], [0.551, 0.551], color=COLORS["line"], lw=1)
    txt(ax, 0.770, 0.513, "SUPPORT AND ERRORS", size=11.5, weight="bold", color="teal")
    txt(ax, 0.770, 0.415, "Evidence support\nUnsupported claims\nContext / action errors\nAppropriate inaction", size=13.7)
    txt(ax, 0.770, 0.308, "Report uncertainty.", size=12, color="muted")

    card(ax, 0.047, 0.092, 0.906, 0.129, fill="teal_light", edge="teal")
    txt(ax, 0.065, 0.186, "CONTROL THE ATTENTION BUDGET", size=11.7, weight="bold", color="teal")
    txt(ax, 0.065, 0.144, "All arms: equal total time and original-source access; counterbalanced task blocks.", size=14)
    txt(ax, 0.065, 0.108, "C and D: equal total generated-word budget, including the So-What text in D.", size=14, weight="bold")
    return fig



def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path,
                        default=Path(__file__).resolve().parents[1] / "figures")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    specs = [
        ("nubble-framework", framework, "Three representations, one source of evidence"),
        ("nubble-evidence-graph", evidence_graph, "From evidence to a conditional next step"),
        ("nubble-study-design", study_design, "A study to isolate the So-What Layer"),
    ]
    for name, build, title in specs:
        fig = build()
        for fmt in ("svg", "png"):
            metadata = {"Title": title, "Description": STATUS,
                        "Creator": "Nubble Method"}
            if fmt == "svg":
                metadata["Date"] = None
            else:
                metadata = {"Title": title, "Description": STATUS,
                            "Software": "Nubble Method / Matplotlib"}
            output = args.output_dir / f"{name}.{fmt}"
            fig.savefig(output, format=fmt, dpi=240, metadata=metadata)
            print(output)
        plt.close(fig)


if __name__ == "__main__":
    main()
