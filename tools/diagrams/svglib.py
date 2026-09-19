#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""画示意图的小工具（内部用，不发布到站点）

为什么不用手写 SVG：一张图里十几个方框、箭头、标注，手写坐标容易出错也不好维护。
这里提供最少的原语（box / text / arrow / legend），坐标用「格」来算，
生成出来的 SVG 风格统一（卡片底、系统字体、主色 #4051b5）。

约定：
  · 所有文字用系统字体栈，中文才不会被换成衬线体；
  · 方框默认白底 + 浅描边，标题行加粗；
  · 箭头按正交折线走，拐弯半径 6px。
"""
import html
import unicodedata

FONT = ("system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif")
MONO = ("ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace")

INK = "#1f2430"
DIM = "#5b6472"
FAINT = "#8a93a3"
LINE = "#8b97b5"
CARD = "#f7f9fc"
CARD_EDGE = "#dce3ec"

PALETTE = {
    "blue": ("#eef4ff", "#88aaf0", "#2f4fae"),
    "violet": ("#f4f1ff", "#a99bea", "#4b3f9e"),
    "teal": ("#eefaf7", "#7fcfc3", "#1d7f76"),
    "amber": ("#fff8ea", "#e2b862", "#8a6212"),
    "rose": ("#fff1f2", "#f0a6ad", "#9f1239"),
    "slate": ("#f1f5f9", "#cbd5e1", "#334155"),
    "white": ("#ffffff", "#dce3ec", INK),
}


def char_w(ch: str) -> int:
    return 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1


def text_w(text: str, size: float) -> float:
    """粗略宽度：ASCII 0.55em、中文 1.0em"""
    return sum((size if char_w(ch) == 2 else size * 0.55) for ch in text)


class Canvas:
    def __init__(self, width, height, mono=False):
        self.w = width
        self.h = height
        self.parts = []
        self.font = MONO if mono else FONT

    # ---------------------------------------------------------------- 原语
    def rect(self, x, y, w, h, fill="#ffffff", stroke=LINE, radius=10, width=1.5, dash=None):
        style = ' fill="%s" stroke="%s" stroke-width="%g"' % (fill, stroke, width)
        if dash:
            style += ' stroke-dasharray="%s"' % dash
        self.parts.append('<rect x="%g" y="%g" width="%g" height="%g" rx="%g"%s/>'
                          % (x, y, w, h, radius, style))

    def line(self, x1, y1, x2, y2, stroke=LINE, width=1.4, dash=None, cap="round"):
        style = ' stroke="%s" stroke-width="%g" stroke-linecap="%s"' % (stroke, width, cap)
        if dash:
            style += ' stroke-dasharray="%s"' % dash
        self.parts.append('<line x1="%g" y1="%g" x2="%g" y2="%g"%s/>' % (x1, y1, x2, y2, style))

    def text(self, x, y, value, size=13, anchor="start", weight=400, fill=INK, mono=False, opacity=None):
        extra = ' font-family="%s"' % MONO if mono else ""
        if opacity is not None:
            extra += ' opacity="%g"' % opacity
        self.parts.append('<text x="%g" y="%g" font-size="%g" font-weight="%d" fill="%s" '
                          'text-anchor="%s"%s>%s</text>'
                          % (x, y, size, weight, fill, anchor, extra, html.escape(value)))

    def mid_text(self, x, y, value, size=13, weight=400, fill=INK):
        self.text(x, y, value, size=size, anchor="middle", weight=weight, fill=fill)

    # ---------------------------------------------------------------- 常用组合
    def card(self):
        """整张图的卡片底"""
        self.rect(0.75, 0.75, self.w - 1.5, self.h - 1.5, fill=CARD, stroke=CARD_EDGE, radius=14, width=1.5)

    def box(self, x, y, w, h, title=None, lines=(), tone="white", radius=10, title_size=15,
            line_size=12.5, gap=8, align="center", dash=None):
        """一个方框：标题 + 若千行说明，垂直居中"""
        fill, stroke, title_fill = PALETTE[tone]
        self.rect(x, y, w, h, fill=fill, stroke=stroke, radius=radius, dash=dash)
        rows = []
        if title:
            rows.append((title, title_size, 700, title_fill))
        for line in lines:
            rows.append((line, line_size, 400, DIM))
        if not rows:
            return
        total = sum(19 if size >= 15 else 17 for _, size, _, _ in rows)
        cursor = y + h / 2 - total / 2 + 12
        for value, size, weight, fill in rows:
            if align == "center":
                self.mid_text(x + w / 2, cursor, value, size=size, weight=weight, fill=fill)
            else:
                self.text(x + gap, cursor, value, size=size, weight=weight, fill=fill)
            cursor += 19 if size >= 15 else 17

    def arrow(self, points, stroke="#4051b5", width=1.8, dash=None, head=True, head_size=7):
        """正交折线箭头：points 是拐点列表，最后一个点带箭头"""
        path = "M %g %g" % points[0]
        for x, y in points[1:]:
            path += " L %g %g" % (x, y)
        style = ' stroke="%s" stroke-width="%g" fill="none" stroke-linejoin="round"' % (stroke, width)
        if dash:
            style += ' stroke-dasharray="%s"' % dash
        self.parts.append('<path d="%s"%s/>' % (path, style))
        if head:
            (x1, y1), (x2, y2) = points[-2], points[-1]
            if x1 == x2:            # 竖直
                sign = 1 if y2 > y1 else -1
                a = (x2, y2)
                b = (x2 - head_size * 0.62, y2 - sign * head_size)
                c = (x2 + head_size * 0.62, y2 - sign * head_size)
            else:                   # 水平
                sign = 1 if x2 > x1 else -1
                a = (x2, y2)
                b = (x2 - sign * head_size, y2 - head_size * 0.62)
                c = (x2 - sign * head_size, y2 + head_size * 0.62)
            self.parts.append('<path d="M %g %g L %g %g L %g %g z" fill="%s"/>'
                              % (a[0], a[1], b[0], b[1], c[0], c[1], stroke))

    def note(self, x, y, value, size=11.5, fill=FAINT, anchor="start"):
        self.text(x, y, value, size=size, anchor=anchor, fill=fill)

    def legend(self, x, y, w, lines, size=12.5):
        """底部说明条"""
        height = 20 + 18 * len(lines)
        self.rect(x, y, w, height, fill="#ffffff", stroke=CARD_EDGE, radius=12)
        cursor = y + 24
        for line in lines:
            self.mid_text(x + w / 2, cursor, line, size=size, fill=DIM)
            cursor += 18
        return height

    # ---------------------------------------------------------------- 输出
    def render(self, title, desc):
        body = "\n".join("    " + p for p in self.parts)
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" width="%g" height="%g" '
                'role="img" aria-labelledby="ttl dsc" font-family="%s">\n'
                '  <title id="ttl">%s</title>\n'
                '  <desc id="dsc">%s</desc>\n%s\n</svg>\n'
                % (self.w, self.h, self.w, self.h, self.font,
                   html.escape(title), html.escape(desc), body))


def write(path, canvas, title, desc):
    import pathlib
    target = pathlib.Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(canvas.render(title, desc), encoding="utf-8")
    print("已生成 %s（%gx%g）" % (path, canvas.w, canvas.h))
