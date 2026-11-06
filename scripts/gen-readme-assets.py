#!/usr/bin/env python3
"""README visuals for dsh-library — read off the plugin's real pipeline.

Every number, label and token in the two figures comes from this repository:

  src/config.ts     chunkSize 900 / chunkOverlap 120 / dims 256 / maxFileBytes
                    5 MiB / topK 8 / hybridWeight 0.6 / minRelevance 0.15 /
                    diversityLambda 0.5 / lostMiddleHead|Tail 1 /
                    maxResultChars 16000 / citation 150-40-0.1 / purge 4-24
  src/index.ts      add: path → chunkText → embed → dsh_library documents+chunks;
                    search: hybrid score → MMR (candidate pool ≤ 500) → relevance
                    filter → cut to topK → avoidLostMiddle → char budget →
                    `[n] snippet` page; citeCheck (fuzzy + semantic), remove
                    (verifyPurge + a purges record), diagnose
  src/embedding.ts  hash = word tokens + character tri-grams, FNV-1a signed
                    bucket, L2-normalised (cosine = dot product); command =
                    JSON lines both ways; ollama falls back to hash
  src/text.ts       tokenisation the scores are built on
  src/quality/chunk-visual.ts
                    sliding window, step = chunkSize - chunkOverlap = 780

The two English page rows in the hero are the verbatim snippets this README's
own "示例" block prints for `library_search` (Observed from README.md:161-167;
tests/index.spec.ts:46-64; src/index.ts:830-836); nothing on the page is made up.

Two figures:

  hero 1440×576 (Pillow, zh/en × light/dark) — 4 webp files
      Left column: kicker, name, two value lines, subtitle, meta, footer.
      Right: the ingest ribbon (one document sliced into overlapping windows,
      embedded locally), the hit page carrying `[n]` markers with the strongest
      two pinned to head and tail, and the two probes that make citations and
      deletions checkable.

  flow 1100×660 (hand-written SVG, light/dark) — 2 files
      A bus, not a five-box row: one storage-domain bar in the middle, with the
      ingest band above it (gate → sliding window → embedder → write) and the
      retrieval band below it (query + the same domain → four narrowing stages
      → the pinned page). Both bands touch that one bar; nothing else connects
      them.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow + Windows fonts msyh.ttc / msyhbd.ttc / consola.ttf.
"""
from __future__ import annotations

import os
from html import escape

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_MONO_BOLD = r"C:\Windows\Fonts\consolab.ttf"
FONT_FILES = {"cjk": FONT_CJK, "cjk_bold": FONT_CJK_BOLD,
              "mono": FONT_MONO, "mono_bold": FONT_MONO_BOLD}
for _path in FONT_FILES.values():
    if not os.path.exists(_path):
        raise SystemExit(f"FATAL: font missing: {_path}")

# --------------------------------------------------------------------------- palette
# Family accent #4B67B4 (deep #8496f5); page backgrounds #f9f6fd→#e4eaf8 and
# #131a2a→#0c1016 as specified for this batch.
SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        card="#ffffff", edge="#e6e2ef",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", accent2="#1f7a4d",
        pill="#ece7f9", band="#f5f2fb", grid="#e7e4f0",
        shadow=(32, 26, 64), glow2="#7a68c9",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        card="#1b2231", edge="#2e374b",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", accent2="#3fb950",
        pill="#242d42", band="#202839", grid="#262f42",
        shadow=(0, 0, 0), glow2="#8496f5",
    ),
}

_FONTS: dict[tuple[float, str], ImageFont.FreeTypeFont] = {}


def font(size: float, kind: str = "cjk") -> ImageFont.FreeTypeFont:
    key = (size, kind)
    cached = _FONTS.get(key)
    if cached is None:
        cached = ImageFont.truetype(FONT_FILES[kind], size)
        _FONTS[key] = cached
    return cached


def hx(color: str) -> tuple[int, int, int]:
    color = color.lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))


# --------------------------------------------------------------------------- primitives
def gradient(w: int, h: int, top: str, bottom: str) -> Image.Image:
    base = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(base)
    a, b = hx(top), hx(bottom)
    for y in range(h):
        t = 0.12 * (y / h) + 0.88 * (y / h) ** 1.4
        draw.line([(0, y), (w, y)],
                  fill=tuple(int(p + (q - p) * t) for p, q in zip(a, b)))
    return base


