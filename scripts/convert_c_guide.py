"""Rebuild the guide using PDF typography, reading order and original images."""
from pathlib import Path
import argparse
import html
import re
import fitz

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'docs/软件组/培训/C语言国庆假期学习'
GUIDE = DEST / '嵌入式C语言学习指南（Windows版）.md'

def clean(text):
    return text.replace('\u200b', '').replace('\xa0', ' ')

def styled(spans):
    out = []
    for s in spans:
        t = html.escape(clean(s['text']))
        if not t:
            continue
        color = s['color']
        if color not in (0, 0x1f2329, 0x2b2f36):
            t = f'<span style="color:#{color:06x}">{t}</span>'
        out.append(t)
    return ''.join(out)

def convert(source):
    old = GUIDE.read_text(encoding='utf-8-sig')
    window_match = re.search(r'(?ms)^#+ 2\. Windows.*?(?=^#+ 3\. 编译器视角)', old)
    windows = window_match[0].strip().removesuffix('---').strip() if window_match else ''
    windows = windows.replace('printf("hello world\\\\n")', 'printf("hello world\\n")')
    windows = windows.replace('再从 VS Code 终端选择 **MSYS2 UCRT64** 配置文件，编译器和调试器就会与上面的环境一致。', '在已配置用户 Path 后，重启 VS Code，打开 PowerShell 终端并运行 `gcc --version`。也可以单独打开 MSYS2 UCRT64 终端，在项目目录编译程序。')
    out = ['# 嵌入式 C 语言学习指南（Windows 版）', '']
    assets = DEST / 'assets/figures'
    assets.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(source)
    code = []
    last_y = None
    image_count = 0
    code_count = 0
    def flush_code():
        nonlocal code_count
        if code:
            out.extend(['<pre class="guide-code"><code>' + '\n'.join(code) + '</code></pre>', ''])
            code.clear()
            code_count += 1

    for pn, page in enumerate(doc, 1):
        if pn == 7:
            flush_code()
            out.extend([windows, ''])
        if 7 <= pn <= 21:
            continue
        events = []
        for bi, block in enumerate(page.get_text('dict')['blocks']):
            if block['type'] == 1:
                name = f'p{pn:03}-{bi:02}.{block["ext"]}'
                (assets / name).write_bytes(block['image'])
                events.append((block['bbox'][1], 'image', name))
                image_count += 1
                continue
            for line in block['lines']:
                spans = line['spans']
                text = clean(''.join(s['text'] for s in spans))
                y = line['bbox'][1]
                if not text.strip() or 'Murphy4code' in text or y > 808:
                    continue
                mono = any('SourceCode' in s['font'] for s in spans)
                if mono and line['bbox'][2] < 70 and text.strip().isdigit():
                    continue
                if text.strip() == '•':
                    continue
                size = max(s['size'] for s in spans)
                kind = 'code' if mono or (size < 11.5 and line['bbox'][0] > 70) else 'text'
                events.append((y, kind, (line, text, size, bi)))
        events.sort(key=lambda e: e[0])
        paragraph = []
        prev_block = None
        prev_text_y = None
        def flush_text():
            if paragraph:
                out.extend(['<p>' + ''.join(paragraph) + '</p>', ''])
                paragraph.clear()
        for y, kind, value in events:
            if kind == 'code':
                flush_text()
                line, text, size, bi = value
                if code and last_y is not None and y - last_y > 42:
                    flush_code()
                if code and last_y is not None and 24 < y - last_y < 42:
                    code.append('')
                code.append(styled(line['spans']).rstrip())
                last_y = y
            else:
                flush_code()
                last_y = None
                if kind == 'image':
                    flush_text()
                    out.extend([f'![原文图解（第 {pn} 页）](assets/figures/{value})', ''])
                    prev_block = None
                else:
                    line, text, size, bi = value
                    heading = re.match(r'^(\d+(?:\.\d+)*)(?:\.?\s+)(.+)', text)
                    if heading and size >= 13:
                        flush_text()
                        level = min(6, heading[1].count('.') + 2)
                        out.extend(['#' * level + ' ' + text.strip(), ''])
                    elif size > 23:
                        continue
                    else:
                        if bi != prev_block and (prev_text_y is None or y - prev_text_y > 22):
                            flush_text()
                        paragraph.append(styled(line['spans']))
                    prev_block = bi
                    prev_text_y = y
        flush_text()
        # Keep code across physical page breaks; reset only the page-local y coordinate.
        last_y = None
    flush_code()
    content = '\n'.join(out) + '\n'
    # Retain the selected teaching scope when regenerating the published guide.
    a, b = content.index('### 1.1 '), content.index('### 1.3 ')
    c, d = content.index('### 1.4 '), content.index('### 3.2 ')
    content = content[:a] + content[b:c] + '## 3. 编译器视角\n\n' + content[d:]

    def remap_number(number):
        parts = [int(part) for part in number.split('.')]
        if parts[:2] == [1, 3]:
            return '1'
        if parts[0] == 3 and len(parts) == 1:
            parts = [2]
        elif parts[0] == 3 and len(parts) >= 2 and parts[1] >= 2:
            parts = [2, parts[1] - 1, *parts[2:]]
        elif parts[0] >= 4:
            parts[0] -= 1
        return '.'.join(map(str, parts))

    def renumber_heading(match):
        marks, number, title = match.groups()
        mapped = remap_number(number)
        if number == '1.3':
            return f'## {mapped}.{title}'
        suffix = '.' if '.' not in mapped else ''
        return f'{marks} {mapped}{suffix}{title}'

    content = re.sub(r'(?m)^(#{2,6}) (\d+(?:\.\d+)*)(?:\.)?(\s+.*)$', renumber_heading, content)
    content = re.sub(r'(?m)^## 1\. 课程概述\n+', '', content)
    content = re.sub(
        r'(<span style="color:#1456f0">)(\d+(?:\.\d+)+)(</span>)',
        lambda match: match[1] + remap_number(match[2]) + match[3],
        content,
    )
    GUIDE.write_text(content.rstrip() + '\n', encoding='utf-8')
    print(f'Converted {len(doc)} pages: {image_count} inline images, {code_count} colored code blocks')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf', type=Path)
    convert(parser.parse_args().pdf)
