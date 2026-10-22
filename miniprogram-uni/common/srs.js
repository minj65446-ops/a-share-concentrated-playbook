/**
 * 判题引擎 —— 由 Web 端 srs.js 生成，请勿手改
 * ------------------------------------------------------------
 * 一次十题、错题优先、组内均衡、选项洗牌。
 *
 * SESSION = 10 是刻意的：无限刷会刷到麻木，正确率虚高；
 * 十题一组有明确终点，人会更认真对待每一题。
 */

/* ===== BODY:BEGIN ===== */


  const SESSION = 10;                 // 一组十题
  const LETTERS = ['A', 'B', 'C', 'D'];

  /* 洗牌：Fisher-Yates。每次出题都调，所以选项位置不固定。 */
  function shuf(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = (Math.random() * (i + 1)) | 0;
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* 把一张卡变成一道可作答的题：选项洗牌 + 正确答案位置重算 */
  function toQuestion(card, stat){
    const opts = shuf([card.a].concat(card.d));
    const ans = LETTERS[opts.indexOf(card.a)];
    return {
      id: card.id, g: card.g, tag: card.tag,
      q: card.q,
      why: card.why, trap: card.trap,
      opts: opts.map((t, i) => ({ k: LETTERS[i], t: t })),
      ans: ans,
      /* 已经在错题本里的，界面上标一下——让人知道自己是在还债 */
      weak: !!(stat && stat.level === 1)
    };
  }

  /* 组一组题。
     参数：
       list  卡池（CARDS.list）
       stat  id -> 掌握度（learn.cardStat 包装）
       n     组内题数，默认 10
       only  可选，指定只从这些 id 里出（错题模式）
     规则：
       · 「生疏」的卡优先，最多占一半——否则一组全是错题，太挫败；
       · 剩下的按组轮换抽，保证三组都碰到；
       · 抽不满时允许重复（题库比组小的时候），但不连续重复同一张。 */
  function buildSession(list, stat, n, only){
    n = n || SESSION;
    const pool = only && only.length
      ? list.filter(c => only.indexOf(c.id) >= 0)
      : list.slice();
    if (!pool.length) return [];

    const weak = pool.filter(c => (stat(c.id) || {}).level === 1);
    const rest = pool.filter(c => weak.indexOf(c) < 0);

    const picked = [];
    const cap = Math.min(weak.length, Math.ceil(n / 2));
    shuf(weak).slice(0, cap).forEach(c => picked.push(c));

    /* 按组轮换：从配比最少的组里补一张 */
    const cnt = {};
    picked.forEach(c => { cnt[c.g] = (cnt[c.g] || 0) + 1; });
    const groups = [];
    rest.forEach(c => { if (groups.indexOf(c.g) < 0) groups.push(c.g); });
    const bags = {};
    groups.forEach(g => { bags[g] = shuf(rest.filter(c => c.g === g)); });

    while (picked.length < n && groups.length){
      let pick = null, lowest = Infinity;
      groups.forEach(g => {
        const left = bags[g].length;
        const weight = (cnt[g] || 0) + (left ? 0 : 100);      // 用完的组排最后
        if (left && weight < lowest){ lowest = weight; pick = g; }
      });
      if (!pick) break;
      const c = bags[pick].shift();
      if (c){ picked.push(c); cnt[pick] = (cnt[pick] || 0) + 1; }
      else groups.splice(groups.indexOf(pick), 1);
    }

    /* 池子比组小：允许重复，但错开位置，避免连着两张一样 */
    if (picked.length < n){
      let i = 0;
      while (picked.length < n){
        const c = pool[i % pool.length];
        if (picked.length && picked[picked.length - 1].id === c.id && pool.length > 1){
          i++;
          continue;
        }
        picked.push(c);
        i++;
      }
    }

    return picked.slice(0, n).map(c => toQuestion(c, stat(c.id)));
  }

  /* 一批错题（掌握度 level 1）的 id */
  function weakIds(list, stat){
    return list.filter(c => (stat(c.id) || {}).level === 1).map(c => c.id);
  }

  /* 作答结算：只在答对时给分；答错不扣分，但连对归零。
     不扣分是刻意的——学习阶段扣分会让人不敢答，猜反而更安全。 */
  function score(ok, combo){
    return { ok: ok, combo: ok ? combo + 1 : 0, gain: ok ? 1 : 0 };
  }
/* ===== BODY:END ===== */

export {
  SESSION,
  LETTERS,
  shuf,
  toQuestion,
  buildSession,
  weakIds,
  score
}
