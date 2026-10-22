#!/usr/bin/env node
/* ============================================================
   把 Web 端的「带函数」模块搬成小程序端 ESM
   ------------------------------------------------------------
   gen-uni.js 只搬纯数据（emit 走 JSON.stringify），搬不动函数。
   learn.js / cards.js / srs.js 的 BODY 段是平台无关的纯 JS，
   所以这里按 /* BODY:BEGIN *​/ … /* BODY:END *​/ 原样切片，
   再补上小程序端需要的两处适配：

     1. 存储适配 —— Web 端注入的是 { get, set }（localStorage 包装），
        小程序端给一个基于 uni.getStorageSync 的同签名对象。
        模块本身完全不知道自己在哪个端。
     2. 导出适配 —— 把 BODY 里的 `const API = {...}` 换成
        `export { ... }`，让 .vue 里能 import。

   为什么要这样而不是各写一份：
     掌握度模型、连击判定这些是「业务规则」，两边写法只要有一点差异，
     就会出现「网页上算掌握、小程序上算生疏」这种没法解释的 bug。
     规则只能有一个源头。_test/sync.js 会校验生成物与 Web 源一致。

   用法（在仓库根目录的上一级）：
     node tools/gen-learn.js
   ============================================================ */
const fs = require('fs')
const path = require('path')

const REPO = process.argv[2] || '.'
const WEB = path.join(REPO, '..', 'trade-academy')
const OUT = path.join(REPO, 'miniprogram-uni', 'common')

const BEGIN = '/* ===== BODY:BEGIN ===== */'
const END = '/* ===== BODY:END ===== */'

/** 切出 BODY 段；找不到就报错，避免静默生成一个空文件 */
function sliceBody(file) {
  const p = path.join(WEB, file)
  if (!fs.existsSync(p)) {
    console.log('跳过：找不到 Web 源 ' + p)
    return null
  }
  const src = fs.readFileSync(p, 'utf8')
  const a = src.indexOf(BEGIN), b = src.indexOf(END)
  if (a < 0 || b < 0 || b < a) {
    console.error('❌ ' + file + ' 缺少 BODY 标记，无法切片')
    process.exitCode = 1
    return null
  }
  return src.slice(a + BEGIN.length, b).trimEnd()
}

/* 小程序端的 store 适配层。签名和 Web 端的 { get(k, d), set(k, v) } 一致，
   所以 learn.js 里的 readProf / writeProf 一行都不用改。 */
const STORE_ADAPTER =
  '/* 小程序端存储适配：与 Web 端 localStorage 包装同签名（get / set）\n' +
  '   learn.js 的 BODY 段只认这两个方法，因此两边跑的是同一份规则代码 */\n' +
  'export const store = {\n' +
  '  get(k, d) {\n' +
  '    try {\n' +
  '      const v = uni.getStorageSync(k)\n' +
  '      if (v === \'\' || v === null || v === undefined) return d\n' +
  '      return typeof v === \'string\' ? JSON.parse(v) : v\n' +
  '    } catch (e) { return d }\n' +
  '  },\n' +
  '  set(k, v) {\n' +
  '    try { uni.setStorageSync(k, JSON.stringify(v)) } catch (e) {}\n' +
  '  }\n' +
  '}\n'

