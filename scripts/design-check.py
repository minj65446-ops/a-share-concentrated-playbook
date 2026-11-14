#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
design-check.py — 交易台设计规范的自动验收（对应 docs/DESIGN-RULES.md）
用法：python scripts/design-check.py
退出码：0 = 全部硬性规则通过；1 = 有 FAIL。

分层口径：
  N 层（新代码）：v12.css + index.html + journal.js  —— 硬性规则 0 容忍
  L 层（遗留）  ：app.css —— 只统计趋势，不阻断；改动旧组件时顺带收编
"""
import re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(name):
    with open(os.path.join(ROOT, name), encoding='utf-8') as f:
        return f.read()

v12     = read('v12.css')
app     = read('app.css')
html    = read('index.html')
journal = read('journal.js')

results = []
def rule(level, rid, msg, details=None):
    results.append((level, rid, msg, details or []))

def strip_root_blocks(src):
    src = re.sub(r':root\s*\{[^{}]*\}', '', src)
    src = re.sub(r'\[data-theme="[^"]*"\]\s*\{[^{}]*\}', '', src)
    return src

n_css = strip_root_blocks(v12)
l_css = strip_root_blocks(app)

def lineno(src, pos):
    return src[:pos].count('\n') + 1

# ---- R01 N 层组件不允许硬编码 hex 颜色 --------------------------------------
hard = []
for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b', n_css):
    h = m.group(0).lower()
    if h in ('#fff', '#ffffff'):  # 深底上的白字允许
        continue
    hard.append((m.group(0), lineno(n_css, m.start())))
if hard:
    rule('FAIL', 'R01', f'N 层发现 {len(hard)} 处硬编码颜色（必须走 var(--*)）',
         [f'{h} @v12.css:{l}' for h, l in hard[:10]])
else:
    rule('PASS', 'R01', 'N 层无硬编码颜色，全部走令牌变量')

# ---- R02 阴影只允许 var(--shadow*)/var(--focus-ring) 或 none ----------------
bad_shadow = []
for m in re.finditer(r'box-shadow\s*:\s*([^;}]+)', n_css):
    val = m.group(1).strip()
    if val == 'none' or 'var(' in val:
        continue
    if re.search(r'#[0-9a-fA-F]{3}|rgba?\(', val):
        bad_shadow.append((val, lineno(n_css, m.start())))
if bad_shadow:
    rule('FAIL', 'R02', f'N 层发现 {len(bad_shadow)} 处字面阴影（阴影必须走 --shadow* 令牌）',
         [f'{v} @v12.css:{l}' for v, l in bad_shadow[:8]])
else:
    rule('PASS', 'R02', 'N 层阴影全部来自令牌')

# ---- R03 进度条统一 4px / 方角 / 无渐变（查 v12 覆盖层的生效值）--------------
BAR_CLASSES = ['.bar', '.rankbar', '.qprog', '.grpbar-track', '.qbar .track', '.lvcard .bar']
bad = []
for cls in BAR_CLASSES:
    for m in re.finditer(re.escape(cls) + r'[^{}]*\{([^{}]*)\}', n_css):
        body = m.group(1)
        sel = n_css[max(0, m.start()-60):m.start()].split('}')[-1].strip() or cls
        h = re.search(r'height\s*:\s*(\d+)px', body)
        if h and h.group(1) != '4':
            bad.append(f'{cls}: height={h.group(1)}px')
        r = re.search(r'border-radius\s*:\s*([^;}]+)', body)
        if r and r.group(1).strip() not in ('0', 'var(--r-0)'):
            bad.append(f'{cls}: radius={r.group(1).strip()}')
        if 'gradient' in body:
            bad.append(f'{cls}: gradient')
if bad:
    rule('FAIL', 'R03', '进度条未统一（必须 height:4px / border-radius:0 / 无渐变）', bad[:10])
else:
    rule('PASS', 'R03', '进度条统一 4px、方角、无渐变')

# ---- R04 一屏只留一块深色面：.hero 精确唯一 ----------------------------------
hero_count = len(re.findall(r'class="hero"', html))
if hero_count != 1:
    rule('FAIL', 'R04', f'class="hero" 出现 {hero_count} 次（必须为 1）')
else:
    rule('PASS', 'R04', '深色面唯一（.hero × 1）')

# ---- R05 圆角只允许 --r-* 令牌（纯圆 50%/999px 豁免）-------------------------
bad_r = []
for m in re.finditer(r'border-radius\s*:\s*([^;}]+)', n_css):
    val = m.group(1).strip()
    if val.startswith('var(') or val == '0' or re.fullmatch(r'50%|99+px', val):
        continue
    bad_r.append((val, lineno(n_css, m.start())))
if bad_r:
    rule('FAIL', 'R05', f'N 层发现 {len(bad_r)} 处字面圆角（必须用 var(--r-*)）',
         [f'{v} @v12.css:{l}' for v, l in bad_r[:10]])
else:
    rule('PASS', 'R05', 'N 层圆角全部来自 --r-* 令牌')

# ---- R06 空状态：列表不得留白 ------------------------------------------------
if 'jr-empty' in journal and '.jr-empty' in v12:
    rule('PASS', 'R06', '复盘列表有空态（jr-empty，JS 渲染 + CSS 样式均在位）')
else:
    rule('FAIL', 'R06', '复盘列表空态缺失（jr-empty 需在 journal.js 与 v12.css 同时存在）')

# ---- R07 可访问性底线 --------------------------------------------------------
both = v12 + '\n' + l_css
has_focus = ':focus-visible' in both
has_rm = 'prefers-reduced-motion' in both
if has_focus and has_rm:
    rule('PASS', 'R07', 'focus-visible 与 reduced-motion 均在位')
else:
    miss = ('focus-visible ' if not has_focus else '') + ('reduced-motion' if not has_rm else '')
    rule('FAIL', 'R07', f'可访问性缺失: {miss}')

# ---- R08 HTML 内联样式不得携带颜色 / 字号 / 字族 ------------------------------
bad_inline = []
for m in re.finditer(r'style="([^"]*)"', html):
    s = m.group(1)
    if re.search(r'background|(?<!-)color|border-color|font-size|font-family|#[0-9a-fA-F]{3}', s):
        bad_inline.append((s[:70], lineno(html, m.start())))
if bad_inline:
    rule('FAIL', 'R08', f'{len(bad_inline)} 处内联样式携带颜色/字号/字族（内联只允许几何参数）',
         [f'{s} @index.html:{l}' for s, l in bad_inline[:8]])
else:
    rule('PASS', 'R08', '内联样式只含几何参数')

# ---- INFO：L 层遗留统计（不阻断，趋势应向下）---------------------------------
l_hex = len([m for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b', l_css)
             if m.group(0).lower() not in ('#fff', '#ffffff')])
l_rad = len([m for m in re.finditer(r'border-radius\s*:\s*([^;}]+)', l_css)
             if not m.group(1).strip().startswith('var(') and m.group(1).strip() != '0'])
rule('INFO', 'L01', f'L 层（app.css）遗留：硬编码颜色 {l_hex} 处、字面圆角 {l_rad} 处——改动旧组件时顺带收编')
px_fonts = sorted({int(m.group(1)) for m in re.finditer(r'font-size\s*:\s*(\d+)px', n_css)})
rule('INFO', 'F01', f'N 层字阶 {len(px_fonts)} 级: {px_fonts}')

# ---- 输出 --------------------------------------------------------------------
fails = [r for r in results if r[0] == 'FAIL']
for level, rid, msg, details in results:
    icon = {'PASS': '✓', 'FAIL': '✗', 'INFO': '·'}[level]
    print(f'{icon} [{rid}] {msg}')
    for d in details:
        print(f'    {d}')
print()
print(f'{len([r for r in results if r[0]=="PASS"])} passed, {len(fails)} failed, '
      f'{len([r for r in results if r[0]=="INFO"])} info')
sys.exit(1 if fails else 0)
