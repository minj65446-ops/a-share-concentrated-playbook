/* ============================================================
   A股交易学院 · 段位成长体系
   ------------------------------------------------------------
   「从小白培养成大佬」需要一个可衡量的路径，而不是一堆内容。
   本文件定义 5 个段位，每段位有：解决什么 / 必修什么 / 毕业标准。

   毕业标准全部可计算 —— 不做「你觉得你学会了吗」这种自评，
   只认数据：读了几条、做了几题、连对多少、复盘了几天。

   段位参考两条真实路径：
     · 小雷大智慧（上交所真财实学课）：
       了解股票是什么 → 看懂一家公司 → 看懂市场 → 找到自己的方法
     · 二万哥三步法：筑基（练执行力）→ 寻道（找模式）→ 化境（知行合一）

   关键设计：Lv1 是「知道是什么」，Lv2 才是「知道怎么做」。
   多数教程直接从 Lv2 开始教，这是小白学不会的根本原因。
   ============================================================ */
(function(){
  'use strict';

  /* ============ 段位定义 ============ */
  const RANKS = [
    {
      id:'L1', name:'启蒙', en:'AWAKEN', sub:'知道你买的到底是什么',
      goal:'这一阶段不碰任何策略。你的任务只有一个：把「股票」从一个模糊的词，变成一件具体的事。',
      need:'读完 13 条启蒙概念',
      after:'毕业后你能：解释什么是市盈率、读懂一根 K 线的四个价格、说清 T+1 和跌停对一笔交易意味着什么。',
      check: st => ({
        ok: st.basics >= 13,
        cur: Math.min(st.basics, 13), total: 13,
        unit: '条', label: '启蒙概念'
      })
    },
    {
      id:'L2', name:'筑基', en:'DISCIPLINE', sub:'把「会亏多少」变成可计算的',
      goal:'新手的死法不是选错股，是不知道自己会亏多少。这一阶段把仓位、止损、成本全部变成数字。',
      need:'完成 3 门基础课 + 判题正确率 ≥ 60%（至少 5 题）',
      after:'毕业后你能：在下单前算出该买多少股、止损放在哪、这笔最多亏多少钱——不需要盘感，只需要算术。',
      check: st => {
        const c = ['01','02','03'].filter(x => st.done.indexOf(x) >= 0).length;
        const acc = st.kline.total >= 5 && (st.kline.right / st.kline.total) >= 0.6;
        return {
          ok: c === 3 && acc,
          cur: c + (acc ? 1 : 0), total: 4,
          unit: '项', label: '基础课 3 门 + 正确率达标',
          detail: ['核心+卫星', '仓位公式', '止损三锚', '判题正确率 ≥60%'].map((t,i) => ({
            t: t, on: i < 3 ? st.done.indexOf(['01','02','03'][i]) >= 0 : acc
          }))
        };
      }
    },
    {
      id:'L3', name:'寻道', en:'EXPLORE', sub:'找到适合你的那一派',
      goal:'知道 8 个流派各自靠什么赚钱，更重要的是——知道哪一派的「不适合人群」里有你。',
      need:'完成流派自测 + 至少 3 门进阶课',
      after:'毕业后你能：说出自己倾向哪一派、这一派在什么行情下会连续亏钱、以及你现在的资金量够不够格做它。',
      check: st => {
        const adv = ['04','05','06','07','08'].filter(x => st.done.indexOf(x) >= 0).length;
        return {
          ok: !!st.quiz && adv >= 3,
          cur: (st.quiz ? 1 : 0) + Math.min(adv, 3), total: 4,
          unit: '项', label: '流派自测 + 进阶课 3 门',
          detail: [
            { t: '完成流派自测', on: !!st.quiz },
            { t: '进阶课（趋势/轮动/龙头/红利/事件）至少 3 门', on: adv >= 3 }
          ]
        };
      }
    },
    {
      id:'L4', name:'系统', en:'SYSTEM', sub:'把选股到复盘串成闭环',
      goal:'零散的规则不算系统。系统要能在事前写下全部决策，事后逐条对照——不给自己临场发挥的余地。',
      need:'8 门课全完成 + 累计复盘 7 天',
      after:'毕业后你能：用一页纸写下你的完整规则（买什么、买多少、何时卖、何时空仓），并且能在每笔交易后对照检查。',
      check: st => {
        const r = Math.min(st.reviewDays, 7);
        return {
          ok: st.done.length >= 8 && st.reviewDays >= 7,
          cur: Math.min(st.done.length, 8) + r, total: 15,
          unit: '项', label: '8 门课 + 复盘 7 天',
          detail: [
            { t: '8 门课全完成', on: st.done.length >= 8 },
            { t: '累计复盘 7 天', on: st.reviewDays >= 7 }
          ]
        };
      }
    },
    {
      id:'L5', name:'化境', en:'MASTERY', sub:'知行合一，交易变无趣',
      goal:'最后一道坎不是技术，是执行。这一阶段的标准只有一个：连续做到。',
      need:'连续 7 天完成盘后三问 + 判题最高连对 ≥ 10',
      after:'毕业后你的标志不是赚了多少，而是：不再需要靠意志力止损。规则已经变成了动作。',
      check: st => ({
        ok: st.reviewStreak >= 7 && (st.kline.best || 0) >= 10,
        cur: Math.min(st.reviewStreak, 7) + Math.min(st.kline.best || 0, 10), total: 17,
        unit: '项', label: '连续复盘 7 天 + 连对 10',
        detail: [
          { t: '连续 7 天盘后三问', on: st.reviewStreak >= 7 },
          { t: '判题最高连对 ≥ 10', on: (st.kline.best || 0) >= 10 }
        ]
      })
    }
  ];

  /* ============ 状态读取 ============ */
  // st: { basics, done[], kline{total,right,best}, quiz, reviewDays, reviewStreak }
  function readState(store){
    const k = store.get('ta_kline', { total:0, right:0, streak:0, best:0 });
    return {
      basics: (store.get('ta_basics', []) || []).length,
      done: store.get('ta_done', []) || [],
      kline: { total: k.total || 0, right: k.right || 0, best: k.best || 0 },
      quiz: store.get('ta_quiz', null),
      reviewDays: countReviewDays(store),
      reviewStreak: reviewStreak(store)
    };
  }

  // 累计有多少天完成了盘后三问（三问全勾才算）
  function countReviewDays(store){
    let n = 0;
    const now = new Date();
    for (let i = 0; i < 400; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = 'ta_review_' + d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      const v = store.get(key, null);
      if (v && v.length >= 3) n++;
    }
    return n;
  }

  // 连续多少天完成（含今天或昨天，否则断）
  function reviewStreak(store){
    const now = new Date();
    let start = 0;
    // 今天没做的话从昨天算起，避免「今天还没做」直接归零
    const todayKey = k => 'ta_review_' + k;
    const keyOf = d => 'ta_review_' + d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    const t = new Date(now);
    if (!(store.get(keyOf(t), null) || []).length) start = 1;
    let n = 0;
    for (let i = start; i < 400; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const v = store.get(keyOf(d), null);
      if (v && v.length >= 3) n++;
      else break;
    }
    return n;
  }

  /* ============ 当前段位 ============ */
  function current(store){
    const st = readState(store);
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (RANKS[i].check(st).ok) idx = i + 1;
      else break;
    }
    const done = idx >= RANKS.length;
    const rank = done ? RANKS[RANKS.length - 1] : RANKS[idx];
    const g = rank.check(st);
    return {
      state: st,
      idx: idx,               // 已毕业的段位数
      rank: rank,
      next: done ? null : RANKS[idx],
      allDone: done,
      grad: g,
      pct: g.total ? Math.round(g.cur / g.total * 100) : 0,
      list: RANKS.map((r, i) => ({
        r: r,
        passed: i < idx,
        active: i === idx,
        g: r.check(st)
      }))
    };
  }

  window.RANKS = { list: RANKS, current: current, readState: readState };
})();
