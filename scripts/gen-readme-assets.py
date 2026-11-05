#!/usr/bin/env python3
"""Generate README image assets for dsh-library (docs/assets/).

Outputs (idempotent overwrite):
  dsh-library-flow-light.svg / dsh-library-flow-dark.svg
      Hero pipeline diagram. Two hand-written SVG files (vector — never
      rasterized to webp). Text inside is command/config tokens only
      (library_add, chunkSize, library_search, ...), so all five README
      languages share the same pair.

This repository ships no benchmark data, so no evidence chart and no
raster asset is produced. The family palette / CJK-font probe / WebP
quality constant stay here so a future benchmark can drop in an evidence
chart without rebuilding the script.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow (pip install pillow)
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageFont  # noqa: F401  (raster path, see docstring)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

# --- palette: PerryLink family (accent) + GitHub page backgrounds ----------
FAMILY = "#4B67B4"   # family accent (badges labelColor family uses #2B3245)
GREEN = {"light": "#16a34a", "dark": "#3fb950"}
ORANGE = {"light": "#bc4c00", "dark": "#d29922"}
SKIN = {
    "light": dict(bg="#ffffff", box="#f6f8fa", border="#d0d7de",
                  text="#1f2328", sub="#57606a", track="#eaeef2"),
    "dark": dict(bg="#0d1117", box="#161b22", border="#30363d",
                 text="#f0f6fc", sub="#8b949e", track="#21262d"),
}
WEBP_QUALITY = 90   # evidence charts, when benchmark data exists

# --- CJK font probe: Chinese must never render as tofu boxes ----------------
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",      # Microsoft YaHei
    r"C:\Windows\Fonts\simhei.ttf",    # SimHei
    r"C:\Windows\Fonts\Deng.ttf",      # DengXian
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
if FONT_PATH is None:
    sys.exit("FATAL: no CJK font found (looked for msyh.ttc, simhei.ttf, "
             "Deng.ttf, Noto Sans CJK, PingFang). Refusing to render Chinese "
             "as tofu boxes; install one of the probed fonts and re-run.")


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size)


# ---------------------------------------------------------------------------
# Hero pipeline SVG (light + dark). Three lanes, tokens only:
#   write path      library_add -> chunk -> embed -> dsh_library
#   read path       library_search -> hybrid -> MMR -> [n] result page
#   verification    library_cite_check / library_remove (purge residue)
# ---------------------------------------------------------------------------
LANES = [
    [
        ("library_add", "{ path, library }", None),
        ("chunkSize 900", "chunkOverlap 120", "accent"),
        ("embedding.provider", "hash · dims 256", None),
        ("dsh_library", "documents · chunks · purges", "accent"),
    ],
    [
        ("library_search", "{ query, library }", None),
        ("hybridWeight 0.6", "minRelevance 0.15", "accent"),
        ("diversityLambda 0.5", "lostMiddleHead/Tail 1", "accent"),
        ("[n] result page", "inject: true", "ok"),
    ],
]
CHIPS = [
    ("library_cite_check", "citation.minScore 40 · minSemantic 0.1"),
    ("library_remove", "purge.maxProbes 24 · signatureLength 4"),
]
FOOTER = "library/inject · library/purge — host-gated audit events"


def flow_svg(skin: str) -> str:
    s = SKIN[skin]
    w, h = 1200, 500
    bw, bh, gap = 240, 84, 40
    xs = [60 + i * (bw + gap) for i in range(4)]
    lane_y = [140, 260]
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img" aria-label="dsh-library pipeline">',
        '<title>dsh-library pipeline</title>',
        f'<rect width="{w}" height="{h}" rx="18" fill="{s["bg"]}"/>',
        f'<text x="60" y="62" fill="{s["text"]}" font-family="ui-sans-serif,'
        f'system-ui,sans-serif" font-size="30" font-weight="700">dsh-library</text>',
        f'<text x="60" y="94" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="15">library_add · library_remove · library_list · '
        f'library_search · library_cite_check · library_diagnose</text>',
        f'<line x1="60" y1="116" x2="1140" y2="116" stroke="{s["border"]}"/>',
    ]

    def box(x: int, y: int, bw_: int, bh_: int, label: str, sub: str,
            accent: str | None) -> None:
        stroke = (FAMILY if accent == "accent" else GREEN[skin] if accent == "ok"
                  else s["border"])
        parts.append(
            f'<rect x="{x}" y="{y}" width="{bw_}" height="{bh_}" rx="14" '
            f'fill="{s["box"]}" stroke="{stroke}" stroke-width="2"/>')
        parts.append(
            f'<text x="{x + bw_ // 2}" y="{y + 34}" fill="{s["text"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="15" font-weight="700">{label}</text>')
        parts.append(
            f'<text x="{x + bw_ // 2}" y="{y + 60}" fill="{s["sub"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="12">{sub}</text>')

    for row, y in enumerate(lane_y):
        for i, (label, sub, accent) in enumerate(LANES[row]):
            box(xs[i], y, bw, bh, label, sub, accent)
            if i < 3:
                ax = xs[i] + bw + 4
                ay = y + bh // 2
                parts.append(
                    f'<path d="M{ax} {ay}h{gap - 14}" stroke="{s["sub"]}" '
                    f'stroke-width="3"/>')
                parts.append(
                    f'<path d="M{ax + gap - 16} {ay - 7}l10 7-10 7" fill="none" '
                    f'stroke="{s["sub"]}" stroke-width="3" '
                    f'stroke-linecap="round" stroke-linejoin="round"/>')

    chip_y, chip_w, chip_h = 380, 520, 56
    for i, (label, sub) in enumerate(CHIPS):
        cx = 60 if i == 0 else 620
        parts.append(
            f'<rect x="{cx}" y="{chip_y}" width="{chip_w}" height="{chip_h}" '
            f'rx="12" fill="{s["box"]}" stroke="{ORANGE[skin]}" stroke-width="2"/>')
        parts.append(
            f'<text x="{cx + 24}" y="{chip_y + 26}" fill="{s["text"]}" '
            f'font-family="ui-monospace,monospace" font-size="14" '
            f'font-weight="700">{label}</text>')
        parts.append(
            f'<text x="{cx + 24}" y="{chip_y + 45}" fill="{s["sub"]}" '
            f'font-family="ui-monospace,monospace" font-size="12">{sub}</text>')

    parts.append(
        f'<text x="60" y="474" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="13">{FOOTER}</text>')
    parts.append('</svg>')
    return "\n".join(parts) + "\n"


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        with open(os.path.join(OUT, f"dsh-library-flow-{skin}.svg"),
                  "w", encoding="utf-8", newline="\n") as fh:
            fh.write(flow_svg(skin))
    print("wrote 2 SVG assets to docs/assets/ (no benchmark data — no "
          f"evidence chart; WebP quality constant {WEBP_QUALITY})")


if __name__ == "__main__":
    main()
