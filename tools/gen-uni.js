#!/usr/bin/env node
/* ============================================================
   把 Web 端（IIFE + window.*）的纯数据文件转成小程序端（ESM）
   ------------------------------------------------------------
   为什么需要：
     三端各写一份数据，迟早会漂移。已经踩过两次：
       · Web rank.js L3 写 st.quiz && ... 返回 null，小程序端是 !!st.quiz
       · 小程序端 4 个反面样本缺 right 字段，详情页空白
     纯数据块（不依赖 DOM / uni API）应当只有一个源头，另一份生成。

   用法（在仓库根目录）：
     node tools/gen-uni.js

   产出：
     miniprogram-uni/common/basics.js    ← 由 Web 端 basics.js 生成

   注意：
     只转「数据」。含 check(st) 这类函数的段位定义不适合整体生成
     （小程序端要换成 uni.getStorageSync），仍手工维护，靠 _test/diff 校验。
   ============================================================ */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const REPO = process.argv[2] || '.'
const WEB = path.join(REPO, '..', 'trade-academy')   // 工作区内 Web 源目录
const OUT = path.join(REPO, 'miniprogram-uni', 'common')

/** 在沙箱里执行 Web 的 IIFE，取 window 上挂的东西 */
function loadWeb(file, name) {
  const p = path.join(WEB, file)
  if (!fs.existsSync(p)) {
    console.log('跳过：找不到 Web 源 ' + p)
    return null
  }
  const ctx = { window: {}, console }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(p, 'utf8'), ctx)
  return ctx.window[name]
}

/** 一个 Web 全局对象 → 若干具名 ESM 导出 */
function emit(file, globalName, keys, header) {
  const obj = loadWeb(file, globalName)
  if (!obj) return false
  let body = ''
  keys.forEach(([prop, exportName]) => {
    body += 'export const ' + exportName + ' = ' +
      JSON.stringify(obj[prop], null, 2) + '\n\n'
  })
  const p = path.join(OUT, file)
  fs.writeFileSync(p, header + body.trimEnd() + '\n')
  const n = Array.isArray(obj[keys[0][0]]) ? obj[keys[0][0]].length : '-'
  console.log('生成 ' + path.relative(REPO, p) + '  (' + n + ' 项)')
  return true
}

console.log('从 Web 源生成小程序数据文件\n')

emit('basics.js', 'BASICS', [['list', 'BASICS'], ['groups', 'GROUPS']],
  '/**\n' +
  ' * Lv1 启蒙数据 —— 由 Web 端 basics.js 生成，请勿手改\n' +
  ' * ------------------------------------------------------------\n' +
  ' * 不讲策略，只回答「你买的到底是什么」。\n' +
  ' * 每条：no / grp / title / one（一句话）/ why（为什么重要）/ mis（常见误解）/ eg（例子）/ link\n' +
  ' */\n')

emit('deaths.js', 'DEATHS', [['list', 'DEATHS'], ['groups', 'DGROUPS']],
  '/**\n' +
  ' * 亏损案例库 —— 由 Web 端 deaths.js 生成，请勿手改\n' +
  ' * ------------------------------------------------------------\n' +
  ' * 从小白到「大佬」之间，拉开差距的不是学了多少方法，是见过多少种死法。\n' +
  ' * 每条：scene（场景）/ think（你以为）/ real（实际发生了什么）/ fix（正确做法）/ link（相关启蒙条目）\n' +
  ' */\n')

console.log('\n改完记得跑三端一致性校验（_test/diff-v4.js）')
