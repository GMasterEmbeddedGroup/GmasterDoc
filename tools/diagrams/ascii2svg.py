#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ASCII 示意图 → SVG 转换器（机械矢量化）

思路：把 ASCII 图当成一张「字符网格」——
  · 框线字符（─│┌┐└┘├┤┬┴┼ 及双线/粗线、圆角变体）→ 真正的 <line>（相邻段自动合并成整条线）
  · 其余字符 → <text>（ASCII 连续段合并成一条，CJK 逐字定位，保证等宽对齐不被字体宽度带偏）
输出带浅色卡片底、圆角与无障碍标题，视图与原图逐字符一致，但可无损缩放。

用法：
  python ascii2svg.py --dry-run                 # 只看报告，不改文件
  python ascii2svg.py                           # 转换所有候选块并就地改写 markdown
  python ascii2svg.py --only 02-时钟树与总线架构.md
"""
import argparse
import hashlib
import html
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path("d:/GmasterDoc")
DOCS = ROOT / "docs"
OUT_DIR = DOCS / "assets" / "diagrams" / "auto"
MAP_FILE = ROOT / ".tmp" / "gm" / "ascii2svg-map.json"

# 字符 → (上, 下, 左, 右) 四个方向有没有线
ARM = {
    "─": (0, 0, 1, 1), "│": (1, 1, 0, 0),
    "┌": (0, 1, 0, 1), "┐": (0, 1, 1, 0), "└": (1, 0, 0, 1), "┘": (1, 0, 1, 0),
    "├": (1, 1, 0, 1), "┤": (1, 1, 1, 0), "┬": (0, 1, 1, 1), "┴": (1, 0, 1, 1), "┼": (1, 1, 1, 1),
    "╭": (0, 1, 0, 1), "╮": (0, 1, 1, 0), "╰": (1, 0, 0, 1), "╯": (1, 0, 1, 0),
    "═": (0, 0, 1, 1), "║": (1, 1, 0, 0),
    "╔": (0, 1, 0, 1), "╗": (0, 1, 1, 0), "╚": (1, 0, 0, 1), "╝": (1, 0, 1, 0),
    "╠": (1, 1, 0, 1), "╣": (1, 1, 1, 0), "╦": (0, 1, 1, 1), "╩": (1, 0, 1, 1), "╬": (1, 1, 1, 1),
    "━": (0, 0, 1, 1), "┃": (1, 1, 0, 0),
    "┏": (0, 1, 0, 1), "┓": (0, 1, 1, 0), "┗": (1, 0, 0, 1), "┛": (1, 0, 1, 0),
    "┣": (1, 1, 0, 1), "┫": (1, 1, 1, 0), "┳": (0, 1, 1, 1), "┻": (1, 0, 1, 1), "╋": (1, 1, 1, 1),
}
BOX_CHARS = set(ARM)
CODE_LANGS = {"cpp", "c", "h", "hpp", "python", "py", "java", "js", "ts", "go", "rust", "sql",
              "yaml", "yml", "json", "xml", "sh", "shell", "bash", "powershell", "ps1",
              "cmake", "makefile", "toml", "ini", "diff", "verilog", "asm"}
FENCE = re.compile(r"^(\s*)(`{3,}|~{3,})(.*)$")
HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*$")

FS = 13.5                 # 字号
CW = round(FS * 0.6, 2)   # 等宽字符宽度
LH = round(FS * 1.5, 2)   # 行高
PAD = 20
MAX_W = 1150              # 超过这个宽度就整体缩小字号

FONT = ("ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', "
        "'Noto Sans Mono CJK SC', 'Microsoft YaHei', monospace")


def char_width(ch: str) -> int:
    return 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1


def expand(text: str):
    """一行文本 → 单元格列表：每个单元格是 (字符, 是否占位)，宽字符占两格"""
    cells = []
    for ch in text:
        if ch == "\t":
            for _ in range(4):
                cells.append((" ", False))
            continue
        if char_width(ch) == 2:
            cells.append((ch, False))
            cells.append(("", True))       # 占位：不画不写
        else:
            cells.append((ch, False))
    return cells


def art_density(body) -> float:
    art = sum(1 for line in body for ch in line if ch in BOX_CHARS)
    glyphs = sum(1 for line in body for ch in line if not ch.isspace())
    return art / glyphs if glyphs else 0.0


VERT_CHARS = set("│┌┐└┘├┤┼║╔╗╚╝╠╣╬┃┏┓┗┛┣┫╋╭╮╰╯")
HORZ_CHARS = set("─═━")


class Grid:
    def __init__(self, body):
        self.cells = [expand(line.rstrip()) for line in body]
        self.rows = len(self.cells)
        self.cols = max((len(r) for r in self.cells), default=0)
        for row in self.cells:                       # 补齐成矩形
            row.extend([(" ", False)] * (self.cols - len(row)))
        self.moved = 0

    def repair(self, passes=2):
        """把「孤零零的竖线」吸附到旁边的「主力列」上。

        中文宽度认知不同的人画框时容易整体偏 1~2 列（把中文当 1 列算），
        表现为方框的左右边与上下边差一两格。这里统计每列有多少个竖线字符，
        把 support 很低的列上的竖线整体挪到附近的 support 高的列（目标格空了才挪，
        若目标是横线则让竖线顶掉它 —— 相当于把那条边拉直）。
        """
        for _ in range(passes):
            vsupport = [0] * self.cols
            for row in self.cells:
                for c, (ch, ph) in enumerate(row):
                    if not ph and ch in VERT_CHARS:
                        vsupport[c] += 1
            strong = [c for c in range(self.cols) if vsupport[c] >= 3]
            if not strong:
                return self.moved
            touched = 0
            for r in range(self.rows):
                row = self.cells[r]
                for c in range(self.cols):
                    ch, ph = row[c]
                    if ph or ch not in VERT_CHARS or vsupport[c] >= 3:
                        continue
                    targets = sorted((s for s in strong if 0 < abs(s - c) <= 2),
                                     key=lambda s: (abs(s - c), -vsupport[s]))
                    for t in targets:
                        target, tph = row[t]
                        if tph:
                            continue
                        if target == " ":
                            row[t] = (ch, False)
                            row[c] = (" ", False)
                        elif target in HORZ_CHARS:
                            row[t] = (ch, False)
                            row[c] = (" ", False)
                        else:
                            continue
                        touched += 1
                        break
            self.moved += touched
            if not touched:
                break
        return self.moved

    def at(self, r, c):
        if 0 <= r < self.rows and 0 <= c < self.cols:
            return self.cells[r][c][0]
        return " "

    def arms(self, r, c):
        return ARM.get(self.at(r, c), (0, 0, 0, 0))


def segments(grid: Grid):
    """产出水平段 [(y, x0, x1)] 与垂直段 [(x, y0, y1)]，并把连续的段合并"""
    horiz, vert = [], []
    for r in range(grid.rows):
        for c in range(grid.cols):
            up, down, left, right = grid.arms(r, c)
            if not (left or right):
                continue
            y = PAD + (r + 0.5) * LH
            x0 = PAD + (c + (0 if left else 0.5)) * CW
            x1 = PAD + (c + (1 if right else 0.5)) * CW
            if horiz and horiz[-1][0] == y and abs(horiz[-1][2] - x0) < 0.01:
                horiz[-1] = (y, horiz[-1][1], max(horiz[-1][2], x1))
            else:
                horiz.append((y, x0, x1))
    for c in range(grid.cols):
        run = None
        for r in range(grid.rows):
            up, down, left, right = grid.arms(r, c)
            if not (up or down):
                run = None
                continue
            x = PAD + (c + 0.5) * CW
            y0 = PAD + (r + (0 if up else 0.5)) * LH
            y1 = PAD + (r + (1 if down else 0.5)) * LH
            if run is not None and run[0] == x and abs(run[2] - y0) < 0.01:
                run = (x, run[1], max(run[2], y1))
                vert[-1] = run
            else:
                run = (x, y0, y1)
                vert.append(run)
    return horiz, vert


def texts(grid: Grid):
    """产出文本：ASCII 连续段合并，CJK 与孤立字符逐字定位"""
    out = []
    for r in range(grid.rows):
        c = 0
        while c < grid.cols:
            ch, placeholder = grid.cells[r][c]
            if placeholder or ch.strip() == "" or ch in BOX_CHARS:
                c += 1
                continue
            run = ""
            start = c
            while c < grid.cols:
                cur, ph = grid.cells[r][c]
                if ph or cur == "":
                    break
                if cur.strip() == "" or cur in BOX_CHARS:
                    break
                if char_width(cur) == 2:           # CJK：单独一个 run，避免宽度累积误差
                    if run:
                        break
                    run = cur
                    c += 2
                    break
                run += cur
                c += 1
            out.append((start, r, run))
            if not run:
                c += 1
    return out


def render_svg(body, title, source_note):
    grid = Grid(body)
    grid.repair()
    scale = 1.0
    width_chars = grid.cols * CW + 2 * PAD
    if width_chars > MAX_W:
        scale = MAX_W / width_chars
    horiz, vert = segments(grid)
    parts = []
    parts.append('<rect x="0.75" y="0.75" width="100%" height="100%" rx="14" '
                 'fill="#f7f9fc" stroke="#dce3ec" stroke-width="1.5"/>')
    parts.append('<g stroke="#8b97b5" stroke-width="1.4" stroke-linecap="round">')
    for y, x0, x1 in horiz:
        parts.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (x0, y, x1, y))
    for x, y0, y1 in vert:
        parts.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (x, y0, x, y1))
    parts.append("</g>")
    parts.append('<g fill="#1f2430" font-size="%g">' % FS)
    for start, r, run in texts(grid):
        x = PAD + start * CW
        y = PAD + (r + 0.78) * LH
        parts.append('<text x="%.1f" y="%.1f" xml:space="preserve">%s</text>'
                     % (x, y, html.escape(run)))
    parts.append("</g>")

    w = grid.cols * CW + 2 * PAD
    h = grid.rows * LH + 2 * PAD
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" width="%.0f" height="%.0f" '
        'role="img" aria-labelledby="ttl dsc" font-family="%s">\n'
        '  <title id="ttl">%s</title>\n'
        '  <desc id="dsc">%s</desc>\n'
        '  <g transform="scale(%g)">\n%s\n  </g>\n'
        '</svg>\n'
        % (w, h, w, h, FONT, html.escape(title), html.escape(source_note),
           scale, "\n".join("    " + p for p in parts))
    )
    return svg, w, h, grid.moved


def find_blocks(text):
    """产出 (起始行, 结束行, 语言, 内容行列表)——行号 0 基"""
    lines = text.splitlines()
    open_at, lang = None, ""
    for index, line in enumerate(lines):
        match = FENCE.match(line)
        if match and open_at is None:
            open_at, lang = index, match.group(3).strip()
        elif match and open_at is not None:
            yield open_at, index, lang, lines[open_at + 1:index]
            open_at = None


def caption_for(body, heading):
    for line in body:
        first = re.sub(r"\s{2,}", " / ", line.strip()).strip(" /").strip()
        # 去掉图里带出来的框线字符，图注里只留文字
        first = re.sub(r"[\u2500-\u257f]+", " ", first)
        first = re.sub(r"\s{2,}", " ", first).strip(" /·—-").strip()
        first = re.sub(r"(?:\s*/\s*)+", " / ", first).strip()
        if not first:
            continue
        if not re.search(r"[0-9A-Za-z\u4e00-\u9fff]", first):
            continue
        if len(first) <= 46:
            return first
        break
    return (heading or "示意图").strip()


def convert_file(path: pathlib.Path, seq: list, dry: bool, mapping: dict):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    heading = ""
    heading_at_row = {}
    for index, line in enumerate(text.splitlines()):
        match = HEADING.match(line)
        if match:
            heading = match.group(2)
        heading_at_row[index] = heading

    done = 0
    edits = []      # (起始行, 结束行, 新文本)
    for start, end, lang, body in find_blocks(text):
        if sum(1 for line in body for ch in line if ch in BOX_CHARS) < 8:
            continue
        if lang.lower() in CODE_LANGS and art_density(body) < 0.25:
            print("  跳过（像代码而非画图，语言=%s 密度=%.2f）：%s:%d"
                  % (lang, art_density(body), path.name, start + 1))
            continue
        seq[0] += 1
        slug = "d%03d-%s" % (seq[0], hashlib.md5(("\n".join(body)).encode()).hexdigest()[:6])
        name = slug + ".svg"
        title = caption_for(body, heading_at_row.get(start, ""))
        note = "自动由 ASCII 示意图矢量化生成，源：docs/%s 第 %d-%d 行" % (
            path.relative_to(DOCS).as_posix(), start + 1, end + 1)
        svg, w, h, grid_moved = render_svg(body, title, note)
        if not dry:
            (OUT_DIR / name).write_text(svg, encoding="utf-8")
        if grid_moved:
            print("  对齐修复：%s 挪动 %d 个字符" % (name, grid_moved))
        rel = "/assets/diagrams/auto/" + name
        figure = ('<figure class="diagram">\n'
                  '  <img src="%s" alt="%s">\n'
                  '  <figcaption>图：%s</figcaption>\n'
                  '</figure>\n' % (rel, html.escape(title, quote=True), title))
        edits.append((start, end, figure))
        mapping[name] = {"source": "docs/" + path.relative_to(DOCS).as_posix(),
                         "lines": [start + 1, end + 1], "title": title,
                         "size": [round(w), round(h)]}
        done += 1

    if not edits or dry:
        return done

    out = []
    skip_until = -1
    by_start = {start: (end, figure) for start, end, figure in edits}
    for index, line in enumerate(lines):
        if index in by_start:
            end, figure = by_start[index]
            out.append(figure + "\n")
            skip_until = end
            continue
        if index <= skip_until:
            continue
        out.append(line)
    path.write_text("".join(out), encoding="utf-8")
    return done


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only", default="")
    args = parser.parse_args()

    if not args.dry_run:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        MAP_FILE.parent.mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in DOCS.rglob("*.md") if "site" not in p.parts)
    if args.only:
        files = [p for p in files if args.only in p.name]
    seq = [0]
    mapping = {}
    if MAP_FILE.exists():
        try:
            mapping = json.loads(MAP_FILE.read_text(encoding="utf-8"))
        except Exception:
            mapping = {}
    total = 0
    for path in files:
        count = convert_file(path, seq, args.dry_run, mapping)
        if count:
            print("%s：转换 %d 个" % (path.relative_to(DOCS).as_posix(), count))
            total += count
    if not args.dry_run:
        MAP_FILE.write_text(json.dumps(mapping, ensure_ascii=False, indent=1), encoding="utf-8")
    print("\n合计 %d 个%s" % (total, "（dry-run，未改文件）" if args.dry_run else "，已就地改写"))


if __name__ == "__main__":
    main()
