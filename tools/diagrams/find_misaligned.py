#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""挑出「原图本身就对不齐」的 ASCII 图（作者画框时把中文按 1 列算了 → ±1 列错位）。

判据：某一行里的竖线字符所在的列，在全图里几乎只有它自己用（support=1），
而它左右 2 列内正好有一条被很多行共用的「主力列」（support>=3）→ 视为错位。

用法：python find_misaligned.py [--top 25]
原始 ASCII 取自矢量化之前的提交（见 .tmp/gm/ascii2svg-map.json 与 PREV_COMMIT）。
"""
import argparse
import io
import json
import pathlib
import re
import subprocess
import sys
import unicodedata

ROOT = pathlib.Path("d:/GmasterDoc")
MAP_FILE = ROOT / ".tmp" / "gm" / "ascii2svg-map.json"
PREV_COMMIT = "1358821"          # 矢量化之前的最后一次提交

BOX = set("─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬━┃┏┓┗┛┣┫┳┻╋╭╮╰╯")
VERT = set("│┌┐└┘├┤┼║╔╗╚╝╠╣╬┃┏┓┗┛┣┫╋╭╮╰╯")


def width(ch: str) -> int:
    return 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1


def expand(text: str):
    cells = []
    for ch in text:
        if ch == "\t":
            cells += [(" ", False)] * 4
        elif width(ch) == 2:
            cells += [(ch, False), ("", True)]
        else:
            cells.append((ch, False))
    return cells


def grid_of(lines):
    rows = [expand(line.rstrip()) for line in lines]
    cols = max((len(r) for r in rows), default=0)
    for r in rows:
        r.extend([(" ", False)] * (cols - len(r)))
    return rows, cols


def analyse(lines):
    rows, cols = grid_of(lines)
    vsupport = [0] * cols
    for row in rows:
        for c, (ch, ph) in enumerate(row):
            if not ph and ch in VERT:
                vsupport[c] += 1
    strong = [c for c in range(cols) if vsupport[c] >= 3]
    points = []
    for r, row in enumerate(rows):
        for c, (ch, ph) in enumerate(row):
            if ph or ch not in VERT or vsupport[c] >= 3:
                continue
            near = [s for s in strong if abs(s - c) <= 2 and abs(s - c) > 0]
            if near:
                points.append((r, c, near[0], ch))
    return points, vsupport


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--top", type=int, default=25)
    args = parser.parse_args()

    data = json.load(io.open(MAP_FILE, encoding="utf-8"))
    cache = {}
    results = []
    for svg, info in data.items():
        source = info["source"]
        start, end = info["lines"]
        if source not in cache:
            text = subprocess.run(["git", "show", "%s:%s" % (PREV_COMMIT, source)],
                                  cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8").stdout
            cache[source] = text.splitlines()
        lines = cache[source][start:end - 1]
        points, vsupport = analyse(lines)
        if len(points) >= 2:
            results.append((len(points), svg, source, start, end, lines, points))

    results.sort(reverse=True)
    print("对不齐的图：%d / %d" % (len(results), len(data)))
    for count, svg, source, start, end, lines, points in results[:args.top]:
        print("\n=== %s  错位点=%d  %s:%d-%d" % (svg, count, source, start, end))
        detail = " ".join("r%d:c%d(→c%d,%s)" % (r + 1, c, t, ch) for r, c, t, ch in points[:6])
        print("    " + detail)
        for i, line in enumerate(lines[:6]):
            print("    | " + line[:96])


if __name__ == "__main__":
    main()
