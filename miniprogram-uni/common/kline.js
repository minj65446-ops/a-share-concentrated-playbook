/**
 * K 线训练题（小程序端）
 * 与 Web 端 app.js 的 CASES 同源，此处保留 2 个代表题。
 * 数据为确定性合成，不映射任何真实标的。
 */
function rng(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seg(n, start, drift, vol, seed, vb) {
  const r = rng(seed)
  let p = start
  const out = []
  for (let i = 0; i < n; i++) {
    const o = p
    const c = Math.max(0.5, p * (1 + drift + (r() * 2 - 1) * vol))
    const h = Math.max(o, c) * (1 + r() * 0.004)
    const l = Math.min(o, c) * (1 - r() * 0.004)
    out.push({ o: o, h: h, l: l, c: c, v: (0.5 + r()) * (vb || 1) })
    p = c
  }
  return out
}

const CASES = [
  {
    title: '放量突破前高',
    q: '图上标了三个位置，哪个才是符合系统的买点？',
    build() {
      const a = seg(30, 20, 0.0035, 0.012, 101)
      const b2 = seg(12, a[a.length - 1].c, -0.002, 0.010, 202)
      const c3 = seg(5, b2[b2.length - 1].c, 0.014, 0.009, 303, 2.6)
      const d4 = seg(9, c3[c3.length - 1].c, -0.003, 0.008, 404)
      return {
        bars: a.concat(b2, c3, d4),
        marks: [{ i: 41, label: 'A' }, { i: 50, label: 'B' }, { i: 54, label: 'C' }],
        opts: [
          { k: 'A', t: 'A：突破前一天潜伏，成本最低' },
          { k: 'B', t: 'B：突破后回踩不破，确认再加仓' },
          { k: 'C', t: 'C：突破后第四天，趋势已经确立' }
        ],
        ans: 'B',
        why: '突破当天买，最大风险是假突破——放量冲高再砸回来，你连反应时间都没有。等回踩确认不破，成本高 2%–3%，但把「假突破」这个最大亏损来源过滤掉了。'
      }
    }
  },
  {
    title: '高位放量长上影',
    q: '这根长上影出现后，系统的动作是什么？',
    build() {
      const a = seg(32, 15, 0.005, 0.011, 505)
      const last = a[a.length - 1].c
      a.push({ o: last, c: last * 1.004, h: last * 1.062, l: last * 0.996, v: 3.4 })
      const b2 = seg(12, last * 1.004, -0.004, 0.010, 606)
      return {
        bars: a.concat(b2),
        marks: [{ i: 24, label: 'A' }, { i: 32, label: 'B' }, { i: 40, label: 'C' }],
        opts: [
          { k: 'A', t: 'A：上涨途中，趋势完好，继续持有' },
          { k: 'B', t: 'B：长上影当天，放量滞涨，减仓一半' },
          { k: 'C', t: 'C：后面跌了再说，等跌破均线' }
        ],
        ans: 'B',
        why: '连续上涨后放量长上影，说明当天有大量资金在更高价位出货。这是趋势可能转折的第一个信号，不是确认——所以动作是「减仓」而不是「清仓」：留底仓看后续，先把大部分利润锁住。'
      }
    }
  }
]

export function buildCase(i) {
  const c = CASES[i % CASES.length].build()
  c.title = CASES[i % CASES.length].title
  c.q = CASES[i % CASES.length].q
  return c
}

export default CASES
