/**
 * 流派自测（与 Web 端 quiz.js 同源）
 * 8 题，围绕：投入时间 / 承受回撤 / 本金规模。
 * 部分选项零权重——它们对应错误行为（补仓摊低成本、连亏换策略）。
 */
export const QUIZ = [
  {
    q: '你每天能投入多少时间在交易上？',
    opts: [
      { t: '基本全天盯盘', w: { longtou: 3, event: 2 }, note: '打板、事件驱动都要求实时在场' },
      { t: '收盘后能看 1 小时', w: { trend: 2, rotation: 3 }, note: '日线级别的趋势和轮动，盘后足够' },
      { t: '每周看一次就行', w: { value: 3, dividend: 3 }, note: '这两派本来就不看短期波动' },
      { t: '越不看盘越好', w: { dividend: 3, quant: 1 }, note: '指数化持有或程序化，是最低介入度' }
    ]
  },
  {
    q: '买入后跌了 8%，你的第一反应是？',
    opts: [
      { t: '到止损位了，按计划卖出', w: { trend: 3, rotation: 2, longtou: 2 }, note: '规则前置，这是跟随派的基本功' },
      { t: '重新检查买入理由，理由还在就继续拿', w: { value: 3, contrarian: 2 }, note: '逻辑止损，价值派的典型反应' },
      { t: '看是整个板块在跌还是只有它跌', w: { rotation: 3, trend: 1 }, note: '先归因再决策，轮动派思路' },
      { t: '补仓摊低成本', w: {}, note: '这是全部八派都反对的动作。补仓摊低成本的本质是「不肯承认判断错了」，它是小亏变大亏的标准路径。' }
    ]
  },
  {
    q: '你更愿意依据什么做决定？',
    opts: [
      { t: '价格和成交量本身', w: { trend: 3, longtou: 2 }, note: '只看价格行为，不预测基本面' },
      { t: '财报数据和行业景气', w: { value: 3, rotation: 2 }, note: '需要能读年报和行业数据' },
      { t: '政策和确定性事件', w: { event: 3, rotation: 1 }, note: '赌有明确时间窗口的事' },
      { t: '统计规律和历史回测', w: { quant: 3 }, note: '用大数定律替代主观判断' }
    ]
  },
  {
    q: '你能接受账户最大回撤是多少？',
    opts: [
      { t: '10% 以内，再多就睡不着', w: { dividend: 3, quant: 1 }, note: '低波配置派的目标区间' },
      { t: '20% 左右', w: { trend: 2, value: 2, rotation: 1 }, note: '趋势派和价值派的正常回撤' },
      { t: '30%–40%，能扛', w: { value: 3, contrarian: 3 }, note: '左侧建仓必然伴随深度浮亏' },
      { t: '50% 也能接受', w: { contrarian: 3 }, note: '困境反转的入场券，也是破产率最高的一条路' }
    ]
  },
  {
    q: '你希望多久做一次买卖决策？',
    opts: [
      { t: '每天都要有动作', w: { longtou: 3, event: 2 }, note: '高频意味着高成本和情绪消耗' },
      { t: '每周几次', w: { trend: 2, rotation: 2 }, note: '日线趋势的常规节奏' },
      { t: '每月调一次', w: { rotation: 3, dividend: 1 }, note: '月末统一调仓，其余时间不动' },
      { t: '一年就几次', w: { value: 3, dividend: 3, contrarian: 1 }, note: '等待真正的机会，其余时间持有' }
    ]
  },
  {
    q: '连续止损 5 次之后，你会怎么做？',
    opts: [
      { t: '继续按规则下第 6 单', w: { trend: 3 }, note: '趋势派的收益全靠少数大盈利覆盖连续小亏' },
      { t: '停下来判断现在是什么市场阶段', w: { longtou: 2, rotation: 2, value: 1 }, note: '先看阶段再动手，这是正确顺序' },
      { t: '先把仓位降下来观察', w: { dividend: 2, value: 1 }, note: '降低暴露，等条件恢复' },
      { t: '怀疑方法有问题，换个策略试试', w: {}, note: '这是策略失效的头号原因。连续止损是跟随类策略的正常成本，改参数等于把成本变成永久亏损。' }
    ]
  },
  {
    q: '你能投入的本金规模？',
    opts: [
      { t: '5 万以下', w: { dividend: 2, trend: 2 }, note: '小资金优先选摩擦成本低、门槛低的' },
      { t: '10 万 – 50 万', w: { trend: 2, rotation: 2, event: 2 }, note: '多数流派的最低门槛在这个区间' },
      { t: '50 万 – 500 万', w: { value: 2, longtou: 2, rotation: 1 }, note: '可以做行业集中和龙头聚焦' },
      { t: '500 万以上', w: { quant: 3, value: 1 }, note: '只有这个量级，量化的成本才摊得开' }
    ]
  },
  {
    q: '你要买入一只票，最主要的原因是？',
    opts: [
      { t: '它是这个方向最强、最主动的那只', w: { longtou: 3 }, note: '龙空龙：只做唯一的那个' },
      { t: '它在创新高，趋势结构完好', w: { trend: 3 }, note: '不预测，只跟随' },
      { t: '它便宜，生意本身还行', w: { value: 3, contrarian: 2 }, note: '价格低于内在价值' },
      { t: '它所在的行业正在景气上行', w: { rotation: 3 }, note: '先选赛道再选股' },
      { t: '有件确定要发生的事，赔率够', w: { event: 3 }, note: '事件驱动，兑现即走' },
      { t: '它分红稳定，股息率够高', w: { dividend: 3 }, note: '现金流托底' }
    ]
  }
]

export function score(answers) {
  const s = {}
  Object.keys(answers || {}).forEach(qi => {
    const opt = (QUIZ[qi].opts || [])[answers[qi]]
    if (!opt || !opt.w) return
    Object.keys(opt.w).forEach(k => { s[k] = (s[k] || 0) + opt.w[k] })
  })
  return s
}

export function result(answers) {
  const s = score(answers)
  const arr = Object.keys(s).map(k => ({ k, v: s[k] })).sort((a, b) => b.v - a.v)
  if (!arr.length) return null
  const total = arr.reduce((a, b) => a + b.v, 0) || 1
  return {
    top: arr[0].k,
    score: arr[0].v,
    share: Math.round(arr[0].v / total * 100),
    second: arr[1] ? arr[1].k : null,
    ranks: arr
  }
}