/** 写一个模块：body + 把 `const API = {...}` 转成具名导出 */
function emit(file, header, extraHead, apiNote) {
  const body = sliceBody(file)
  if (body === null) return false

  /* `const API = { a: a, b: b }` → `export { a, b }`，保持一行一个的可读性；
     Web 端这句是给人看的门面，小程序端不需要门面，直接导出。 */
  const m = body.match(/const API = \{([\s\S]*?)\};?\s*$/)
  let out = body
  let exp = ''
  let glue = ''
  if (m) {
    /* `{ list: CARDS, groups: GROUPS, byGroup: byGroup, size: CARDS.length }`
       → 取「键 : 值」。键是对外名字，值是内部引用的表达式。
       Web 端 API 里有几个是「算出来的」（size = CARDS.length），
       直接把 `size` 挂到 export 里会报 “Export 'size' is not defined”
       —— 所以这类需要在 BODY 末尾补一行 `const size = CARDS.length`，
       再按普通名字导出。 */
    const pairs = m[1].split(',').map(seg => {
      const i = seg.indexOf(':')
      const k = (i < 0 ? seg : seg.slice(0, i)).trim()
      const v = (i < 0 ? k : seg.slice(i + 1).trim())
      const isIdent = /^[A-Za-z_$][\w$]*$/.test(v)
      return { key: k, val: v, ident: isIdent ? v : k, needLocal: !isIdent }
    }).filter(p => /^[A-Za-z_$][\w$]*$/.test(p.key) && /^[A-Za-z_$][\w$]*$/.test(p.ident))

    const extra = pairs.filter(p => p.needLocal)
      .map(p => 'const ' + p.ident + ' = ' + p.val)
      .join('\n')

    out = body.slice(0, m.index).trimEnd()
    if (extra) glue = '/* Web 端 API 里的计算项，这里落成一个普通变量以便导出 */\n' + extra + '\n'
    exp = '\nexport {\n' + pairs.map(p => '  ' + (p.ident === p.key ? p.ident : p.ident + ' as ' + p.key)).join(',\n') + '\n}\n'
  } else {
    console.error('❌ ' + file + ' 里没找到 `const API = {`，导出列表无法推导')
    process.exitCode = 1
  }

  const p = path.join(OUT, file)
  /* BODY 标记要夹住「纯规则段」：END 放在 API 之前。
     否则 END 之后还有 `const size = …`，_test/sync.js 里切出来的段会比
     Web 源长一截，每天都会报一次假的不一致。 */
  fs.writeFileSync(p, header + '\n' + (extraHead || '') + BEGIN + '\n' + out + '\n' + END + '\n' + (glue || '') + exp)
  const kb = (fs.statSync(p).size / 1024).toFixed(1)
  console.log('生成 ' + path.relative(REPO, p) + '  (' + kb + ' KB)' +
    (m ? '  导出 ' + m[1].split(',').length + ' 个' : ''))
  return true
}

console.log('从 Web 源生成小程序端学习模块\n')

/* ---------- learn.js：学习档案（经验 / 连击 / 掌握度） ---------- */
emit('learn.js',
  '/**\n' +
  ' * 学习档案 —— 由 Web 端 learn.js 生成，请勿手改\n' +
  ' * ------------------------------------------------------------\n' +
  ' * 经验值、连击、补签卡、掌握度。规则与 Web 端完全相同（同一份 BODY）。\n' +
  ' *\n' +
  ' * 为什么经验值不参与段位判定：\n' +
  ' *   段位只认真实成果（读完多少、做对多少、复盘几天）。经验值是「本段内的\n' +
  ' *   进度感」，如果能买段位，那它就成了刷分的游戏，段位也就不值钱了。\n' +
  ' *   这条约束在 _test/v8.js 里用源码扫描固化，改代码会被测试拦住。\n' +
  ' */\n',
  STORE_ADAPTER + '\n')

/* ---------- cards.js：答题卡题库 ---------- */
emit('cards.js',
  '/**\n' +
  ' * 答题卡题库 —— 由 Web 端 cards.js 生成，请勿手改\n' +
  ' * ------------------------------------------------------------\n' +
  ' * 24 张概念卡，三组：概念地基 / 算得清 / 守得住。\n' +
  ' * 每卡：id / g（组）/ tag（考点）/ q（问）/ a（对）/ d（3 个干扰项）/ why / trap\n' +
  ' *\n' +
  ' * 与 K 线题的分工：K 线考「认形态」，这里考「记没记住」。\n' +
  ' * 所以题库固定不换路径，但选项顺序每次洗——记的是道理，不是位置。\n' +
  ' */\n')

/* ---------- srs.js：出题引擎 ---------- */
emit('srs.js',
  '/**\n' +
  ' * 判题引擎 —— 由 Web 端 srs.js 生成，请勿手改\n' +
  ' * ------------------------------------------------------------\n' +
  ' * 一次十题、错题优先、组内均衡、选项洗牌。\n' +
  ' *\n' +
  ' * SESSION = 10 是刻意的：无限刷会刷到麻木，正确率虚高；\n' +
  ' * 十题一组有明确终点，人会更认真对待每一题。\n' +
  ' */\n')

console.log('\n改完记得跑 _test/sync.js（三端一致）与 _test/v8.js（规则不变）')