def glow(img: Image.Image, cx: int, cy: int, radius: int, color: tuple,
         alpha: int) -> Image.Image:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for step in range(9, 0, -1):
        rr = radius * step / 9
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                     fill=color + (int(alpha * (1 - step / 10)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def card(img: Image.Image, box: tuple, s: dict, radius: int = 20,
         spread: int = 22, fill: str | None = None,
         edge: str | None = None) -> Image.Image:
    """Rounded card with a soft drop shadow on the gradient background."""
    x0, y0, x1, y1 = box
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for i in range(spread, 0, -3):
        sd.rounded_rectangle([x0 - i // 6, y0 + i // 2, x1 + i // 6, y1 + i],
                             radius=radius + i // 6,
                             fill=s["shadow"] + (int(10 * (1 - i / spread)),))
    base = Image.alpha_composite(img.convert("RGBA"),
                                 shadow.filter(ImageFilter.GaussianBlur(9)))
    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle(box, radius=radius, fill=hx(fill or s["card"]),
                           outline=hx(edge or s["edge"]), width=2)
    return base.convert("RGB")


_SCRATCH = ImageDraw.Draw(Image.new("RGB", (8, 8)))


def measure(text: str, size: float, kind: str) -> float:
    return _SCRATCH.textlength(text, font=font(size, kind))


def require(text: str, size: float, kind: str, max_w: float, what: str) -> None:
    width = measure(text, size, kind)
    if width > max_w + 0.4:
        raise SystemExit(f"FATAL: {what} overflows: {text!r} needs "
                         f"{width:.1f}px > {max_w}px")


def fit(text: str, kind: str, max_w: float, start: float,
        floor: float) -> float:
    size = start
    while size > floor:
        if measure(text, size, kind) <= max_w:
            return size
        size -= 1
    raise SystemExit(f"FATAL: text does not fit {max_w}px at >= {floor}px: "
                     f"{text!r}")


def fit_lines(lines: list[str], kind: str, max_w: float, start: float,
              floor: float) -> float:
    return min(fit(line, kind, max_w, start, floor) for line in lines)


def pill(img: Image.Image, xy: tuple[int, int], text: str, s: dict,
         size: float = 17, fg: str | None = None, bg: str | None = None,
         kind: str = "cjk_bold") -> tuple[int, int]:
    draw = ImageDraw.Draw(img)
    f = font(size, kind)
    width = draw.textlength(text, font=f)
    x, y = xy
    height = size + 20
    draw.rounded_rectangle([x, y, x + width + 30, y + height],
                           radius=height / 2, fill=hx(bg or s["pill"]))
    draw.text((x + 15, y + height / 2), text, font=f, fill=hx(fg or s["accent"]),
              anchor="lm")
    return int(x + width + 30), int(y + height)


def chip(img: Image.Image, x_right: int, y: int, text: str, fg: str, bg: str,
         size: float = 10.5, kind: str = "cjk_bold", pad: int = 9,
         height: int = 20) -> int:
    """A pill anchored on its right edge; returns its left edge."""
    draw = ImageDraw.Draw(img)
    f = font(size, kind)
    width = draw.textlength(text, font=f)
    x = x_right - width - pad * 2
    draw.rounded_rectangle([x, y, x_right, y + height], radius=height / 2,
                           fill=hx(bg))
    draw.text((x + pad, y + height / 2), text, font=f, fill=hx(fg),
              anchor="lm")
    return int(x)


# --------------------------------------------------------------------------- hero copy
HERO = {
    "zh": dict(
        kicker="DeepSeek Harness 插件 · 本地知识库",
        title="dsh-library",
        value=["本地 md/txt，滑窗切片入库", "结果页每条命中都带 [n]"],
        sub=["library_add 切片、嵌入，写进 dsh_library 存储域；",
             "library_search 打分、重排、过滤后返回带 [n] 的结果页。"],
        meta="chunkSize 900 / overlap 120 · hash 256 维 · topK 8 · 零模型下载",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        ribbon="进库 · 滑窗切片 + 本地嵌入",
        ribbon_param="chunkSize 900 · overlap 120",
        doc="spec.md · md",
        slices="4 片 · 256 维",
        embed="hash / command / ollama",
        page_title="命中页 · 每条带 [n] 来源标记",
        page_sub="topK 8 · maxResultChars 16000 · 每条含 documentId 与 seq",
        row1="DeepSeek Harness is a plugin-based agent harness…",
        row2="The recipe for sourdough starts with a levain…",
        row3="其余命中 · 按 MMR 顺序（relevance ≥ 0.15）",
        row4="次强切片钉在尾部（lostMiddleTail 1）",
        head="钉首位",
        tail="钉末位",
        page_foot="最强两片钉在首尾 · inject 时记 library/inject（宿主门控）",
        probe_title="探针",
        probe1="library_cite_check 模糊 + 语义双判每个 [n]（40 / 0.1）",
        probe2="library_remove 用 4-gram 签名探残留（≤ 24 次），残留即报告",
    ),
    "en": dict(
        kicker="DeepSeek Harness plugin · local knowledge base",
        title="dsh-library",
        value=["Your md/txt, chunked locally", "every hit carries a [n]"],
        sub=["library_add chunks, embeds and writes into dsh_library;",
             "library_search scores, re-ranks and returns a [n] page."],
        meta="chunkSize 900 / overlap 120 · 256-d hash · topK 8 · zero downloads",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        ribbon="ingest · sliding window + local embedding",
        ribbon_param="chunkSize 900 · overlap 120",
        doc="spec.md · md",
        slices="4 chunks · 256-d",
        embed="hash / command / ollama",
        page_title="hit page · every hit carries [n]",
        page_sub="topK 8 · maxResultChars 16000 · each hit has documentId and seq",
        row1="DeepSeek Harness is a plugin-based agent harness…",
        row2="The recipe for sourdough starts with a levain…",
        row3="remaining hits · in MMR order (relevance ≥ 0.15)",
        row4="second-strongest pinned to the tail (lostMiddleTail 1)",
        head="head",
        tail="tail",
        page_foot="strongest two pinned head + tail · inject logs library/inject",
        probe_title="probes",
        probe1="library_cite_check judges each [n] fuzzy + semantic (40 / 0.1)",
        probe2="library_remove re-probes 4-gram signatures for residue (≤ 24)",
    ),
}


def hero(lang: str, skin: str) -> None:
    s = SKIN[skin]
    h = HERO[lang]
    width, height = 1440, 576
    img = gradient(width, height, s["bg_from"], s["bg_to"])
    img = glow(img, 1180, 30, 420, hx(s["accent"]),
               22 if skin == "light" else 36)
    img = glow(img, 110, 570, 300, hx(s["glow2"]),
               10 if skin == "light" else 16)

    margin, col_w = 64, 596
    draw = ImageDraw.Draw(img)

    # ---- left column -------------------------------------------------------
    pill(img, (margin, 44), h["kicker"], s, size=17)

    draw = ImageDraw.Draw(img)
    title_size = fit(h["title"], "mono_bold", col_w, 58, 48)
    draw.text((margin - 2, 170), h["title"], font=font(title_size, "mono_bold"),
              fill=hx(s["text"]), anchor="ls")

    value_size = fit_lines(h["value"], "cjk_bold", col_w, 42, 34)
    for index, line in enumerate(h["value"]):
        draw.text((margin, 240 + index * 54), line,
                  font=font(value_size, "cjk_bold"), fill=hx(s["text"]),
                  anchor="ls")

    sub_size = 21 if lang == "zh" else 20
    for index, line in enumerate(h["sub"]):
        require(line, sub_size, "cjk", col_w, "hero subtitle")
        draw.text((margin + 1, 356 + index * 30), line,
                  font=font(sub_size, "cjk"), fill=hx(s["sub"]), anchor="ls")

    require(h["meta"], 18, "cjk", col_w, "hero meta")
    require(h["foot"], 15.5, "cjk", col_w, "hero footer")
    draw.text((margin + 1, 444), h["meta"], font=font(18, "cjk"),
              fill=hx(s["faint"]), anchor="ls")
    draw.line([margin + 1, 486, margin + col_w - 6, 486], fill=hx(s["grid"]),
              width=2)
    draw.text((margin + 1, 510), h["foot"], font=font(15.5, "cjk"),
              fill=hx(s["faint"]), anchor="ls")

    # ---- right, top: ingest ribbon ----------------------------------------
    img = card(img, (700, 40, 1376, 136), s, radius=18, spread=18)
    draw = ImageDraw.Draw(img)
    draw.text((722, 70), h["ribbon"], font=font(13, "cjk_bold"),
              fill=hx(s["text"]), anchor="ls")
    require(h["ribbon"], 13, "cjk_bold", 420, "ribbon title")
    draw.text((1354, 70), h["ribbon_param"], font=font(11, "mono"),
              fill=hx(s["faint"]), anchor="rs")

    # doc badge -> overlapping windows -> chunk/embedding summary
    doc_w = int(measure(h["doc"], 11, "mono")) + 24
    draw.rounded_rectangle([722, 88, 722 + doc_w, 116], radius=14,
                           fill=hx(s["band"]), outline=hx(s["edge"]), width=1)
    draw.text((722 + doc_w // 2, 102), h["doc"], font=font(11, "mono"),
              fill=hx(s["sub"]), anchor="mm")

    bar_x = 722 + doc_w + 22
    for index in range(4):
        x = bar_x + index * 30
        draw.rounded_rectangle([x, 94, x + 52, 110], radius=5,
                               fill=hx(s["accent"]), outline=hx(s["card"]),
                               width=2)
    draw.text((bar_x + 3 * 30 + 60, 106), "…", font=font(13, "cjk_bold"),
              fill=hx(s["faint"]), anchor="ls")

    arrow_x0 = bar_x + 3 * 30 + 78
    draw.line([arrow_x0, 102, arrow_x0 + 18, 102], fill=hx(s["faint"]), width=2)
    draw.polygon([(arrow_x0 + 22, 102), (arrow_x0 + 14, 98), (arrow_x0 + 14, 106)],
                 fill=hx(s["faint"]))

    draw.text((arrow_x0 + 30, 106), h["slices"], font=font(12, "cjk_bold"),
              fill=hx(s["text"]), anchor="ls")
    require(h["slices"], 12, "cjk_bold", 150, "hero slice count")
    draw.text((1354, 106), h["embed"], font=font(11, "mono"),
              fill=hx(s["faint"]), anchor="rs")

    # ---- right, middle: the hit page --------------------------------------
    img = card(img, (700, 152, 1376, 470), s, radius=20, spread=22)
    draw = ImageDraw.Draw(img)
    draw.text((722, 184), h["page_title"], font=font(15, "cjk_bold"),
              fill=hx(s["text"]), anchor="ls")
    require(h["page_title"], 15, "cjk_bold", 470, "page title")
    chip(img, 1354, 168, "inject: true", s["accent"], s["pill"], size=10.5,
         kind="mono")
    draw = ImageDraw.Draw(img)
    draw.text((722, 206), h["page_sub"], font=font(11, "cjk"),
              fill=hx(s["faint"]), anchor="ls")
    require(h["page_sub"], 11, "cjk", 620, "page sub")

    rows = [
        ("[1]", h["row1"], "pinned", h["head"]),
        ("[2]", h["row2"], None, None),
        ("[3]-[7]", h["row3"], "dim", None),
        ("[8]", h["row4"], "pinned", h["tail"]),
    ]
    for index, (tag, body, state, badge) in enumerate(rows):
        y = 244 + index * 46
        if index:
            draw.line([722, y - 22, 1354, y - 22], fill=hx(s["grid"]), width=1)
        tag_color = s["faint"] if state == "dim" else s["accent"]
        draw.text((722, y), tag, font=font(12.5, "mono_bold"),
                  fill=hx(tag_color), anchor="ls")
        body_kind = "cjk" if any(ord(ch) > 0x2000 for ch in body) else "mono"
        body_size = 11.5 if (state == "dim" or body_kind == "cjk") else 12
        require(body, body_size, body_kind, 400, "hero page row")
        draw.text((776, y), body, font=font(body_size, body_kind),
                  fill=hx(s["faint"] if state == "dim" else s["text"]),
                  anchor="ls")
        if badge is not None:
            chip(img, 1354, y - 14, badge, s["accent"], s["pill"], size=10)
            draw = ImageDraw.Draw(img)
            draw.rounded_rectangle([708, y - 14, 712, y + 8], radius=2,
                                   fill=hx(s["accent"]))

    draw.text((722, 442), h["page_foot"], font=font(11, "cjk"),
              fill=hx(s["faint"]), anchor="ls")
    require(h["page_foot"], 11, "cjk", 640, "page footer")

    # ---- right, bottom: the two probes ------------------------------------
    img = card(img, (700, 482, 1376, 556), s, radius=18, spread=18)
    pill(img, (722, 497), h["probe_title"], s, size=11)
    draw = ImageDraw.Draw(img)
    draw.text((790, 512), h["probe1"], font=font(11.5, "cjk"),
              fill=hx(s["sub"]), anchor="ls")
    draw.text((790, 536), h["probe2"], font=font(11.5, "cjk"),
              fill=hx(s["sub"]), anchor="ls")
    require(h["probe1"], 11.5, "cjk", 564, "probe line 1")
    require(h["probe2"], 11.5, "cjk", 564, "probe line 2")

    name = f"dsh-library-hero-{lang}-{skin}.webp"
    img.save(os.path.join(OUT, name), "WEBP", quality=92, method=6)
    print(f"wrote {name} ({width}x{height})")


# --------------------------------------------------------------------------- flow svg
FONT_CSS_CJK = ("'Microsoft YaHei','PingFang SC','Noto Sans CJK SC',"
                "'Source Han Sans SC',sans-serif")
FONT_CSS_MONO = "'Consolas','SFMono-Regular','Menlo',ui-monospace,monospace"

FLOW = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        panel="#ffffff", edge="#e6e2ef", band="#f5f2fb", band_alt="#faf8fe",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", accent2="#1f7a4d", rule="#dcd8ea",
        shadow="0.10",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        panel="#1b2231", edge="#2e374b", band="#202839", band_alt="#1e2534",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", accent2="#3fb950", rule="#2b3348",
        shadow="0.45",
    ),
}

# Sliding-window sample: a 3240-character document at chunkSize 900 /
# chunkOverlap 120 gives ceil((3240-900)/780)+1 = 4 windows.
DOC_CHARS = 3240
CHUNK_CHARS = 900
STEP_CHARS = 780
CHUNKS = [(i * STEP_CHARS, min(i * STEP_CHARS + CHUNK_CHARS, DOC_CHARS))
          for i in range(4)]


class Svg:
    """Small SVG writer that measures every label before it emits it."""

    def __init__(self) -> None:
        self.parts: list[str] = []
        self.overflows: list[str] = []

    def add(self, markup: str) -> None:
        self.parts.append(markup)

    def text(self, x: float, y: float, content: str, size: float, fill: str, *,
             anchor: str = "start", weight: int | None = None,
             mono: bool = False, max_w: float | None = None,
             opacity: float | None = None) -> None:
        kind = ("mono" if mono else "cjk") + ("_bold" if weight else "")
        if max_w is not None:
            width = measure(content, size, kind)
            if width > max_w + 0.4:
                self.overflows.append(
                    f"{content!r} needs {width:.1f}px > {max_w}px")
        family = FONT_CSS_MONO if mono else FONT_CSS_CJK
        attrs = [f'x="{x}"', f'y="{y}"', f'fill="{fill}"',
                 f'font-family="{family}"', f'font-size="{size}"']
        if anchor != "start":
            attrs.append(f'text-anchor="{anchor}"')
        if weight:
            attrs.append(f'font-weight="{weight}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<text {" ".join(attrs)}>{escape(content)}</text>')

    def rect(self, x: float, y: float, w: float, h: float, *, fill: str,
             rx: float = 0, stroke: str | None = None, sw: float = 1.5,
             shadow: bool = False, opacity: float | None = None) -> None:
        attrs = [f'x="{x}"', f'y="{y}"', f'width="{w}"', f'height="{h}"']
        if rx:
            attrs.append(f'rx="{rx}"')
        attrs.append(f'fill="{fill}"')
        if stroke:
            attrs.append(f'stroke="{stroke}"')
            attrs.append(f'stroke-width="{sw}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        if shadow:
            attrs.append('filter="url(#soft)"')
        self.add(f'<rect {" ".join(attrs)}/>')

    def line(self, x1: float, y1: float, x2: float, y2: float, *, stroke: str,
             sw: float = 1.5, marker: str | None = None,
             opacity: float | None = None, dash: str | None = None) -> None:
        attrs = [f'x1="{x1}"', f'y1="{y1}"', f'x2="{x2}"', f'y2="{y2}"',
                 f'stroke="{stroke}"', f'stroke-width="{sw}"']
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if marker:
            attrs.append(f'marker-end="url(#{marker})"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<line {" ".join(attrs)}/>')

    def path(self, d: str, *, stroke: str, sw: float = 1.5,
             marker: str | None = None, fill: str = "none") -> None:
        attrs = [f'd="{d}"', f'fill="{fill}"', f'stroke="{stroke}"',
                 f'stroke-width="{sw}"', 'stroke-linecap="round"']
        if marker:
            attrs.append(f'marker-end="url(#{marker})"')
        self.add(f'<path {" ".join(attrs)}/>')

    def chip(self, x_right: float, y: float, label: str, fg: str, bg: str, *,
             size: float = 11, pad: float = 9, height: float = 20,
             mono: bool = False, weight: int | None = None) -> float:
        kind = ("mono" if mono else "cjk") + ("_bold" if weight else "")
        width = measure(label, size, kind) + pad * 2
        x = x_right - width
        self.rect(x, y, width, height, fill=bg, rx=height / 2)
        self.text(x + pad, y + height / 2 + size * 0.35, label, size, fg,
                  weight=weight, mono=mono)
        return x

    def svg(self, w: int, h: int, label: str) -> str:
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" '
                f'height="{h}" viewBox="0 0 {w} {h}" role="img" '
                f'aria-label="{escape(label)}">')
        return "\n".join([head, *self.parts, "</svg>"]) + "\n"


def flow_svg(skin: str) -> str:
    s = FLOW[skin]
    v = Svg()
    W, H = 1100, 660

    v.add("<defs>")
    v.add(f'<linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">'
          f'<stop offset="0" stop-color="{s["bg_from"]}"/>'
          f'<stop offset="1" stop-color="{s["bg_to"]}"/></linearGradient>')
    v.add(f'<filter id="soft" x="-30%" y="-30%" width="160%" height="170%">'
          f'<feDropShadow dx="0" dy="7" stdDeviation="9" '
          f'flood-color="#16122c" flood-opacity="{s["shadow"]}"/></filter>')
    v.add('<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" '
          'markerWidth="6.4" markerHeight="6.4" orient="auto-start-reverse">'
          f'<path d="M0 0 L10 5 L0 10 z" fill="{s["accent"]}"/></marker>')
    v.add("</defs>")
    v.add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')

    # ---- header ------------------------------------------------------------
    v.text(44, 58, "dsh-library", 28, s["text"], weight=700, mono=True,
           max_w=620)
    v.text(44, 86,
           "同一个存储域，两条带：上面切片入库，下面检索取页；页里每条带 [n]，页外两条探针。",
           15, s["sub"], max_w=830)
    v.chip(1056, 34, "6 tools · 3 storage units · 0 downloads", s["accent"],
           s["band"], size=12, pad=12, height=26)
    v.line(44, 104, 1056, 104, stroke=s["rule"], sw=1)

    # ---- band 1: ingest ----------------------------------------------------
    v.text(44, 126, "① 写入带 · 文档进库", 12, s["faint"], weight=700)

    v.rect(44, 138, 202, 140, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(62, 168, "library_add", 15, s["text"], weight=700, mono=True)
    v.text(62, 188, "{ path, library, name? }", 11, s["sub"], mono=True,
           max_w=166)
    v.line(62, 200, 228, 200, stroke=s["rule"], sw=1)
    v.text(62, 222, "md / txt · ≤ 5 MiB", 12, s["text"], max_w=166)
    v.text(62, 242, "经 harness 文件系统读取", 11, s["faint"], max_w=166)
    v.text(62, 262, "documentId = 内容哈希", 11, s["faint"], max_w=166)

    v.rect(268, 138, 422, 140, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(286, 162, "滑窗切片 · 示例：3240 字的文档 → 4 片", 13, s["text"],
           weight=700, max_w=386)
    v.text(286, 182, "chunkSize 900 · chunkOverlap 120 · step = 780", 11,
           s["faint"], mono=True, max_w=386)
    bar_x, bar_w = 304.0, 310.0
    scale = bar_w / DOC_CHARS
    for index, (start, end) in enumerate(CHUNKS):
        y = 196 + index * 16
        v.rect(bar_x, y, bar_w, 10, fill=s["band"], rx=4)
        v.rect(bar_x + start * scale, y, (end - start) * scale, 10,
               fill=s["accent"], rx=4)
        if index:
            v.rect(bar_x + start * scale, y, 120 * scale, 10, fill=s["text"],
                   rx=3, opacity=0.55)
        v.text(284, y + 8, f"c{index + 1}", 11, s["sub"], mono=True)
        v.text(622, y + 8, f"{start}-{end}", 11, s["faint"], mono=True,
               max_w=64)
    v.text(286, 268, "重叠 120 字：相邻切片共享同一段上下文", 11, s["faint"],
           max_w=386)

    v.rect(718, 138, 338, 140, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(736, 162, "嵌入 · embedding.provider", 13, s["text"], weight=700,
           max_w=302)
    v.text(736, 188, "hash · 256 维 · 零下载", 12, s["text"], max_w=302)
    v.text(736, 208, "command · stdio JSON lines", 12, s["text"], max_w=302)
    v.text(736, 228, "ollama · 本地端点，失败回退 hash", 12, s["text"],
           max_w=302)
    v.text(736, 252, "词 token + 字符三元组 → 带符号桶", 11, s["faint"],
           max_w=302)
    v.text(736, 268, "L2 归一化后 cosine = 点乘", 11, s["faint"], max_w=302)

    # ingest cards -> embedder -> storage domain
    v.line(248, 208, 262, 208, stroke=s["accent"], sw=1.6, marker="arr")
    v.line(692, 208, 712, 208, stroke=s["accent"], sw=1.6, marker="arr")
    v.line(887, 278, 887, 288, stroke=s["accent"], sw=1.6, marker="arr")

    # ---- storage domain bar (the bus both bands touch) ---------------------
    v.rect(44, 292, 1012, 90, fill=s["panel"], rx=20, stroke=s["accent"],
           sw=1.8, shadow=True)
    v.text(66, 320, "② dsh_library · 索引就住在宿主的存储域里", 14, s["text"],
           weight=700, max_w=560)
    v.text(66, 342,
           "documents / chunks / purges 三单元 · JSON 或 SQLite 后端 · 记录在持久边界校验",
           11.5, s["sub"], max_w=560)
    v.text(66, 364, "索引状态全在这里；插件的日志事件不写正文与向量", 11,
           s["faint"], max_w=560)

    for index, (name, line1, line2) in enumerate((
            ("documents", "docId · name", "hash · chunks[]"),
            ("chunks", "chunkId · seq", "text · 256-d vec"),
            ("purges", "purgeId", "passed · found"))):
        x = 640 + index * 142
        v.rect(x, 304, 132, 64, fill=s["band"], rx=14)
        v.text(x + 16, 326, name, 12, s["accent"], weight=700, mono=True)
        v.text(x + 16, 346, line1, 11, s["sub"], mono=True, max_w=110)
        v.text(x + 16, 362, line2, 11, s["faint"], mono=True, max_w=110)

    # ---- band 3: retrieval -------------------------------------------------
    v.text(44, 404, "③ 检索带 · 提问取页", 12, s["faint"], weight=700)

    v.rect(44, 418, 188, 108, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(62, 444, "library_search", 14, s["text"], weight=700, mono=True)
    v.text(62, 466, "{ query, library,", 11, s["sub"], mono=True, max_w=156)
    v.text(62, 482, "  topK?, inject? }", 11, s["sub"], mono=True, max_w=156)
    v.text(62, 508, "topK 8 · 16000 字", 11, s["faint"], max_w=156)

    # four narrowing stages: hybrid -> MMR -> filter -> pin head/tail
    stages = (
        ("混合打分", "hybridWeight 0.6 · 语义 + 关键词", 310),
        ("MMR 多样性重排", "diversityLambda 0.5 · 池 ≤ 500", 278),
        ("相关性过滤", "minRelevance 0.15", 246),
        ("截到 topK 再钉首尾", "lostMiddleHead 1 · Tail 1", 214),
    )
    for index, (label, param, width) in enumerate(stages):
        y = 418 + index * 46
        v.rect(250, y, width, 34, fill=s["band"], rx=12,
               stroke=s["accent"], sw=1.4)
        v.text(268, y + 16, label, 13, s["text"], weight=700, max_w=width - 36)
        v.text(268, y + 30, param, 11, s["sub"], mono=True, max_w=width - 36)
        if index < 3:
            v.path(f"M264 {y + 36} l4 4 l4 -4", stroke=s["sub"], sw=1.6)

    # query and the same domain both enter the first stage
    v.line(234, 435, 244, 435, stroke=s["accent"], sw=1.6, marker="arr")
    v.line(300, 382, 300, 412, stroke=s["accent"], sw=1.6, marker="arr")
    v.text(308, 400, "该库全部切片", 11, s["faint"], max_w=110)

    # ---- the pinned page ---------------------------------------------------
    v.rect(600, 418, 456, 172, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(620, 444, "带 [n] 的结果页", 14, s["text"], weight=700, max_w=250)
    v.chip(1036, 430, "inject: true", s["accent"], s["band"], size=11,
           pad=10, height=22, mono=True)

    rows = (
        ("[1]", "DeepSeek Harness is a plugin-based agent harness…", "head"),
        ("[2]", "The recipe for sourdough starts with a levain…", None),
        ("[3]-[7]", "其余命中 · 按 MMR 顺序，relevance ≥ 0.15", None),
        ("[8]", "次强切片钉在尾部 · lostMiddleTail 1", "tail"),
    )
    for index, (tag, body, badge) in enumerate(rows):
        y = 478 + index * 22
        dim = index == 2
        v.text(620, y, tag, 12, s["faint"] if dim else s["accent"],
               weight=700, mono=True)
        v.text(668, y, body, 11.5, s["faint"] if dim else s["text"],
               mono=not dim, max_w=352)
        if badge:
            v.chip(1036, y - 13, badge, s["accent"], s["band"], size=10.5,
                   pad=8, height=18)
    v.text(620, 574, "topK 8 · maxResultChars 16000 · 注入时记 injectId", 11,
           s["faint"], max_w=420)

    v.line(464, 573, 594, 573, stroke=s["accent"], sw=1.6, marker="arr")

    # ---- footer ------------------------------------------------------------
    v.line(44, 604, 1056, 604, stroke=s["rule"], sw=1)
    v.text(44, 622,
           "探针：library_cite_check 模糊 + 语义双判 [n]（窗口 150 字 · minScore 40 · minSemantic 0.1）",
           11.5, s["sub"], max_w=1012)
    v.text(44, 640,
           "library_remove 用 4-gram 签名探残留（maxProbes 24），残留即报告 ｜ library_diagnose：直方图 / 重复对 / 自检索 / 中段惩罚",
           11.5, s["faint"], max_w=1012)

    if v.overflows:
        raise SystemExit("FATAL: SVG label overflow:\n  "
                         + "\n  ".join(v.overflows))
    return v.svg(W, H, "dsh-library 结构图：中间一条 dsh_library 存储域横条，"
                       "上带写入（路径门禁、滑窗切片、嵌入），下带检索（查询与同一"
                       "存储域的切片一起进入混合打分、MMR、相关性过滤、钉首尾），"
                       "得到带 [n] 的结果页；页外两条探针做引用与清除核验")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin)
        name = f"dsh-library-flow-v5-{skin}.svg"
        with open(os.path.join(OUT, name), "w", encoding="utf-8",
                  newline="\n") as handle:
            handle.write(flow_svg(skin))
        print(f"wrote {name} (1100x660)")


if __name__ == "__main__":
    main()
