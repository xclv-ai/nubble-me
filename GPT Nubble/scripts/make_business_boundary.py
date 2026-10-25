#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Render proposed product boundaries; diagram assets are CC BY 4.0."""
from pathlib import Path
from make_figures import canvas, txt, card, arrow
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]


def main():
    fig, ax = canvas("Open core processes an item. Cloud keeps watch.",
                     "Proposed product scope - v0.2 ships research artifacts; runtime and service remain planned.", height=8.2)
    card(ax, .045, .495, .91, .325, fill="teal_light", edge="teal", lw=1.7)
    txt(ax, .07, .777, "OPEN CORE  /  AGPL TOOLING + OPEN RESEARCH", size=13, weight="bold", color="teal")
    txt(ax, .07, .731, "You supply the content and the decision context.", size=17, weight="bold")
    labels = [("SOURCE", "Available original\nand retrieval scope"),
              ("CONTEXT", "Your goal, plan\nand constraints"),
              ("SHORT", "Supported facts\nrelevant to you"),
              ("SO WHAT?", "Conditional impact\nand feasible options"),
              ("INSPECT", "Evidence links,\nexport and evaluation")]
    for i, (title, body) in enumerate(labels):
        x = .07 + i * .178
        txt(ax, x, .659, title, size=11.5, color="teal", weight="bold")
        txt(ax, x, .603, body, size=12.8)
    txt(ax, .07, .525, "Manual / on demand  •  Complete single-item task  •  No Cloud account required", size=12.5, color="teal")
    arrow(ax, (.5, .482), (.5, .435), color="amber", head=16)
    card(ax, .045, .125, .91, .295, fill="amber_light", edge="amber", lw=1.7)
    txt(ax, .07, .383, "PAID CLOUD  /  ONGOING INTELLIGENCE FOR YOUR BUSINESS", size=13, weight="bold", color="amber")
    features = [("WATCH", "Continuous sources\nand competitor coverage"),
                ("REMEMBER", "Business context\nand change history"),
                ("CONNECT", "Cross-source synthesis\nand conflicts"),
                ("PRIORITIZE", "A finite brief\nand material alerts"),
                ("FOLLOW UP", "Decision review\nand follow-up")]
    for i, (title, body) in enumerate(features):
        x = .07 + i * .178
        txt(ax, x, .316, title, size=11.5, color="amber", weight="bold")
        txt(ax, x, .259, body, size=12.6)
    txt(ax, .07, .163, "Find the signal, maintain the context, and notice when the situation changes.", size=13, weight="bold", color="amber")
    txt(ax, .5, .082, "Product-scope proposal. Runtime and paid intelligence remain planned.", size=12, ha="center", color="muted")
    output = ROOT / "figures"
    output.mkdir(exist_ok=True)
    for extension in ["svg", "png"]:
        target = output / f"nubble-open-core-cloud.{extension}"
        fig.savefig(target, dpi=180, metadata={"Date": None} if extension == "svg" else {"Software": "Nubble research diagrams"})
        if extension == "svg":
            target.write_text("\n".join(line.rstrip() for line in target.read_text().splitlines()) + "\n")
        print(target.relative_to(ROOT))
    plt.close(fig)


if __name__ == "__main__":
    main()
