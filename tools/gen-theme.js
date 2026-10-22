#!/usr/bin/env node
/* ============================================================
   把 Web 端主题搬进小程序
   ------------------------------------------------------------
   两件事：
     1. common/theme.js  —— 主题元数据（BODY 标记抽取，与 gen-cases.js 同思路）
     2. App.vue 的主题变量段 —— 从 app.css :root + themes.css 的 [data-theme]
        解析出来，px 转 rpx 后写进 THEMES:BEGIN / THEMES:END 之间
   这样「有哪些主题、每套什么颜色」永远只有一个源：Web 端。

   用法（在仓库根目录）：
     node tools/gen-theme.js

   产出：
     miniprogram-uni/common/theme.js
     miniprogram-uni/App.vue（就地替换主题段）
   ============================================================ */
const fs = require('fs')
const path = require('path')

const REPO = process.argv[2] || '.'
const WEB = path.join(REPO, '..', 'trade-academy')
const SRC = path.join(WEB, 'theme.js')
const CSS = path.join(WEB, 'app.css')
const THCSS = path.join(WEB, 'themes.css')
const OUT = path.join(REPO, '..', 'miniprogram-uni', 'common', 'theme.js')
const APPVUE = path.join(REPO, '..', 'miniprogram-uni', 'App.vue')

for (const f of [SRC, CSS, THCSS]) {
  if (!fs.existsSync(f)) { console.error('找不到：' + f); process.exit(1) }
}

/* ---------- 1. common/theme.js ---------- */
const src = fs.readFileSync(SRC, 'utf8')
const B = '/* ===== BODY:BEGIN ===== */'
const E = '/* ===== BODY:END ===== */'
const b = src.indexOf(B)
const e = src.indexOf(E)
if (b < 0 || e < 0) { console.error('theme.js 里找不到 BODY:BEGIN / BODY:END 标记'); process.exit(1) }
const body = src.slice(b + B.length, e).trim()

const bad = body.match(/\b(document|window|uni\.|localStorage)\b/g)
if (bad) { console.error('抽取的主题代码里出现平台相关符号：' + Array.from(new Set(bad)).join(', ')); process.exit(1) }

const header =
  '/**\n' +
  ' * 界面风格 · 主题元数据（小程序端）\n' +
  ' * 由 Web 端 trade-academy/theme.js 自动生成，请勿手改。\n' +
  ' * ------------------------------------------------------------\n' +
  ' * 颜色变量定义在 App.vue 的 .t-* 类里（同样由 tools/gen-theme.js 生成）。\n' +
  ' */\n'

const tail =
  '\n/* 小程序端存裸字符串（Web 端是 JSON.stringify），两端互相兼容读取 */\n' +
  'export function read() {\n' +
  '  let v = \'\'\n' +
  '  try { v = uni.getStorageSync(\'ta_theme\') || \'\' } catch (err) {}\n' +
  '  if (!v) return DEFAULT\n' +
  '  if (v.charAt(0) === \'"\') { try { v = JSON.parse(v) } catch (err) { return DEFAULT } }\n' +
  '  return valid(v) ? v : DEFAULT\n' +
  '}\n' +
  '\nexport function apply(k) {\n' +
  '  if (!valid(k)) k = DEFAULT\n' +
  '  try { uni.setStorageSync(\'ta_theme\', k) } catch (err) {}\n' +
  '  const nav = {\n' +
  '    light: [\'#000000\', \'#f4f5f7\'],\n' +
  '    dark: [\'#ffffff\', \'#0e131a\'],\n' +
  '    paper: [\'#000000\', \'#faf7f0\'],\n' +
  '    mono: [\'#000000\', \'#ffffff\'],\n' +
  '    celadon: [\'#000000\', \'#f2f6f5\']\n' +
  '  }[k]\n' +
  '  try {\n' +
  '    uni.setNavigationBarColor({ frontColor: nav[0], backgroundColor: nav[1] })\n' +
  '    uni.setBackgroundColor({ backgroundColor: nav[1] })\n' +
  '  } catch (err) {}\n' +
  '  return k\n' +
  '}\n' +
  '\nexport { THEMES, DEFAULT, valid, nameOf, CANVAS, canvas }\n'

fs.writeFileSync(OUT, header + body + tail)
const n = (body.match(/\{ k:'/g) || []).length
console.log('生成 ' + path.relative(REPO, OUT) + '  (' + n + ' 套主题)')

/* ---------- 2. App.vue 主题变量段 ---------- */
/* 小程序用不到的变量（Web 专属的字体 / 阴影 / 玻璃拟态等） */
const SKIP = /^--(font|font-serif|mono|shadow|shadow-s|shadow-l|page-shadow|focus-ring|hero-shadow|glass|glass-2|mask|hero-btn-bg|hero-btn-ink|danger)$/
/* 需要 px → rpx 的 */
const RPX = /^--r(-lg|-sm)?$/

function varsOf(block) {
  const m = {}
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g
  let x
  while ((x = re.exec(block))) {
    const k = '--' + x[1]
    if (SKIP.test(k)) continue
    let v = x[2].trim()
    if (RPX.test(k)) v = v.replace(/(-?[\d.]+)px/g, (s, num) => (parseFloat(num) * 2) + 'rpx')
    m[k] = v
  }
  return m
}

/* 默认主题 = app.css 的 :root */
const appcss = fs.readFileSync(CSS, 'utf8')
const rootM = /:root\s*\{([\s\S]*?)\n\}/.exec(appcss)
if (!rootM) { console.error('app.css 里找不到 :root'); process.exit(1) }
const base = varsOf(rootM[1])

/* 其余主题 = themes.css 的 [data-theme="x"]{...}（只取第一层花括号，跳过内部嵌套规则） */
const th = fs.readFileSync(THCSS, 'utf8')
const themes = {}
const re = /\[data-theme="([a-z]+)"\]\s*\{([^}]*)\}/g
let mm
while ((mm = re.exec(th))) themes[mm[1]] = varsOf(mm[2])

/* 主题块里没写的沿用默认，保证每套的变量集完全一致 */
const keys = Object.keys(base)
function dump(obj, indent) {
  return keys.map(k => indent + k + ':' + (obj[k] !== undefined ? obj[k] : base[k]) + ';').join('\n')
}

let out = '/* THEMES:BEGIN · 由 tools/gen-theme.js 从 Web 端 app.css / themes.css 生成，勿手改 */\n'
out += 'page {\n' + dump(base, '  ') + '\n}\n'
Object.keys(themes).forEach(k => {
  out += '.t-' + k + ' {\n' + dump(themes[k], '  ') + '\n}\n'
})
out += '/* THEMES:END */'

if (!fs.existsSync(APPVUE)) { console.error('找不到 App.vue'); process.exit(1) }
let av = fs.readFileSync(APPVUE, 'utf8')
const AB = '/* THEMES:BEGIN'
const AE = '/* THEMES:END */'
const ai = av.indexOf(AB)
const ae = av.indexOf(AE)
if (ai < 0 || ae < 0) { console.error('App.vue 里找不到 THEMES:BEGIN / THEMES:END 标记'); process.exit(1) }
av = av.slice(0, ai) + out + av.slice(ae + AE.length)
fs.writeFileSync(APPVUE, av)
console.log('生成 ' + path.relative(REPO, APPVUE) + ' 主题段  (' + (Object.keys(themes).length + 1) + ' 套)')
console.log('改完记得跑主题一致性校验（_test/theme.js）')
