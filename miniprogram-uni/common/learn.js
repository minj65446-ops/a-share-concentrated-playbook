/**
 * 学习档案 —— 由 Web 端 learn.js 生成，请勿手改
 * ------------------------------------------------------------
 * 经验值、连击、补签卡、掌握度。规则与 Web 端完全相同（同一份 BODY）。
 *
 * 为什么经验值不参与段位判定：
 *   段位只认真实成果（读完多少、做对多少、复盘几天）。经验值是「本段内的
 *   进度感」，如果能买段位，那它就成了刷分的游戏，段位也就不值钱了。
 *   这条约束在 _test/v8.js 里用源码扫描固化，改代码会被测试拦住。
 */

/* 小程序端存储适配：与 Web 端 localStorage 包装同签名（get / set）
   learn.js 的 BODY 段只认这两个方法，因此两边跑的是同一份规则代码 */
export const store = {
  get(k, d) {
    try {
      const v = uni.getStorageSync(k)
      if (v === '' || v === null || v === undefined) return d
      return typeof v === 'string' ? JSON.parse(v) : v
    } catch (e) { return d }
  },
  set(k, v) {
    try { uni.setStorageSync(k, JSON.stringify(v)) } catch (e) {}
  }
}

/* ===== BODY:BEGIN ===== */


  const PROF_KEY = 'ta_prof';
  const MAST_KEY = 'ta_mast';

  /* 经验值。数值只影响节奏感，不影响段位判定——
     所以宁可给得保守一点，让「升级」还是有点分量。 */
  const XP = {
    basic: 10,     // 读一条启蒙
    course: 30,    // 完成一门课
    card: 15,      // 答对一张答题卡
    kline: 15,     // 答对一道 K 线题
    review: 20,    // 完成一次盘后三问（三问全勾）
    quiz: 40,      // 完成流派自测
    death: 5,      // 读一条死法（只为鼓励看完，不值钱）
    session: 50    // 十题一组清完
  };

  /* 段位内的经验门槛。段位本身由 rank.js 决定，这里只是把
     「本段内的努力」可视化。到顶就停在 100%，不额外解锁任何东西。 */
  const SEG_XP = 200;

  /* ---------- 日期 ---------- */
  function dayOf(d){
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function dayNum(s){
    const p = String(s).split('-');
    return Date.UTC(+p[0], (+p[1] || 1) - 1, +p[2] || 1) / 86400000;
  }
  function today(){ return dayOf(new Date()); }
  function yesterday(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayOf(d);
  }

  /* ---------- 档案 ---------- */
  function readProf(store){
    const p = store.get(PROF_KEY, null) || {};
    return {
      xp: p.xp || 0,
      streak: p.streak || 0,
      lastDay: p.lastDay || '',
      frozen: p.frozen === true,        // 今天用了补签卡
      freezeLast: p.freezeLast || '',   // 上次补签的日期，防止一天补两次
      freezes: p.freezes || 0,          // 还没用掉的补签卡
      log: p.log || [],                 // 今天做了什么（按条聚合）
      days: p.days || []                // 有学习记录的日期（近 30 天用）
    };
  }
  function writeProf(store, p){
    store.set(PROF_KEY, p);
    return p;
  }

  /* 今天已经在学了吗 */
  function activeToday(store){
    return readProf(store).lastDay === today();
  }

  /* 记一次「今天有学习」，并把连击推上去。
     规则：
       · 昨天也学过 → streak + 1
       · 昨天没学但用了补签卡 → 保留 streak（不 +1，不归零）
       · 断了 → 从 1 重新开始
     连击只在「今天第一次学」时结算，重复调用不重复加。 */
  function touch(store){
    const p = readProf(store);
    const t = today();
    if (p.lastDay === t){
      if (p.days.indexOf(t) < 0) p.days = p.days.concat([t]).slice(-60);
      return writeProf(store, p);
    }
    const y = yesterday();
    if (p.lastDay === y){
      p.streak = (p.streak || 0) + 1;
    } else if (p.frozen && p.freezeLast === y){
      p.streak = Math.max(1, p.streak || 1);
    } else if (p.lastDay){
      p.streak = 1;
    } else {
      p.streak = 1;
    }
    p.lastDay = t;
    p.frozen = false;
    if (p.days.indexOf(t) < 0) p.days = p.days.concat([t]).slice(-60);
    return writeProf(store, p);
  }

  /* 加经验值。xp 的累加不设上限，但段位内进度条用 SEG_XP 截断。
     why 只是给「今天做了什么」列表用的说明文字，不参与计算。 */
  function addXp(store, n, why){
    const p = touch(store);
    const add = Math.max(0, n | 0);
    p.xp = (p.xp || 0) + add;
    if (why){
      const d = today();
      const same = (p.log || []).filter(x => x.d === d && x.w === why)[0];
      if (same) same.xp += add;
      else p.log = (p.log || []).concat([{ d: d, w: why, xp: add }]).slice(-40);
    }
    return writeProf(store, p);
  }

  /* 补签卡：连击断了的时候，可以补昨天。
     设计上刻意做得不显眼——它只是防止「断一天就全废」的心理放弃，
     不是让打卡变成可作弊的积分游戏。 */
  function useFreeze(store){
    const p = readProf(store);
    if ((p.freezes || 0) <= 0) return { ok:false, reason:'no-card' };
    const t = today();
    if (p.lastDay === t) return { ok:false, reason:'today-done' };
    const y = yesterday();
    if (p.lastDay !== y) return { ok:false, reason:'gap-too-long' };
    p.freezes -= 1;
    p.frozen = true;
    p.freezeLast = t;
    return { ok:true, prof: writeProf(store, p) };
  }
  function grantFreeze(store, n){
    const p = readProf(store);
    p.freezes = Math.min(9, (p.freezes || 0) + (n || 1));
    return writeProf(store, p);
  }

  /* 连击断了：昨天没学，今天也没补 */
  function broken(store){
    const p = readProf(store);
    if (!p.lastDay) return false;
    if (p.lastDay === today()) return false;
    if (p.lastDay === yesterday()) return false;
    if (p.frozen && p.freezeLast === yesterday()) return false;
    return true;
  }

  /* ---------- 近 7 天打卡（日历条） ---------- */
  const WD = ['日','一','二','三','四','五','六'];
  function week(store){
    const p = readProf(store);
    const has = {};
    (p.days || []).forEach(d => { has[d] = true; });
    const out = [];
    for (let i = 6; i >= 0; i--){
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayOf(d);
      out.push({ k: k, wd: WD[d.getDay()], on: !!has[k], today: i === 0 });
    }
    return out;
  }

  /* ---------- 掌握度 ----------
     每张卡独立记录对错。level 决定它要不要回到复习队列：
       0 新卡 / 1 生疏（答错过） / 2 熟悉（对过一次） / 3 掌握（连对两次）
     答错一律掉回 1，不设「一次答错永远留着」——那会让队列永远清不完。 */
  function readMast(store){
    const m = store.get(MAST_KEY, {});
    return m && typeof m === 'object' ? m : {};
  }
  function cardStat(store, id){
    const m = readMast(store);
    return m[id] || { r:0, w:0, level:0, last:'' };
  }
  function markCard(store, id, ok){
    const m = readMast(store);
    const c = m[id] || { r:0, w:0, level:0, last:'' };
    if (ok){
      c.r += 1;
      /* 连对两次 = 掌握；中途错过一次就得重新连对两次（w 只看本轮连对，错一次清零） */
      c.level = c.r >= 2 ? 3 : 2;
    } else {
      c.w += 1;
      c.r = 0;
      c.level = 1;
    }
    c.last = today();
    m[id] = c;
    store.set(MAST_KEY, m);
    return c;
  }
  /* 掌握度的整体数字，给「我的」页显示 */
  function mastery(store, total){
    const m = readMast(store);
    let seen = 0, lv3 = 0, lv1 = 0;
    total = total || 0;
    Object.keys(m).forEach(k => {
      seen++;
      if (m[k].level >= 3) lv3++;
      else if (m[k].level === 1) lv1++;
    });
    return {
      total: total, seen: seen, solid: lv3, weak: lv1,
      pct: total ? Math.round(lv3 / total * 100) : 0
    };
  }

  /* ---------- 积分表 ---------- */
  function levelOf(xp){
    const lv = Math.floor((xp || 0) / SEG_XP) + 1;
    const into = (xp || 0) % SEG_XP;
    return { lv: lv, into: into, need: SEG_XP, pct: Math.round(into / SEG_XP * 100) };
  }

  /* 今天做了什么、各拿了多少经验（首页 hero 下面的小字用） */
  function todayLog(store){
    const p = readProf(store);
    const t = today();
    return (p.log || []).filter(x => x.d === t);
  }
  function todayXp(store){
    return todayLog(store).reduce((a, b) => a + (b.xp || 0), 0);
  }
/* ===== BODY:END ===== */

export {
  XP,
  SEG_XP,
  PROF_KEY,
  MAST_KEY,
  today,
  dayOf,
  dayNum,
  readProf,
  touch,
  addXp,
  activeToday,
  broken,
  week,
  useFreeze,
  grantFreeze,
  readMast,
  cardStat,
  markCard,
  mastery,
  levelOf,
  todayLog,
  todayXp
}
