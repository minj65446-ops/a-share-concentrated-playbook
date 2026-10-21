#!/usr/bin/env node
/* ============================================================
   把 Web 端 K 线训练题库转成小程序端 ESM
   ------------------------------------------------------------
   为什么需要：
     训练题不是纯数据（带 build() / check()），不能用 gen-uni.js 的
     JSON.stringify 方案（函数会被丢掉）。所以这里用「标记抽取」：
     Web 源用 BODY:BEGIN / BODY:END 包住一段平台无关的代码，
     本脚本把它原样搬进小程序，再补上 ESM 导出。
     这样两端的题目、形态校验、洗牌逻辑永远同一份。

   用法（在仓库根目录）：
     node tools/gen-cases.js

   产出：
     miniprogram-uni/common/cases.js  ← 由 Web 端 cases.js 生成
   ============================================================ */
const fs = require('fs')
const path = require('path')

const REPO = process.argv[2] || '.'
const SRC = path.join(REPO, '..', 'trade-academy', 'cases.js')
const OUT = path.join(REPO, 'miniprogram-uni', 'common', 'cases.js')

if (!fs.existsSync(SRC)) {
  console.error('找不到 Web 源：' + SRC)
  process.exit(1)
}

const src = fs.readFileSync(SRC, 'utf8')
const b = src.indexOf('/* ===== BODY:BEGIN ===== */')
const e = src.indexOf('/* ===== BODY:END ===== */')
if (b < 0 || e < 0) {
  console.error('cases.js 里找不到 BODY:BEGIN / BODY:END 标记')
  process.exit(1)
}
const body = src.slice(b + '/* ===== BODY:BEGIN ===== */'.length, e).trim()

// 平台无关性自检：抽出来的代码不能碰 DOM / uni
const bad = body.match(/\b(document|window|uni\.|localStorage)\b/g)
if (bad) {
  console.error('抽取的题库代码里出现平台相关符号：' + Array.from(new Set(bad)).join(', '))
  process.exit(1)
}

const header =
  '/**\n' +
  ' * K 线训练题库（小程序端）\n' +
  ' * 由 Web 端 trade-academy/cases.js 自动生成，请勿手改。\n' +
  ' * ------------------------------------------------------------\n' +
  ' * · 每题的 K 线是合成数据，不映射任何真实标的\n' +
  ' * · 每次 build(i) 都会换一套随机路径（salt），同题型不会重复出同一张图\n' +
  ' * · 选项每次洗牌，正确答案的字母不固定，防止背答案\n' +
  ' */\n'

const tail =
  '\nexport { rng, seg }\n' +
  'export const cases = CASES\n' +
  'export const size = CASES.length\n' +
  'export const build = buildOne\n' +
  'export const buildCase = buildOne\n' +
  'export default CASES\n'

fs.writeFileSync(OUT, header + body + tail)

const n = (body.match(/\{\s*title:'/g) || []).length
console.log('生成 ' + path.relative(REPO, OUT) + '  (' + n + ' 道题，来自 Web 端 cases.js)')
console.log('改完记得跑三端一致性校验（_test/diff-v4.js）')
