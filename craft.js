/* ============================================================
   A股交易学院 · 自创流派（第 9 派：把八派拆开重装）
   ------------------------------------------------------------
   设计立场：
     前面八派都是"别人的答案"。但真到了自己的账户，没有人是完全的
     趋势派或完全的价值派——你一定在某些条件下用 A、另一些条件下用 B。
     这不是不纯粹，这是正常状态；不正常的是一边混用、一边不承认。

   所以这里不提供第九种"更好的方法"，只提供一台装配台：
     你把每一条规则从八派里挑出来（或自己写），
     再自己写下"它在什么情况下会失效"。
     最后一步不是保存，是先拿 12 个历史场景通不过。

   三道闸，缺一条就不算流派，只能算"想法"：
     ① 每条规则都得说清出处（借谁的，还是自己加的）
     ② 必须自己指定一条禁止条款
     ③ 12 个历史场景至少过 10 个 —— 尤其是补仓那一条，
        你一定得在动手之前就知道自己会怎么栽。

   刻意不做的事：
     · 不叫"我的策略"之类显得很厉害的名字，草稿就叫草稿
     · 不给打分、不给"你的流派成熟度 87%"这种假精确
     · 不联网、不上传 —— 一切都在你自己的浏览器里
   ============================================================ */
(function(){
  'use strict';
  /* ===== BODY:BEGIN ===== */

  const KEY = 'ta_craft';

  /* 六个槽位。名字用口语，不用术语 —— 想不清"触发条件"的人，
     换成"什么时候可以买"也还是想不清，但至少知道该想什么。 */
  const SLOTS = [
    { k:'entry',  no:'1', name:'什么条件下才买',   hint:'写条件，不写感觉。「看着像要涨」不是条件。',
      wrong:'「感觉要启动了」这类条件，回测时你会自动打勾，实盘时你会自动不打勾' },
    { k:'size',   no:'2', name:'一次买多少',       hint:'说清是占本金的比例，还是固定金额。',
      wrong:'不写数字就等于「看心情」，而看心情的结果永远是满仓' },
    { k:'stop',   no:'3', name:'什么情况下认错',   hint:'价格止损还是逻辑止损，写一个能执行到位的。',
      wrong:'「跌多了再说」不是止损，是把决定权交给情绪' },
    { k:'exit',   no:'4', name:'什么情况下卖出',   hint:'止盈也要有规则，否则涨了拿不住、跌了不肯走。',
      wrong:'只有买入规则没有卖出规则，等于只有油门没有刹车' },
    { k:'forbid', no:'5', name:'我明确不做的事',   hint:'这一条是必填。没有禁区的体系一定有漏洞。',
      wrong:'想不出禁止条款，说明你还没找到自己最容易犯的那个错' },
    { k:'fail',   no:'6', name:'它在什么情况下会失效', hint:'写下来，未来才认得出。',
      wrong:'说不出失效条件的策略，不是策略，是信仰' }
  ];

  /* 五个市场场景。scenario 只是场景名（不映射任何真实日期 / 标的），
     good / bad 是两类动作 —— 答案对错永远按「有没有遵守你自己写的规则」判，
     所以这套题不会过时。 */
  const CHECKS = [
    { k:'chase', name:'主线连续涨停后追高',
      good:'涨太陡、止损位离得太远，这次不符合我的条件，不做',
      bad:'怕错过，先上车再说' },
    { k:'avgdown', name:'亏损后补仓摊低成本',
      good:'不加。这笔已经亏了，补仓只会把风险预算翻倍',
      bad:'跌了就是打折，摊低成本能更快回本' },
    { k:'bigloss', name:'单笔浮亏已经超过计划止损',
      good:'按规则走，不管它之后会不会涨回来',
      bad:'多看两天，反正没卖就不算亏' },
    { k:'bigwin', name:'浮盈超过预期的一倍',
      good:'按卖出规则处理，该减就减、该抬止盈就抬',
      bad:'赚着就先放着，等它自己走不动了再说' },
    { k:'weak', name:'大盘缩量阴跌、没有主线',
      good:'这不是我的场景，空仓等条件恢复',
      bad:'总要找点事做，轻仓也算参与' },
    { k:'news', name:'听到一个"很确定"的消息',
      good:'消息不构成我的买入条件，忽略',
      bad:'小仓位试一下，反正消息挺靠谱' },
    { k:'streak', name:'连续 5 次止损',
      good:'按原规则下第 6 单，说明这套的胜率结构就是这样',
      bad:'说明方法失效了，换个策略' },
    { k:'fomo', name:'身边的人都在赚钱而我没有',
      good:'别人的收益不是我的信号，继续等我的条件',
      bad:'先跟上，回头再研究他为什么赚' },
    { k:'limitup', name:'持仓一字板涨停，第二天可能打开',
      good:'按事先写好的卖出条件处理，不临场发挥',
      bad:'打开才走，一字板说明还有戏' },
    { k:'plan', name:'买入理由被证伪（但股价还没跌）',
      good:'逻辑止损，先出再说',
      bad:'股价还没跌，等跌了再走' },
    { k:'empty', name:'空仓一个月，没有任何机会',
      good:'继续空，空仓也是一种持仓',
      bad:'一个月没交易，手很痒' },
    { k:'copy', name:'看到某个大 V 晒出翻倍收益',
      good:'他晒的是切片，跟我没关系',
      bad:'研究一下他的方法，能不能抄' }
  ];

  /* 兼容八派里已有的禁止条款，点点就能拼进去，不用从零打字 */
  const SEEDS = [
    { k:'longtou',   from:'主线龙头派', t:'退潮期（高标断板、批量跌停）一律空仓' },
    { k:'trend',     from:'趋势跟随派', t:'跌破 20 日线减半，60 日线清仓' },
    { k:'value',     from:'价值集中派', t:'逻辑被证伪就卖，与盈亏无关' },
    { k:'rotation',  from:'行业轮动派', t:'非调仓日一律不动手' },
    { k:'quant',     from:'量化多因子派', t:'不凭主观改模型参数' },
    { k:'dividend',  from:'红利低波派', t:'股息率跌破 2.5% 或分红削减就换' },
    { k:'event',     from:'事件驱动派', t:'事件公告后才买入的一律不做' },
    { k:'contrarian',from:'困境反转派', t:'没有可验证的拐点信号，不左侧建仓' }
  ];

  const EMPTY = { name:'', base:'fuso', draft:{}, checks:{}, at:'' };

  function read(store){
    const v = store.get(KEY, null);
    if(!v || typeof v !== 'object') return JSON.parse(JSON.stringify(EMPTY));
    return {
      name: v.name || '',
      base: v.base || 'fuso',
      draft: v.draft || {},
      checks: v.checks || {},
      at: v.at || ''
    };
  }

  function save(store, c){ store.set(KEY, c); return c; }

  /* 填了几格 */
  function filled(c){
    return SLOTS.filter(s => (c.draft[s.k] || '').trim().length >= 2).length;
  }

  /* 三道闸的门槛。写成常量而不是散落在文案里 ——
     改一个数就不能只改文案不改判断。 */
  const MIN_RULES = 4;     // 至少写几条规则
  const MIN_SCENE = 10;    // 12 个场景里至少答对几个

  /* 三道闸。返回 { pass, gates:[{k,ok,why}] } —— 顺序有意义：
     先有规则，再有禁区，最后才谈检验。 */
  function review(c){
    const n = filled(c);
    const forbidOk = (c.draft.forbid || '').trim().length >= 2;
    const answered = Object.keys(c.checks || {}).length;
    const good = Object.keys(c.checks || {}).filter(k => c.checks[k] === 'good').length;
    const avgdown = c.checks && c.checks.avgdown;
    const gates = [
      { k:'fill', ok: n >= MIN_RULES, why: n >= MIN_RULES ? '规则写了 ' + n + ' 条' : '至少写 ' + MIN_RULES + ' 条规则（现在 ' + n + ' 条）' },
      { k:'forbid', ok: forbidOk, why: forbidOk ? '有明确的禁区' : '第 5 格必须填：你明确不做的事' },
      { k:'test', ok: answered >= MIN_SCENE && good >= MIN_SCENE,
        why: answered < MIN_SCENE ? ('只过了 ' + answered + '/' + CHECKS.length + ' 个场景')
          : (good >= MIN_SCENE ? good + '/' + CHECKS.length + ' 通过' : good + '/' + CHECKS.length + ' 通过，至少要 ' + MIN_SCENE + ' 个') }
    ];
    return { pass: gates.every(g => g.ok), gates: gates, n: n, good: good, answered: answered, avgdown: avgdown };
  }

  /* 名字只做长度与空校验，不给「成熟度分」—— 那是最容易变成自欺的指标 */
  function nameOf(c){
    const s = (c.name || '').trim();
    return s || '未命名草稿';
  }

  /* 给你一个"能不能挂牌"的说法。刻意选词保守：
     通过三闸也只叫「可以挂牌」，不叫「可以实盘」。 */
  function verdict(r){
    if(!r.pass) return '还不能挂牌';
    if(r.avgdown !== 'good') return '可以挂牌，但先想清补仓那条';
    return '可以挂牌';
  }

  const API = {
    KEY: KEY, SLOTS: SLOTS, CHECKS: CHECKS, SEEDS: SEEDS,
    MIN_RULES: MIN_RULES, MIN_SCENE: MIN_SCENE,
    read: read, save: save, filled: filled, review: review,
    nameOf: nameOf, verdict: verdict,
    slot: k => SLOTS.filter(s => s.k === k)[0] || null
  };
  /* ===== BODY:END ===== */

  window.CRAFT = API;
  if(typeof module !== 'undefined' && module.exports) module.exports = API;
})();
