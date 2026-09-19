#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""盘点仓库里所有「ASCII 艺术图」：fenced 代码块中包含制表符/框线字符的块。

用法：python scan_ascii_art.py [根目录]
输出：按文件分组，列出每个候选块的起始行、行数与首行内容，便于逐个换成 SVG。
"""
import pathlib
import re
import sys

BOX = set("─│┌┐└┘├┤┬┴┼━┃┏┓┗┛┣┫╋╭╮╰╯═║╔╗╚╝▼▲►◄◆◇○●★☆")
ARROW_ONLY = "→←↑↓↔"      # 只有箭头的行不算「图」，那只是行文
FENCE = re.compile(r"^(\s*)(`{3,}|~{3,})(.*)$")


def blocks(path: pathlib.Path):
    """产出 (起始行号, 结束行号, 语言, 行列表)"""
    lines = path.read_text(encoding="utf-8").splitlines()
    open_at = None
    lang = ""
    for index, line in enumerate(lines):
        match = FENCE.match(line)
        if match and open_at is None:
            open_at, lang = index, match.group(3).strip()
        elif match and open_at is not None:
            yield open_at, index, lang, lines[open_at + 1:index]
            open_at = None


def interesting(body):
    """块里是否有框线字符（纯箭头不算）"""
    hits = 0
    for line in body:
        hits += sum(1 for ch in line if ch in BOX)
    return hits


def main() -> None:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "d:/GmasterDoc/docs")
    total = 0
    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in (".md", ".html"):
            continue
        if "site" in path.parts:
            continue
        for start, end, lang, body in blocks(path):
            hits = interesting(body)
            if hits < 8:          # 一两个箭头不算图
                continue
            total += 1
            rel = path.relative_to(root)
            print("%s:%d-%d  行数=%d 框线字符=%d 语言=%s" % (rel, start + 1, end, end - start - 1, hits, lang or "-"))
            preview = [ln for ln in body if ln.strip()][:2]
            for line in preview:
                print("      | " + line[:78])
    print("\n候选块合计：%d" % total)


if __name__ == "__main__":
    main()
