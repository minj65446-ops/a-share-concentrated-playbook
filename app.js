/* ============================================================
   A股交易学院 · 交互层
   纯前端，无依赖。数据全部本地（localStorage）。
   ============================================================ */
(function(){
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const store = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const todayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  };

  /* ============================================================
     学习机制（v8）：经验值 / 连击 / 掌握度
     ------------------------------------------------------------
     原则：段位仍然只看真实成果（读完多少、做对多少、复盘几天），
     经验值只负责「本段内的进度感」。所以这里不写任何解锁逻辑，
     升级与否由 rank.js 决定 —— 积分不能买断毕业。
     ============================================================ */
  const L = window.LEARN || null;
  const CARDD = window.CARDS || { list: [], groups: [], byGroup: () => [], size: 0 };
  const CF = window.CRAFT || { SLOTS: [], CHECKS: [], SEEDS: [], read: () => ({ name:'', base:'fuso', draft:{}, checks:{}, at:'' }), save(){}, filled(){ return 0 }, review(){ return { pass:false, gates:[], n:0, good:0, answered:0 } }, nameOf(){ return '未命名草稿' }, verdict(){ return '还不能挂牌' } };
  const JD = window.JUDGE || null;
  const XP = (L && L.XP) || { basic:10, course:30, card:15, kline:15, review:20, quiz:40, death:5, session:50 };

  const statOf = id => (L ? L.cardStat(store, id) : { level: 0, r: 0, w: 0 });
  const weakList = () => (JD && L ? JD.weakIds(CARDD.list, statOf) : []);

  function giveXp(n, why){
    if(!L) return;
    const before = L.readProf(store).xp;
    L.addXp(store, n, why);
    renderHud();
    /* 首次到这一段时给一个动效，不打扰 */
    if(Math.floor(before / L.SEG_XP) !== Math.floor(L.readProf(store).xp / L.SEG_XP)){
      const el = $('#chipXp'); if(el){ el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 520); }
    }
  }

  function renderHud(){
    if(!L) return;
    const p = L.readProf(store);
    const lv = L.levelOf(p.xp);
    if($('#xpTop')) $('#xpTop').textContent = p.xp;
    if($('#streakTop')) $('#streakTop').textContent = Math.max(0, p.streak || 0);
    const cs = $('#chipStreak');
    if(cs){
      cs.title = p.streak ? ('连续学习 ' + p.streak + ' 天') : '还没开始打卡';
      cs.style.opacity = p.streak ? '1' : '.55';
    }
    const cx = $('#chipXp');
    if(cx) cx.title = '本段经验 ' + lv.into + ' / ' + lv.need;
  }

  /* ---------- 主题 ---------- */
  const TH = window.THEMES || { list: [], DEFAULT: 'light', valid(){ return false }, nameOf(){ return '' }, apply(){ return 'light' } };
  /* 主题来源优先级：URL ?theme= > 本地存储 > 默认。URL 命中后立刻抹掉参数，
     否则用户在应用里换主题后一刷新又会被参数拉回去 */
  let themeKey = (function(){
    let k = store.get(TH.KEY, TH.DEFAULT);
    try{
      const m = /[?&]theme=([A-Za-z]+)/.exec(location.search || '');
      if(m && TH.valid(m[1])){
        k = m[1];
        if(history && history.replaceState) history.replaceState(null, '', location.pathname + location.hash);
      }
    }catch(e){}
    return k;
  })();
  themeKey = TH.apply(themeKey);
  store.set(TH.KEY, themeKey);

  /* theme.js 万一没加载时的画布兜底色（= 晨光蓝），保证 K 线不白屏 */
  const CC0 = { grid:'#f0f2f5', bg:'#fafbfc', up:'#d94a45', down:'#17855f',
    volUp:'rgba(217,74,69,.32)', volDown:'rgba(23,133,95,.32)',
    ma5:'rgba(32,69,110,.55)', ma20:'rgba(176,124,23,.55)',
    axis:'rgba(15,26,38,.35)', mark:'rgba(32,69,110,.35)', markDone:'rgba(15,26,38,.22)',
    lab:'#20456e', labInk:'#ffffff' };
  const cvs = () => (TH.canvas ? TH.canvas(themeKey) : CC0);

  function setTheme(k){
    if(!TH.valid(k)) return;
    themeKey = TH.apply(k);
    store.set(TH.KEY, k);
    renderThemes();
    if($('#v-train') && $('#v-train').classList.contains('on')) drawK();
  }

  function renderThemes(){
    const box = $('#themeList');
    if(!box) return;
    box.innerHTML = TH.list.map(t =>
      `<button class="tcard t-${t.k}${t.k === themeKey ? ' on' : ''}" data-t="${t.k}">
         <span class="ck">✓</span>
         <span class="pv">
           <span class="row1"><span class="dot"></span><span class="nm">${t.name}</span></span>
           <span class="ln hi" style="display:block"></span>
           <span class="ln m" style="display:block"></span>
           <span class="ln s" style="display:block"></span>
           <span class="tag">${t.k === TH.DEFAULT ? '默认' : 'Aa'}</span>
         </span>
         <span class="foot">${t.desc}</span>
       </button>`
    ).join('');
    Array.from(box.querySelectorAll('.tcard')).forEach(el => {
      el.addEventListener('click', () => setTheme(el.dataset.t));
    });
    const nm = $('#themeName');
    if(nm) nm.textContent = TH.nameOf(themeKey);
  }

  /* ================= 课程数据 ================= */
  const COURSES = [
    { id:'01', title:'核心 + 卫星：先活下来', sub:'60% 底仓 + 30% 进攻，把择时的压力关进 30% 里',
      level:'入门', min:12, risk:'低–中',
      why:'新手最常见的死法是「全仓一只，然后在最差的位置被迫卖出」。核心卫星不是收益最高的结构，但它是最容易活到下一轮的结构——因为核心仓位不参与你的判断，只参与市场。',
      points:['核心：宽基 ETF 或连续 5 年分红、股息率 > 3% 的蓝筹，1–2 只，一次性或定投建满','卫星：只放自己真正懂的行业，2–4 只，单一不超过总资金 20%','卫星必须能写出「三年后利润大概多少」，写不出来就不进卫星'],
      bad:'把核心也拿去做热点轮动。底仓一旦开始折腾，它就不再是底仓，你也就失去了唯一稳定的锚。',
      link:'playbook.html#playbook' },

    { id:'02', title:'仓位公式：先算亏多少', sub:'仓位 = 总资金 × 2% ÷ 止损幅度',
      level:'入门', min:8, risk:'低',
      why:'多数人先决定买多少，再想止损在哪。顺序反了。正确的顺序是：先找止损位，算出这笔最多能亏多少钱，再反推股数。这样无论你多看好，单笔亏损都被锁在 2% 以内。',
      points:['单笔风险预算：总资金的 1%–2%，不是「感觉能扛」','止损越宽，仓位必须越小，两者是替代关系','算出仓位后还要过一道硬顶：单票 ≤ 25%（小资金）'],
      bad:'「这次特别有把握」而放大仓位。把握是主观的，回撤是客观的，账户只认后者。',
      link:'playbook.html#calc' },

    { id:'03', title:'止损三锚：先写死离场', sub:'技术位 / 波动率 / 固定比例，选最靠得住的那个',
      level:'入门', min:10, risk:'中',
      why:'止损不是「亏了 8% 就卖」这么简单，它决定了你的仓位、你的盈亏比、以及你能不能拿住盈利单。定止损的本质，是提前承认自己可能看错。',
      points:['技术位：前 20 日最低价下方、箱体下沿、颈线——破了说明判断被证伪','波动率：2 倍 ATR，给正常波动留出空间，避免被噪音扫掉','固定比例 −5% 至 −8%：简单，但和个股波动无关，只适合快进快出'],
      bad:'盘中临时把止损位往下挪。改一次，这套系统就作废了——因为你已经证明自己会在关键时刻违约。',
      link:'playbook.html#exec' },

    { id:'04', title:'趋势跟随：只买上升的', sub:'不预测方向，只跟随；胜率 40% 靠盈亏比赚钱',
      level:'进阶', min:15, risk:'中–高',
      why:'趋势策略的全部收益来自少数几笔大盈利，其余都是小亏。它的心理难点不是技术，是接受「连续亏 5 次仍然按规则下第 6 单」。',
      points:['入场：创 250 日新高，或站上 20/60/120 日均线且多头排列','加仓：只在盈利头寸上加，回踩不破再补','离场：跌破 20 日线减半，跌破 60 日线清仓'],
      bad:'在震荡市里怀疑策略、频繁改参数。震荡市的连续止损是策略成本，改参数只会把成本变成亏损。',
      link:'playbook.html#playbook' },

    { id:'05', title:'行业轮动：先选赛道', sub:'A股的行业收益差异，远大于个股差异',
      level:'进阶', min:15, risk:'中–高',
      why:'在全市场 5000 只股票里选，胜率极低；先在 31 个行业里选出 1–2 个正在赚钱的行业，再在行业里选前三，难度降一个量级。集中度加在行业上，而不是单票上。',
      points:['行业筛选：近 6–12 个月涨幅前 20%，且近 3 个月成交额环比抬升','个股：行业内市值前 3 或市占率前 3，剔除 ST、次新、日均成交 < 2 亿','纪律：月末统一调仓，非调仓日不做任何调整'],
      bad:'把「主题概念」当「行业景气」。概念没有业绩验证，走完就散，来不及跑。',
      link:'playbook.html#playbook' },

    { id:'06', title:'龙头聚焦：只做最强的一只', sub:'龙空龙：有龙重仓，无龙空仓',
      level:'高风险', min:20, risk:'极高',
      why:'这是全部八套里最锋利也最伤人的一套。它用「时间上的分散」（大部分时间空仓）替代「持仓上的分散」，回撤控制完全依赖空仓纪律。网络教学普遍只教「重仓买龙头」，不教「退潮空仓」——这才是亏损主因。',
      points:['先定主线：板块涨停 ≥ 5 家、有政策或产业逻辑、梯队完整','再定龙头：连板最高、最先上板、分时最主动，具备唯一性','只做 1 只；退潮信号出现（跌停家数上升、高标断板）立即空仓'],
      bad:'只学了「重仓」，没学「空仓」。在下跌周期里反复止损，一次回撤抹掉三个月利润。',
      link:'playbook.html#playbook' },

    { id:'07', title:'红利底仓：用现金流睡觉', sub:'股息 + 估值回归，赚不刺激但能拿住的钱',
      level:'入门', min:10, risk:'低–中',
      why:'这类策略的价值不在收益，在「拿得住」。有分红现金流、有 3.5% 以上股息率托底，你才不会被 20% 的波动逼下车。震荡市里它负责让你活着，牛市里它负责让你安心。',
      points:['股息率 > 3.5%，连续 5 年分红未中断','股利支付率 30%–70%，经营现金流 / 净利润 > 1','5–8 只，跨 3 个以上行业，避免全押同一个周期'],
      bad:'只看到高股息，没看到股息率高是因为股价在跌——股息率陷阱。分红被削减时，必须清仓，那不是波动。',
      link:'playbook.html#playbook' },

    { id:'08', title:'事件驱动：赌确定的事', sub:'2–3 只，事件兑现即走，赔率 ≥ 2:1',
      level:'高风险', min:15, risk:'高',
      why:'事件驱动的关键不是「事件好不好」，而是「市场预期在哪、赔率够不够」。必须在事前算清兑现与落空两个方向的空间，并且提前定好退出时点。',
      points:['事件必须可验证、有明确时间窗口（财报日、政策生效日）','事前估算赔率 ≥ 2:1，否则不做','同时持有不超过 3 只，且事件类型不重复'],
      bad:'事件已经公告后才买入——你赚的不是信息差，是别人的出货量。落空后改成「长期看好」，是小亏变大亏的标准路径。',
      link:'playbook.html#playbook' }
  ];

  /* ================= 路由 ================= */
  const VIEWS = ['learn', 'train', 'map', 'teacher', 'craft', 'me'];

  function go(v){
    if(VIEWS.indexOf(v) < 0) v = 'learn';
    $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
    $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    window.scrollTo(0, 0);
    store.set('ta_tab', v);
    if(v === 'train'){ setTimeout(drawK, 30); renderPane(); }
    if(v === 'me') renderMe();
    if(v === 'teacher') renderTeachers();
    if(v === 'craft') renderCraft();
    if(v === 'learn'){ renderRank(); renderBasics(); renderDeaths(); renderQuizCard(); renderToday(); renderDeck(); }
  }
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    go(b.dataset.v);
  });
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  $$('[data-scroll]').forEach(b => b.addEventListener('click', () => {
    go('train');
    setTimeout(() => {
      const t = $('#' + b.dataset.scroll);
      if(t) t.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 60);
  }));

  /* ================= 学院 ================= */
  const done = () => store.get('ta_done', []);

  function renderCourses(){
    const d = done();
    $('#courseList').innerHTML = COURSES.map(c => {
      const p = d.includes(c.id) ? 100 : 0;
      return `<div class="course" data-c="${c.id}" role="button" tabindex="0">
        <div class="no">${c.no || c.id}</div>
        <div>
          <h3>${c.title}</h3>
          <div class="sub">${c.sub}</div>
          <div class="meta">
            <span class="pill">${c.level}</span>
            <span class="pill">${c.min} 分钟</span>
            <span class="pill ${c.risk.includes('高') ? 'up' : 'down'}">风险 ${c.risk}</span>
          </div>
        </div>
        <div class="ring" style="--p:${p}"><span>${p ? '✓' : ''}</span></div>
      </div>`;
    }).join('');
    $('#progressText').textContent = d.length + ' / ' + COURSES.length + ' 完成';
  }

  $('#courseList').addEventListener('click', e => {
    const b = e.target.closest('.course'); if(!b) return;
    openCourse(b.dataset.c);
  });

  function openCourse(id){
    const c = COURSES.find(x => x.id === id);
    if(!c) return;
    const isDone = done().includes(id);
    $('#sheetBody').innerHTML = `
      <h2>${c.title}</h2>
      <div class="lead">${c.sub}</div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <span class="pill">${c.level}</span><span class="pill">${c.min} 分钟</span>
        <span class="pill ${c.risk.includes('高') ? 'up' : 'down'}">风险 ${c.risk}</span>
      </div>
      <div class="block"><h4>为什么</h4><div style="font-size:12.5px;line-height:1.75;color:var(--ink-2)">${c.why}</div></div>
      <div class="block"><h4>三个要点</h4><ul>${c.points.map(p => `<li>${p}</li>`).join('')}</ul></div>
      <div class="warnbox"><b>常见死法：</b>${c.bad}</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary btn-block" id="markDone" style="background:var(--brand);color:#fff;border-color:var(--brand)">
          ${isDone ? '已完成 · 再练一次' : '标记完成'}
        </button>
        <button class="btn btn-block" id="goDoc">看完整规则</button>
      </div>`;
    $('#markDone').addEventListener('click', () => {
      const d = done();
      if(!d.includes(id)){ d.push(id); store.set('ta_done', d); giveXp(XP.course, '完成课程'); }
      renderCourses(); renderMe(); renderRank(); renderToday(); closeSheet();
      setTimeout(() => go('train'), 220);
    });
    $('#goDoc').addEventListener('click', () => { location.href = c.link; });
    openSheet();
  }

  /* ================= 抽屉 ================= */
  function openSheet(){ $('#mask').classList.add('on'); $('#sheet').classList.add('on'); }
  function closeSheet(){ $('#mask').classList.remove('on'); $('#sheet').classList.remove('on'); }
  $('#mask').addEventListener('click', closeSheet);


  /* ================= K线绘制 ================= */
  let curCase = null, curIdx = 0, answered = false;
  const kb = () => store.get('ta_kline', { total:0, right:0, streak:0, best:0 });
  /* 答题卡的累计成绩，单独一份账，不和 K 线混。
     两组题目的难度和含义完全不同，混在一起算正确率没有参考价值。 */
  const cb = () => store.get('ta_cardstat', { total:0, right:0, combo:0, bestCombo:0, sessions:0 });
  const cardTotal = () => cb();

  function drawK(){ const CC = cvs();

    const cv = $('#kcanvas'); if(!cv || !curCase) return;
    const w = cv.clientWidth || 320, h = 210, dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const bars = curCase.bars, n = bars.length;
    const padL = 6, padR = 6, padT = 14, volH = 30;
    const chartH = h - padT - volH - 16;
    const iw = (w - padL - padR) / n;
    const bw = Math.max(1.6, iw * 0.62);

    let hi = -Infinity, lo = Infinity;
    bars.forEach(b => { if(b.h > hi) hi = b.h; if(b.l < lo) lo = b.l; });
    const pad = (hi - lo) * 0.08 || 0.5;
    hi += pad; lo -= pad;
    const Y = v => padT + (hi - v) / (hi - lo) * chartH;
    const X = i => padL + iw * i + iw / 2;

    // 网格
    ctx.strokeStyle = CC.grid; ctx.lineWidth = 1;
    for(let i=0;i<=3;i++){
      const y = padT + chartH / 3 * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    }

    // 成交量
    let vmax = 0; bars.forEach(b => { if(b.v > vmax) vmax = b.v; });
    const vTop = h - 10 - volH;
    bars.forEach((b,i) => {
      const bh = Math.max(1, b.v / vmax * volH);
      ctx.fillStyle = b.c >= b.o ? CC.volUp : CC.volDown;
      ctx.fillRect(X(i) - bw/2, h - 10 - bh, bw, bh);
    });

    // K线
    bars.forEach((b,i) => {
      const up = b.c >= b.o;
      const col = up ? CC.up : CC.down;
      const x = X(i);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, Y(b.h)); ctx.lineTo(x, Y(b.l)); ctx.stroke();
      const y1 = Y(Math.max(b.o, b.c)), y2 = Y(Math.min(b.o, b.c));
      ctx.fillStyle = up ? col : col;
      ctx.fillRect(x - bw/2, y1, bw, Math.max(1.4, y2 - y1));
    });

    // MA5 / MA20
    const ma = (k, color) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.4;
      let started = false;
      for(let i=k-1;i<n;i++){
        let s = 0; for(let j=i-k+1;j<=i;j++) s += bars[j].c;
        const y = Y(s/k), x = X(i);
        if(!started){ ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    ma(5, CC.ma5);
    ma(20, CC.ma20);

    // 颈线
    if(curCase.neck){
      ctx.setLineDash([3,3]); ctx.strokeStyle = CC.axis; ctx.lineWidth = 1;
      const y = Y(curCase.neck);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 标记
    curCase.marks.forEach(m => {
      const x = X(m.i);
      ctx.setLineDash([3,3]);
      ctx.strokeStyle = answered ? CC.markDone : CC.mark;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - 10); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = CC.lab;
      ctx.beginPath(); ctx.arc(x, padT - 2, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = CC.labInk; ctx.font = '700 10px ui-monospace,monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.label, x, padT - 1);
    });
  }

  function renderQ(){
    /* 题库在 cases.js：每次出题换一套随机路径 + 选项洗牌，同题型不会重复出现同一张图 */
    const QB = window.CASES;
    curCase = QB ? QB.build(curIdx) : null;
    if(!curCase) return;
    answered = false;

    $('#qTitle').textContent = curCase.title;
    $('#qText').textContent = curCase.q;
    const s = kb();
    $('#qStreak').textContent = '连对 ' + s.streak + ' · 题库 ' + curCase.total + ' 题';

    $('#opts').innerHTML = curCase.opts.map(o =>
      `<button class="opt" data-k="${o.k}"><span class="k">${o.k}</span><span>${o.t.replace(/^[A-G]：/, '')}</span></button>`
    ).join('');
    $('#explain').classList.remove('show');
    $('#explain').innerHTML = '';
    drawK();
  }

  $('#opts').addEventListener('click', e => {
    const b = e.target.closest('.opt'); if(!b || answered) return;
    answered = true;
    const pick = b.dataset.k, ok = pick === curCase.ans;
    $$('#opts .opt').forEach(x => {
      if(x.dataset.k === curCase.ans) x.classList.add('right');
      else if(x.dataset.k === pick) x.classList.add('wrong');
    });
    const s = kb();
    s.total++; if(ok){ s.right++; s.streak++; s.best = Math.max(s.best, s.streak); } else { s.streak = 0; }
    store.set('ta_kline', s);
    $('#qStreak').textContent = '连对 ' + s.streak;
    updateAcc();
    markToday('k');
    if(ok) giveXp(XP.kline, '读懂 K 线');

    const ex = $('#explain');
    ex.innerHTML = '<b>' + (ok ? '对。' : '不对，正确答案是 ' + curCase.ans + '。') + '</b> ' + curCase.why;
    ex.classList.add('show');
    renderMe();
  });

  $('#btnNextQ').addEventListener('click', () => { curIdx++; renderQ(); renderPane(); });
  $('#btnWhyOpen').addEventListener('click', () => {
    if(answered) return;
    answered = true;
    $$('#opts .opt').forEach(x => { if(x.dataset.k === curCase.ans) x.classList.add('right'); });
    const ex = $('#explain');
    ex.innerHTML = '<b>解析：</b>' + curCase.why;
    ex.classList.add('show');
  });

  function updateAcc(){
    const s = kb(), c = cb();
    const tot = (s.total || 0) + (c.total || 0);
    const rgt = (s.right || 0) + (c.right || 0);
    $('#accText').textContent = tot
      ? '正确率 ' + Math.round(rgt / tot * 100) + '%（' + rgt + '/' + tot + '）'
      : '正确率 —';
  }

  // 画布点击：点标记附近即视为选择
  $('#kcanvas').addEventListener('click', e => {
    if(!curCase || answered) return;
    const cv = e.currentTarget, rect = cv.getBoundingClientRect();
    const w = rect.width, padL = 6, padR = 6, n = curCase.bars.length;
    const iw = (w - padL - padR) / n;
    const idx = (e.clientX - rect.left - padL) / iw;
    let best = null, bd = 99;
    curCase.marks.forEach(m => { const d = Math.abs(m.i - idx); if(d < bd){ bd = d; best = m; } });
    if(best && bd < 3){
      const btn = document.querySelector('#opts .opt[data-k="' + best.label + '"]');
      if(btn) btn.click();
    }
  });

  /* ============================================================
     答题卡：一次十题
     ------------------------------------------------------------
     状态不落盘（关掉就重来），但成绩和掌握度落盘。
     理由：半场休息再回来，人已经忘了自己在第几题，
     不如重开一组——一组才三分钟。

     mode: 'idle' 未开始 / 'run' 答题中 / 'end' 结算
     ============================================================ */
  const QZ = { mode:'idle', qs:[], i:0, combo:0, right:0, pick:'', done:false, weakOnly:false };

  function startQuizCards(weakOnly){
    const weak = weakList();
    if(weakOnly && !weak.length){
      toast('还没有错题。先去答一组，答错的会自己回来。');
      return;
    }
    if(!JD || !CARDD.size){ toast('题库没加载'); return; }
    QZ.qs = JD.buildSession(CARDD.list, statOf, JD.SESSION, weakOnly ? weak : null);
    QZ.mode = 'run'; QZ.i = 0; QZ.combo = 0; QZ.right = 0; QZ.pick = ''; QZ.done = false;
    QZ.weakOnly = !!weakOnly;
    renderPane();
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('on'), 20);
    setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 260); }, 2100);
  }

  function renderPane(){
    const box = $('#qzBody'); if(!box) return;
    const c = cb();
    const lv = L ? L.levelOf(L.readProf(store).xp) : { lv:1, into:0, need:200, pct:0 };
    const weak = weakList().length;
    const solid = L ? L.mastery(store, CARDD.size).solid : 0;

    /* 顶部数字：答题中显示本组连对，其它时候显示累计最高连对 */
    $('#qzCombo').textContent = QZ.mode === 'run' ? QZ.combo : (c.bestCombo || 0);
    $('#qzCombo').className = 'qzn' + ((QZ.mode === 'run' ? QZ.combo : c.bestCombo) >= 3 ? ' hot' : '');
    /* 只显示一个短标签，前缀「每日一组 · 」在 HTML 里已经写死了 */
    $('#qzMode').textContent = QZ.mode === 'run'
      ? (QZ.weakOnly ? '错题重练' : '第 ' + (QZ.i + 1) + '/' + QZ.qs.length + ' 题')
      : (QZ.mode === 'end' ? '本组结束' : (weak ? '错题 ' + weak + ' 张' : '准备'));
    $('#qzProg').style.width = (QZ.mode === 'run' ? Math.round(QZ.i / QZ.qs.length * 100) : (QZ.mode === 'end' ? 100 : 0)) + '%';

    $('#qzTitle').textContent = QZ.mode === 'run'
      ? (QZ.qs[QZ.i] ? (QZ.i + 1) + '. ' + (QZ.qs[QZ.i].tag || '概念') : '')
      : (QZ.mode === 'end' ? '一组做完' : '概念卡 · 一次十题');

    if(QZ.mode === 'idle'){
      box.innerHTML = `
        <div class="qzempty">
          <div class="big">${CARDD.size} 张概念卡</div>
          <div class="sm">
            一次十题，三分钟。答错的卡会自己回到复习队列 ——
            比「再读一遍」有用，因为你是被问住过才知道没记住。
          </div>
          <div class="qzstat">
            <div class="s"><div class="v">${solid}</div><div class="k">已掌握</div></div>
            <div class="s"><div class="v">${weak}</div><div class="k">待复习</div></div>
            <div class="s"><div class="v">+${(lv.pct ? lv.into : 0)}</div><div class="k">本段 XP</div></div>
          </div>
          <div class="deckrow" style="margin-top:14px">
            <button class="btn btn-sm" id="qzStart">${weak ? '继续复习（' + weak + ' 张错题）' : '开始一组'}</button>
            ${weak ? '<button class="btn btn-sm" id="qzFresh">答新题</button>' : ''}
          </div>
        </div>`;
      $('#qzStart').addEventListener('click', () => startQuizCards(!!weak));
      const f = $('#qzFresh'); if(f) f.addEventListener('click', () => startQuizCards(false));
      return;
    }

    if(QZ.mode === 'end'){
      const n = QZ.qs.length;
      const pct = n ? Math.round(QZ.right / n * 100) : 0;
      const weakNow = weakList().length;
      box.innerHTML = `
        <div class="qzempty">
          <div class="big">${QZ.right} / ${n}</div>
          <div class="sm">${pct >= 80 ? '这一组稳。别急着加量，明天再来一组就行。'
            : pct >= 50 ? '过半了。答错的几张已经回到复习队列，下次会先问你那几张。'
            : '这一组偏难。没关系——被问住才记得住，回去看一眼再来。'}</div>
          <div class="qzstat">
            <div class="s"><div class="v">${pct}%</div><div class="k">本组正确率</div></div>
            <div class="s"><div class="v">${QZ.combo}</div><div class="k">本组最高连对</div></div>
            <div class="s"><div class="v">${weakNow}</div><div class="k">待复习</div></div>
          </div>
          <div class="deckrow" style="margin-top:14px">
            <button class="btn btn-sm" id="qzAgain">再来一组</button>
            <button class="btn btn-sm" id="qzGoWeak">${weakNow ? '只练错题（' + weakNow + '）' : '没有错题'}</button>
          </div>
        </div>`;
      $('#qzAgain').addEventListener('click', () => startQuizCards(false));
      const gw = $('#qzGoWeak');
      if(gw) gw.addEventListener('click', () => startQuizCards(true));
      return;
    }

    /* ---- 答题中 ---- */
    const q = QZ.qs[QZ.i];
    if(!q){ QZ.mode = 'end'; renderPane(); return; }
    box.innerHTML = `
      <div class="card-q">
        <div class="tagrow">
          <span class="pill brand">${q.g}</span>
          <span class="pill">${q.tag}</span>
          ${q.weak ? '<span class="pill up">在错题本里</span>' : ''}
        </div>
        <div class="qtext">${q.q}</div>
      </div>
      ${q.opts.map(o => `<button class="copt" data-k="${o.k}" ${QZ.done ? 'disabled' : ''}>
        <span class="k">${o.k}</span><span>${o.t}</span></button>`).join('')}
      <div id="qfb"></div>
      <div class="qznav">
        <button class="btn btn-sm" id="qzNext">${QZ.i === QZ.qs.length - 1 ? '看本组结算' : '下一题'}</button>
        <button class="btn btn-sm" id="qzQuit">退出</button>
      </div>`;

    if(QZ.done) paintAnswered();

    Array.from(box.querySelectorAll('.copt')).forEach(b => {
      b.addEventListener('click', () => answerCard(b.dataset.k));
    });
    $('#qzNext').addEventListener('click', () => {
      if(!QZ.done){ toast('先选一个再往下'); return; }
      if(QZ.i === QZ.qs.length - 1){ finishQuiz(); return; }
      QZ.i++; QZ.done = false; QZ.pick = '';
      renderPane();
    });
    $('#qzQuit').addEventListener('click', () => {
      QZ.mode = 'idle'; QZ.qs = []; renderPane();
    });
  }

  function answerCard(k){
    if(QZ.done) return;
    const q = QZ.qs[QZ.i]; if(!q) return;
    QZ.done = true; QZ.pick = k;
    const ok = k === q.ans;

    /* 掌握度：答错掉回生疏，连对两次算掌握 */
    if(L) L.markCard(store, q.id, ok);

    const c = cb();
    c.total++; if(ok) c.right++;
    c.combo = ok ? (c.combo || 0) + 1 : 0;
    c.bestCombo = Math.max(c.bestCombo || 0, c.combo);
    store.set('ta_cardstat', c);

    QZ.combo = c.combo;
    QZ.right += ok ? 1 : 0;

    if(ok) giveXp(XP.card, '答对概念卡');
    else L && L.touch(store);
    markToday('c');

    $('#qzCombo').textContent = QZ.combo;
    $('#qzCombo').className = 'qzn' + (QZ.combo >= 3 ? ' hot' : '');
    paintAnswered();
    updateAcc();
    renderHud();
    renderToday();
  }

  function paintAnswered(){
    const q = QZ.qs[QZ.i]; if(!q) return;
    Array.from(document.querySelectorAll('#qzBody .copt')).forEach(b => {
      b.disabled = true;
      const k = b.dataset.k;
      b.classList.remove('right', 'wrong');
      if(k === q.ans) b.classList.add('right');
      else if(k === QZ.pick) b.classList.add('wrong');
    });
    const ok = QZ.pick === q.ans;
    const fb = $('#qfb');
    if(!fb) return;
    fb.innerHTML = `
      <div class="cfb ${ok ? 'ok' : 'no'}">
        <div class="hd">
          ${ok ? '✓ 对' : '✗ 不对，正确是 ' + q.ans}
          ${ok ? `<span class="gain">+${XP.card} XP</span>` : ''}
        </div>
        <div class="bd">
          ${ok ? '' : '<b>正确答案：</b>' + q.opts.find(o => o.k === q.ans).t + '<br><br>'}
          ${q.why}
          <div class="trap"><b>容易记反：</b>${q.trap}</div>
        </div>
      </div>`;
  }

  function finishQuiz(){
    const c = cb();
    c.sessions = (c.sessions || 0) + 1;
    store.set('ta_cardstat', c);
    /* 清完一组给一次奖励：这是「完成」而不是「坚持」的奖励 */
    giveXp(XP.session, '清完一组');
    QZ.mode = 'end';
    renderPane();
    renderMe();
    renderRank();
    renderToday();
  }


  /* ================= 情绪周期 ================= */
  const STAGES = [
    { name:'冰点', pos:'0–20%', pct:12,
      desc:'跌停家数最多，连板高度归零，交易群没人说话。这个阶段唯一要做的是活着。',
      do:['空仓，或极轻仓试错','观察谁在逆势抗跌','把股票池删到 10 只以内'],
      dont:['抄「跌了很多」的票','重仓博反弹','频繁换股找机会'] },
    { name:'启动', pos:'20–40%', pct:30,
      desc:'新题材开始出现，首板数量回升，但持续性还没验证。轻仓试错，只做最强的那个方向。',
      do:['小仓位试错，只做首板或 1 进 2','记录哪些方向有资金反复做','严格止损，错了立刻换'],
      dont:['一次就重仓','同时试三个方向','把试探仓当底仓拿'] },
    { name:'发酵', pos:'60–80%', pct:72,
      desc:'主线明确，板块内涨停家数扩散，梯队完整。这是全年最该重仓的阶段，也是最少出现的阶段。',
      do:['仓位提到 6–8 成，聚焦主线','只在盈利头寸上加仓','跟随 5 日线或 10 日线持有'],
      dont:['这时候才刚开始研究','分散到杂毛股','提前「落袋为安」'] },
    { name:'退潮', pos:'0–10%', pct:8,
      desc:'高标断板、批量跌停、赚钱效应消失。这个阶段的正确操作是空仓，而不是「找个跌得少的」。',
      do:['清仓，不做任何反抽','复盘这一轮赚在哪、亏在哪','等下一个冰点'],
      dont:['逆势做龙头二波','补仓摊低成本','相信「这次不一样」'] }
  ];

  function renderStage(i){
    const s = STAGES[i];
    $('#cycleCard').innerHTML = `
      <div class="stage"><h3>${s.name}</h3><div class="pos">${s.pos}</div></div>
      <div class="desc">${s.desc}</div>
      <div class="bar"><i style="width:${s.pct}%"></i></div>
      <div class="split">
        <div class="box do"><b>该做</b><ul>${s.do.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div class="box dont"><b>不该做</b><ul>${s.dont.map(x => `<li>${x}</li>`).join('')}</ul></div>
      </div>`;
  }
  $('#stageSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    $$('#stageSeg button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    renderStage(+b.dataset.s);
  });

  const MATRIX = [
    { q:'趋势市 · 行业分化', items:[['主策略','趋势动量 / 行业集中'],['持仓','3–5 只'],['行业数','1–2 个'],['单票上限','25%'],['止损','−8% 或 2ATR'],['换手','3–6 倍/年']] },
    { q:'震荡市 · 无主线', items:[['主策略','核心卫星 / 红利'],['持仓','5–8 只'],['行业数','3 个以上'],['单票上限','20%'],['止损','逻辑止损优先'],['总仓位','30%–50%']] },
    { q:'下跌市 · 退潮', items:[['主策略','空仓 / 极轻仓'],['持仓','0–1 只'],['总仓位','0%–20%'],['单票上限','10%'],['止损','不适用'],['动作','等待冰点']] },
    { q:'底部区 · 景气反转', items:[['主策略','困境反转 / 红利'],['持仓','3–5 只'],['行业数','2 个以上'],['单票上限','20%'],['止损','−20% 复核'],['建仓','左侧分三笔']] }
  ];
  $('#matrixRow').innerHTML = MATRIX.map(m => `
    <div class="mx">
      <div class="qt">${m.q}</div>
      <h4>${m.items[0][1]}</h4>
      ${m.items.slice(1).map(x => `<div class="item"><span>${x[0]}</span><span>${x[1]}</span></div>`).join('')}
    </div>`).join('');

  /* ============================================================
     段位体系
     ============================================================ */
  const R = window.RANKS || null;
  const B = window.BASICS || { list:[], groups:[] };
  const Q = window.QUIZ || null;
  const D = window.DEATHS || { list:[], groups:[] };

  const basicsDone = () => store.get('ta_basics', []);

  function renderRank(){
    if(!R || !$('#rankCard')) return;
    const c = R.current(store);

    $('#rankCard').innerHTML = `
      <div class="top">
        <div style="min-width:0">
          <span class="lv">${c.allDone ? '已满级' : ('LV ' + (c.idx + 1) + ' / 5')}</span>
          <div class="nm">${c.rank.name}${c.allDone ? ' · 通关' : ''}</div>
          <div class="en">${c.rank.en}</div>
          <div class="sub">${c.rank.sub}</div>
        </div>
        <div class="pct">${c.allDone ? '100%' : c.pct + '%'}<span>本段进度</span></div>
      </div>
      <div class="rankbar"><i style="width:${c.allDone ? 100 : c.pct}%"></i></div>
      <div class="goal">${c.rank.goal}</div>
      <div class="after"><b>毕业后：</b>${c.rank.after}</div>`;

    $('#rankList').innerHTML = c.list.map((x, i) => {
      const g = x.g;
      const pct = g.total ? Math.round(g.cur / g.total * 100) : 0;
      return `<div class="rk ${x.passed ? 'passed' : ''} ${x.active ? 'active' : ''}" data-r="${i}">
        <div class="badge">${x.passed ? '✓' : x.r.id}</div>
        <div class="body">
          <div class="t">${x.r.name}<span style="font-size:10.5px;color:var(--muted);font-weight:600;margin-left:6px">${x.r.en}</span></div>
          <div class="s">${x.r.need}</div>
          <div class="mini"><i style="width:${pct}%"></i></div>
        </div>
        <div class="chev">›</div>
      </div>`;
    }).join('');
  }

  $('#rankList').addEventListener('click', e => {
    const b = e.target.closest('.rk'); if(!b || !R) return;
    const r = R.list[+b.dataset.r];
    const g = r.check(R.readState(store));
    let det = '';
    if (g.detail) {
      det = '<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">' +
        g.detail.map(d =>
          `<div style="display:flex;gap:8px;font-size:12px;align-items:flex-start;color:${d.on ? 'var(--down)' : 'var(--ink-2)'}">
            <span style="font-family:var(--mono);font-weight:700">${d.on ? '✓' : '○'}</span><span>${d.t}</span>
          </div>`).join('') + '</div>';
    } else {
      det = `<div style="margin-top:12px;font-size:12px;color:var(--ink-2)">
        当前 ${g.cur} / ${g.total} ${g.unit}</div>`;
    }
    $('#sheetBody').innerHTML = `
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
        <span class="pill brand">${r.id}</span><span class="pill">${r.en}</span>
      </div>
      <h2>${r.name}</h2>
      <div class="lead" style="margin-top:6px">${r.sub}</div>
      <div class="block"><h4>这一阶段解决什么</h4>
        <div style="font-size:12.5px;line-height:1.75;color:var(--ink-2)">${r.goal}</div></div>
      <div class="block"><h4>毕业标准 · ${g.cur}/${g.total}</h4>${det}</div>
      <div class="warnbox"><b>毕业后：</b>${r.after}</div>`;
    openSheet();
  });

  /* ============================================================
     Lv1 启蒙
     ============================================================ */
  /* ============================================================
     Lv1 启蒙
     ------------------------------------------------------------
     25 条平铺像一堵墙。v8 拆成「分组筛选 + 单组进度」：
     一次只看一组（通常 3–5 条），清完一组再换下一组。
     分组顺序就是认知依赖顺序，所以「下一组」按钮直接推下一组。
     ============================================================ */
  let basicsGrp = null;   // null = 全部

  function renderBasics(){
    const box = $('#basicsList'); if(!box) return;
    const d = basicsDone();
    const total = B.list.length;
    const bar = $('#basicBar');
    if(bar) bar.style.width = (total ? Math.round(d.length / total * 100) : 0) + '%';

    /* 分组 chips：每组后面挂「已读 / 总数」 */
    const chips = $('#basicChips');
    if(chips){
      chips.innerHTML = ['全部'].concat(B.groups).map(g => {
        const items = g === '全部' ? B.list : B.list.filter(x => x.grp === g);
        const rd = items.filter(x => d.indexOf(x.no) >= 0).length;
        const on = (g === '全部' && basicsGrp === null) || g === basicsGrp;
        return `<button data-g="${g}" class="${on ? 'on' : ''}">${g}
          <span class="n">${rd}/${items.length}</span></button>`;
      }).join('');
    }

    let html = '';
    B.groups.forEach(g => {
      if(basicsGrp !== null && basicsGrp !== g) return;
      const items = B.list.filter(x => x.grp === g);
      if(!items.length) return;
      html += `<div class="grp-label">${g} · ${items.filter(x => d.indexOf(x.no) >= 0).length}/${items.length}</div>`;
      html += items.map(b => {
        const read = d.indexOf(b.no) >= 0;
        return `<div class="basic ${read ? 'read' : ''}" data-b="${b.no}" role="button" tabindex="0">
          <div class="no">${read ? '✓' : b.no}</div>
          <div style="min-width:0">
            <h3>${b.title}</h3>
            <div class="one">${b.one}</div>
          </div>
          <div class="tick">${read ? '✓' : ''}</div>
        </div>`;
      }).join('');
    });

    /* 当前组读完了：给一个明确的「下一组」，不用自己回去找 */
    if(basicsGrp !== null){
      const g = basicsGrp;
      const items = B.list.filter(x => x.grp === g);
      const allRead = items.length && items.every(x => d.indexOf(x.no) >= 0);
      const gi = B.groups.indexOf(g);
      const next = B.groups[gi + 1];
      if(allRead){
        html += `<div class="card" style="margin-top:10px;padding:13px 14px;background:var(--down-soft);border-color:var(--ok-line)">
          <div style="font-size:12.5px;font-weight:800;color:var(--ok-ink)">这一组读完了 · ${items.length} 条</div>
          <div style="font-size:11px;color:var(--ok-ink-2);line-height:1.65;margin-top:4px">
            不急着往下。能用自己的话把这一组讲一遍，比读下一组有用。
          </div>
          ${next ? `<button class="btn btn-sm" id="nextGrp" style="margin-top:10px">下一组：${next}</button>`
                 : `<button class="btn btn-sm" id="allGrp" style="margin-top:10px">看全部 25 条</button>`}
        </div>`;
      }
    }

    box.innerHTML = html;
    $('#basicsProgress').textContent = d.length + ' / ' + total;
  }

  $('#basicChips').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    basicsGrp = b.dataset.g === '全部' ? null : b.dataset.g;
    renderBasics();
  });
  $('#basicsList').addEventListener('click', e => {
    const ng = e.target.closest('#nextGrp');
    if(ng){
      const gi = B.groups.indexOf(basicsGrp);
      basicsGrp = B.groups[gi + 1] || null;
      renderBasics();
      const box = $('#basicsList');
      if(box) box.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }
    if(e.target.closest('#allGrp')){ basicsGrp = null; renderBasics(); return; }
    const b = e.target.closest('.basic'); if(!b) return;
    openBasic(b.dataset.b);
  });

  function openBasic(no){
    const b = B.list.find(x => x.no === no); if(!b) return;
    /* 打开就算读过：原来要点两次（点开 + 标记已读），25 条要 50 次点击。
       点开了就是在读，没必要再让用户确认一次；想回退就点「标记未读」。 */
    const d0 = basicsDone();
    if(d0.indexOf(no) < 0){
      d0.push(no); store.set('ta_basics', d0);
      giveXp(XP.basic, '读启蒙 ' + no);
      store.set('ta_today_b', todayKey());
      renderBasics(); renderRank(); renderToday();
    }
    const isRead = true;
    $('#sheetBody').innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <span class="pill gold">Lv1 启蒙</span><span class="pill">${b.grp}</span>
      </div>
      <h2>${b.title}</h2>
      <div class="lead" style="margin-top:8px;font-size:13.5px;color:var(--brand-2);font-weight:700;line-height:1.6">${b.one}</div>
      <div class="block"><h4>为什么重要</h4>
        <div style="font-size:12.5px;line-height:1.8;color:var(--ink-2)">${b.why}</div></div>
      <div class="block"><h4>常见误解</h4>
        <div style="font-size:12.5px;line-height:1.8;color:var(--ink-2)">${b.mis}</div></div>
      <div class="card" style="margin-top:14px;padding:13px;background:var(--brand-soft);border-color:#dbe6f2">
        <div style="font:700 9.5px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:7px">举个例子</div>
        <div style="font-size:12px;line-height:1.75;color:var(--ink-2)">${b.eg}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary btn-block" id="markBasic" style="background:var(--brand);color:#fff;border-color:var(--brand)">
          ${isRead ? '✓ 已读 · 标记未读' : '标记已读'}
        </button>
        ${b.link ? '<button class="btn btn-block" id="toCourse">学相关课程</button>' : ''}
      </div>`;
    $('#markBasic').addEventListener('click', () => {
      const d = basicsDone();
      const i = d.indexOf(no);
      if(i < 0) d.push(no); else d.splice(i, 1);
      store.set('ta_basics', d);
      renderBasics(); renderRank(); renderToday(); closeSheet();
    });
    const tc = $('#toCourse');
    if(tc) tc.addEventListener('click', () => {
      closeSheet();
      setTimeout(() => openCourse(b.link), 200);
    });
    openSheet();
  }

  /* ============================================================
     亏损案例库（常见死法）
     ============================================================ */
  function renderDeaths(){
    const box = $('#deathList'); if(!box) return;
    let html = '';
    D.groups.forEach(g => {
      const items = D.list.filter(x => x.grp === g);
      if(!items.length) return;
      html += `<div class="grp-label">${g}</div>`;
      html += items.map(d => `
        <div class="death" data-d="${d.id}" role="button" tabindex="0">
          <div class="no">${d.id.slice(1)}</div>
          <div style="min-width:0">
            <div class="tt">${d.title}</div>
            <div class="th"><b>你以为：</b>${d.think}</div>
          </div>
        </div>`).join('');
    });
    box.innerHTML = html;
  }

  $('#deathList').addEventListener('click', e => {
    const el = e.target.closest('.death'); if(!el) return;
    openDeath(el.dataset.d);
  });

  function openDeath(id){
    const d = D.list.find(x => x.id === id); if(!d) return;
    const b = d.link ? B.list.find(x => x.no === d.link) : null;
    $('#sheetBody').innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span class="pill up">常见死法</span><span class="pill">${d.grp}</span>
      </div>
      <h2>${d.title}</h2>
      <div class="dt-scene"><b>场景：</b>${d.scene}</div>
      <div class="dt-k">你以为</div>
      <div class="dt-real">${d.think}</div>
      <div class="dt-k">实际发生了什么</div>
      <div class="dt-real">${d.real}</div>
      <div class="dt-bad"><b>代价：</b>${d.real.indexOf('退市') >= 0 ? '可能归零，且没有止损机会。' : '这笔亏损只是开始——真正的代价是它会重复发生，直到你认出这个模式。'}</div>
      <div class="dt-fix"><b>正确做法：</b>${d.fix}</div>
      ${b ? `<button class="btn btn-sm btn-block" id="toBasic" style="margin-top:14px">看相关启蒙条目：${b.title}</button>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-sm btn-block" id="dDone" style="background:var(--brand);color:#fff;border-color:var(--brand)">知道了</button>
      </div>`;
    const tb = $('#toBasic');
    if(tb) tb.addEventListener('click', () => { closeSheet(); setTimeout(() => openBasic(d.link), 200); });
    $('#dDone').addEventListener('click', () => {
      /* 死法给的经验很少：读一遍就能拿分的东西给多了，会变成刷分 */
      const tag = '读死法 ' + id;
      const seen = L ? L.readProf(store).log.filter(x => x.w === tag).length : 1;
      if(L && !seen){
        giveXp(XP.death, tag);
        renderToday();
      }
      closeSheet();
    });
    openSheet();
  }

  /* ============================================================
     流派自测
     ============================================================ */
  let quizAns = {}, quizIdx = 0;

  function renderQuizCard(){
    const box = $('#quizCard'); if(!box || !Q) return;
    const saved = store.get('ta_quiz', null);
    if(saved){
      const t = T.ALL.find(x => x.k === saved.top);
      $('#quizState').textContent = '已测 · ' + (t ? t.name : '');
      box.innerHTML = `
        <div class="quiz-res">
          <div class="kick">你的倾向流派</div>
          <div class="nm">${t ? t.name : '—'}</div>
          <div class="sh">匹配度 ${saved.share}%</div>
          <div class="ds">${t ? t.promise : ''}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-sm btn-block" id="seeFit" style="background:var(--brand);color:#fff;border-color:var(--brand)">看这一派的约束</button>
          <button class="btn btn-sm btn-block" id="redoQuiz">重测</button>
        </div>
        <button class="btn btn-sm btn-block" id="fromQuiz" style="margin-top:8px">以这一派为底，写自己的流派 ›</button>`;
      $('#seeFit').addEventListener('click', () => { go('teacher'); setTimeout(() => openTeacher(saved.top), 120); });
      $('#redoQuiz').addEventListener('click', () => { store.set('ta_quiz', null); quizAns = {}; quizIdx = 0; renderQuizCard(); renderRank(); });
      $('#fromQuiz').addEventListener('click', () => seedFromSchool(saved.top));
      return;
    }
    $('#quizState').textContent = '8 题 · 约 2 分钟';
    box.innerHTML = `
      <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:12px">
        8 道题，围绕三个硬约束：你能投入多少时间、能承受多大回撤、本金规模。
        测完直接跳到那一派的约束条件。
      </div>
      <button class="btn btn-primary btn-block" id="startQuiz" style="background:var(--brand);color:#fff;border-color:var(--brand)">开始自测</button>`;
    $('#startQuiz').addEventListener('click', () => openQuiz());
  }

  function openQuiz(){
    quizIdx = 0; quizAns = {};
    renderQuizQ();
    openSheet();
  }

  function renderQuizQ(){
    if(!Q) return;
    const total = Q.list.length;
    if(quizIdx >= total){ renderQuizResult(); return; }
    const q = Q.list[quizIdx];
    $('#sheetBody').innerHTML = `
      <div class="qbar">
        <span class="txt">${quizIdx + 1} / ${total}</span>
        <span class="track"><i style="width:${(quizIdx) / total * 100}%"></i></span>
      </div>
      <div class="quiz-q">
        <div class="qt">${q.q}</div>
        ${q.opts.map((o, i) => {
          const bad = Object.keys(o.w || {}).length === 0;
          return `<button class="quiz-opt ${bad ? 'warn' : ''}" data-o="${i}">
            <div>${o.t}</div><div class="nt">${o.note}</div>
          </button>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        ${quizIdx > 0 ? '<button class="btn btn-sm" id="qPrev">上一题</button>' : ''}
        <button class="btn btn-sm btn-block" id="qNext" style="background:var(--brand);color:#fff;border-color:var(--brand)">
          ${quizIdx === total - 1 ? '看结果' : '下一题'}
        </button>
      </div>`;
    let picked = -1;
    $$('#sheetBody .quiz-opt').forEach(b => b.addEventListener('click', () => {
      $$('#sheetBody .quiz-opt').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); picked = +b.dataset.o;
    }));
    const pv = $('#qPrev');
    if(pv) pv.addEventListener('click', () => { quizIdx--; renderQuizQ(); });
    $('#qNext').addEventListener('click', () => {
      if(picked < 0){ $('#sheetBody').scrollTop = 0; return; }
      quizAns[quizIdx] = picked;
      quizIdx++;
      renderQuizQ();
    });
  }

  function renderQuizResult(){
    const res = Q.result(quizAns);
    if(!res){ closeSheet(); return; }
    const t = T.ALL.find(x => x.k === res.top);
    const r = T.RULES[res.top];
    store.set('ta_quiz', res);
    $('#sheetBody').innerHTML = `
      <div class="quiz-res">
        <div class="kick">你倾向的流派</div>
        <div class="nm">${t ? t.name : res.top}</div>
        <div class="sh">匹配度 ${res.share}%</div>
        <div class="ds">${t ? t.promise : ''}</div>
      </div>
      ${r ? `<div class="rulebox">
        <div class="rh">这一派对你的约束</div>
        <div class="ri"><span>最低资金</span><span>${r.minCap}</span></div>
        <div class="ri"><span>最大仓位</span><span>${r.maxPos}</span></div>
        <div class="ri"><span>止损方式</span><span>${r.stop}</span></div>
        <div class="ri"><span>交易频率</span><span>${r.freq}</span></div>
        <div class="forbid"><b>明确不适合的人：</b>${r.forbid.join('、')}</div>
      </div>` : ''}
      <div class="warnbox">自测结果只反映你<b>现在</b>的条件。资金量、可投入时间、承受力变了，答案也会变——建议资金或时间发生重大变化时重测一次。</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-sm btn-block" id="qDone" style="background:var(--brand);color:#fff;border-color:var(--brand)">知道了</button>
        <button class="btn btn-sm btn-block" id="qRedo">重测</button>
      </div>`;
    $('#qDone').addEventListener('click', () => { closeSheet(); renderQuizCard(); renderRank(); });
    $('#qRedo').addEventListener('click', () => { quizAns = {}; quizIdx = 0; renderQuizQ(); });
  }

  /* ============================================================
     老师模块
     设计要点：不列人名，只列流派；每个流派都强制配「反例」和「谁不该用」。
     ============================================================ */
  const T = window.TEACHERS || { SCHOOLS:[], FAKES:[], ALL:[], LINEAGE:[], RULES:{} };
  let tchTab = null;   // 幻方高亮（null 表示未选中）

  const FIT_LABEL = { style:'看周期', method:'可复核', inst:'需资质', fake:'话术' };
  const QUADS = [
    { qz:'攻 · 主动', nm:'择时派', ct:'靠买卖时点赚钱', keys:['longtou','event'] },
    { qz:'攻 · 被动', nm:'跟随派', ct:'靠趋势延续赚钱', keys:['trend','rotation'] },
    { qz:'守 · 被动', nm:'配置派', ct:'靠持有结构赚钱', keys:['dividend','quant'] },
    { qz:'守 · 主动', nm:'逆向派', ct:'靠别人犯错赚钱', keys:['value','contrarian'] }
  ];

  function renderPantheon(){
    const box = $('#pantheon'); if(!box) return;
    box.innerHTML = '<i class="center-axis"></i><i class="center-axis h"></i><div class="core-chip">按「你怎么赚钱」分</div>' +
      QUADS.map((q, i) => {
        const on = tchTab !== null && q.keys.indexOf(tchTab) >= 0;
        return `<button class="pan${on ? ' on' : ''}" data-q="${i}">
          <i class="dot"></i>
          <div class="qz">${q.qz}</div>
          <div class="nm">${q.nm}</div>
          <div class="ct">${q.ct} · ${q.keys.length} 派</div>
        </button>`;
      }).join('');
  }

  function renderTeachers(){
    if(!T.SCHOOLS || !T.SCHOOLS.length) return;
    renderPantheon();
    const fit = t => {
      if(t.tier === 'fake') return '话术';
      if(t.tier === 'inst') return '需资质';
      if(t.tier === 'method') return '可复核';
      return '看周期';
    };
    const card = (t, idx) => `
      <div class="tch ${t.tier === 'fake' ? 'fake' : ''}" data-t="${t.k}" role="button" tabindex="0">
        <div class="head">
          <div class="av ${t.tier === 'fake' ? 'fake' : 'st-' + (idx % 4 + 1)}">${t.no}</div>
          <div style="min-width:0">
            <div class="nm">${t.name}</div>
            <div class="hd">
              <span class="badge-v ${t.verified === '无' || t.verified === '无公开业绩披露' ? 'none' : ''}">${t.verified === '无' ? '无凭证' : (t.verified.indexOf('无') === 0 ? '无业绩' : '可核查')}</span>
              <i class="dotsep"></i>
              <span>${t.tag}</span>
            </div>
          </div>
        </div>
        <div class="promise">${t.promise}</div>
        <div class="tags">
          ${(t.match.length ? t.match : ['—']).map(m => `<span class="tg">${{'趋势':'趋势市','震荡':'震荡市','发酵':'发酵期','启动':'启动期','底部':'底部区'}[m] || m}</span>`).join('')}
        </div>
        <div class="foot">
          <span class="fit">识别难度 <b>${t.tier === 'fake' ? '低' : (t.tier === 'inst' ? '高' : '中')}</b> · ${fit(t)}</span>
          <span class="arrow">看约束 ›</span>
        </div>
      </div>`;

    $('#teacherGrid').innerHTML = T.SCHOOLS.map(card).join('');
    $('#fakeGrid').innerHTML = T.FAKES.map(card).join('');
    $('#tchCount').textContent = T.SCHOOLS.length + ' 个流派';
    $('#fakeCount').textContent = T.FAKES.length + ' 类';
  }

  function openTeacher(k){
    const t = T.ALL.find(x => x.k === k); if(!t) return;
    const r = T.RULES[t.k] || null;
    const isFake = t.tier === 'fake';

    let html = `
      <div class="tch-hero">
        <div class="av" ${isFake ? 'style="background:linear-gradient(145deg,#8a8f96,#b0b5bb)"' : ''}>${t.no}</div>
        <div style="min-width:0">
          <h2>${t.name}</h2>
          <div class="meta">
            <span class="pill ${isFake ? 'up' : 'brand'}">${isFake ? '反面样本' : '真实流派'}</span>
            <span class="pill">${t.tag}</span>
          </div>
          <div class="meta" style="margin-top:6px">
            <span class="badge-v ${t.verified.indexOf('无') === 0 ? 'none' : ''}" style="font-size:9.5px">${t.verified}</span>
          </div>
        </div>
      </div>
      <div class="lead" style="margin-top:12px">${t.promise}</div>`;

    if(!isFake){
      html += `
      <div class="two-col">
        <div class="c ok"><span class="lb">教对了什么</span>${t.right}</div>
        <div class="c no"><span class="lb">教漏了什么</span>${t.wrong}</div>
      </div>
      <div class="c warn2" style="margin-top:9px;border-radius:var(--r-sm);padding:11px 12px;font-size:11.5px;line-height:1.65;border:1px solid #f0e2c0;background:var(--gold-soft);color:#6b521a">
        <span style="font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;opacity:.75;display:block;margin-bottom:5px">识别陷阱</span>${t.trap}
      </div>
      <div class="block"><h4>可执行的核心规则</h4><ul>${t.core.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
      if(r){
        html += `
        <div class="rulebox">
          <div class="rh">跟这一派的约束条件</div>
          <div class="ri"><span>最低资金</span><span>${r.minCap}</span></div>
          <div class="ri"><span>最大仓位</span><span>${r.maxPos}</span></div>
          <div class="ri"><span>止损方式</span><span>${r.stop}</span></div>
          <div class="ri"><span>交易频率</span><span>${r.freq}</span></div>
          <div class="ri"><span>持仓数量</span><span>${r.size}</span></div>
          <div class="forbid"><b>明确不适合的人：</b>${r.forbid.join('、')}</div>
        </div>`;
      }
      if(t.base) html += `<div class="warnbox">${t.base}</div>`;
      html += `
      <div class="block"><h4>师承</h4>
        <div style="font-size:11.5px;color:var(--ink-2);line-height:1.75">
          <b>${t.st.name}</b> · ${t.st.from} · ${t.st.era}<br>
          <span style="color:var(--muted)">${t.st.line}</span>
        </div>
      </div>`;
    } else {
      html += `
      <div class="two-col">
        <div class="c no"><span class="lb">它的破绽在哪</span>${t.wrong}</div>
        <div class="c warn2"><span class="lb">识别信号</span>${t.trap}</div>
      </div>
      <div class="warnbox"><b>处理方式：</b>不辩论、不投诉、不试单。直接离开。你花在它身上的每一分钟，都是从真正该练习的时间里偷出来的。</div>`;
    }

    $('#sheetBody').innerHTML = html;
    openSheet();
  }

  $('#teacherGrid').addEventListener('click', e => {
    const b = e.target.closest('.tch'); if(!b) return;
    openTeacher(b.dataset.t);
  });
  $('#fakeGrid').addEventListener('click', e => {
    const b = e.target.closest('.tch'); if(!b) return;
    openTeacher(b.dataset.t);
  });
  $('#pantheon').addEventListener('click', e => {
    const b = e.target.closest('.pan'); if(!b) return;
    const keys = (QUADS[+b.dataset.q] || {}).keys || [];
    const wasOn = tchTab !== null && keys.indexOf(tchTab) >= 0;
    tchTab = wasOn ? null : (keys[0] || null);
    renderTeachers();
    if(tchTab){
      const el = $('#teacherGrid').querySelector('[data-t="' + tchTab + '"]');
      if(el) el.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  });

  /* 三问识人 */
  const IDTEST = [
    ['近三年的年化收益和最大回撤分别是多少？', '答不出具体数字，或只说"翻倍"不说回撤 → 没有可验证的业绩'],
    ['这套方法在什么行情下会连续亏钱？', '答"不会亏"或"我很少错" → 不懂策略成本，也没经过完整周期'],
    ['你靠什么赚钱：管理费、课程费、还是自己交易？', '主要靠课程/社群/软件 → 他的收入来源和你的盈利方向不一致']
  ];
  if($('#idtest')){
    $('#idtest').innerHTML = IDTEST.map((it, i) =>
      `<div class="q"><span class="n">${i+1}</span><div>${it[0]}<span class="r">${it[1]}</span></div></div>`
    ).join('');
  }

  if($('#lineage')){
    $('#lineage').innerHTML = T.LINEAGE.map(l => `
      <div class="ln">
        <div class="yr">${l.year} · ${l.id}</div>
        <div class="src">${l.from}</div>
        <div class="to">→ ${l.to.join(' · ')}</div>
        <div class="cn">${l.cn}</div>
        <div class="note">${l.note}</div>
      </div>`).join('');
  }

  /* ================= 我的 ================= */
  const BADGES = [
    { id:'b1', icon:'M5 12l4 4 10-10', label:'首课', on:() => done().length >= 1 },
    { id:'b2', icon:'M12 3l2.5 6 6 .5-4.6 4 1.4 6-5.3-3.4L6.7 19.5l1.4-6-4.6-4 6-.5z', label:'连对5', on:() => kb().best >= 5 },
    { id:'b3', icon:'M4 18V9M10 18V5M16 18v-6M22 18H2', label:'80%正确', on:() => kb().total >= 5 && kb().right/kb().total >= 0.8 },
    { id:'b4', icon:'M4 6h16M4 12h16M4 18h10', label:'4门课', on:() => done().length >= 4 }
  ];

  const REVIEW = ['今天的操作全部在计划内','没有触及止损却没执行的单子','持仓的买入理由今天仍然成立'];

  /* 今日目标的四项。全部可计算，没有「你觉得今天学得怎么样」。 */
  function goalItems(){
    const k = kb(), c = cb();
    const todayK = store.get('ta_today_k', { d:'', n:0 });
    const kn = (todayK.d === todayKey() ? todayK.n : 0);
    const cardToday = (store.get('ta_today_c', { d:'', n:0 }));
    const cn = (cardToday.d === todayKey() ? cardToday.n : 0);
    const rv = store.get('ta_review_' + todayKey(), []);
    return [
      { t:'答 1 张概念卡', ok: cn >= 1, n: cn + '/1' },
      { t:'读 1 条启蒙', ok: basicsDone().length > 0 && store.get('ta_today_b','') === todayKey(), n: '' },
      { t:'判 1 道题（K 线或卡片）', ok: (cn + kn) >= 1, n: '' },
      { t:'盘后三问', ok: rv.length >= 3, n: rv.length + '/3' }
    ];
  }
  const goalDone = () => goalItems().filter(g => g.ok).length;

  function markToday(kind){
    const key = kind === 'k' ? 'ta_today_k' : 'ta_today_c';
    const cur = store.get(key, { d:'', n:0 });
    const t = todayKey();
    store.set(key, { d: t, n: (cur.d === t ? cur.n : 0) + 1 });
  }

  /* 首页里的「今日」卡：打卡状态 / 目标进度 / 断签补救 */
  function renderToday(){
    const box = $('#todayCard'); if(!box) return;
    const p = L ? L.readProf(store) : { streak:0, xp:0, freezes:0, lastDay:'' };
    const acts = L ? L.activeToday(store) : false;
    const brk = L ? L.broken(store) : false;
    const g = goalItems(), gd = goalDone();
    const total = g.length;

    box.className = 'card todaycard' + (acts ? ' on' : '');
    box.innerHTML = `
      <div class="top">
        <div class="t"><i class="dot"></i>${acts ? '今天已打卡' : '今天还没开始'}</div>
        <div class="sub">连续 ${p.streak || 0} 天${p.freezes ? ' · 补签卡 ' + p.freezes : ''}</div>
      </div>
      <div class="goal">
        <div class="track"><i style="width:${Math.round(gd / total * 100)}%"></i></div>
        <div class="pct">${gd}/${total}</div>
      </div>
      <div class="acts">
        ${g.map(x => `<span class="mini ${x.ok ? 'ghost' : ''}" style="${x.ok ? 'text-decoration:line-through;opacity:.55' : ''}">
          ${x.ok ? '✓' : '○'} ${x.t}</span>`).join('')}
      </div>
      ${brk ? `<div style="margin-top:11px;padding:9px 11px;border-radius:8px;background:var(--gold-soft);border:1px solid var(--gold-line);font-size:11px;line-height:1.65;color:var(--gold-ink-2)">
        连击断了（上次 ${p.lastDay}）。断一天不算什么，别因为断了就彻底放弃——
        ${p.freezes ? '你还有 ' + p.freezes + ' 张补签卡，可以补救昨天。' : '从今天重新开始就行。'}
        ${p.freezes ? '<button class="mini primary" id="useFreeze" style="margin-left:6px">用补签卡</button>' : ''}
      </div>` : ''}
      <div class="acts" style="margin-top:11px">
        <button class="mini primary" id="tQz">答题卡</button>
        <button class="mini" id="tK">K 线一题</button>
        <button class="mini" id="tBasic">读启蒙</button>
        <button class="mini" id="tReview">盘后三问</button>
      </div>`;

    const uf = $('#useFreeze');
    if(uf) uf.addEventListener('click', () => {
      const r = L.useFreeze(store);
      if(r.ok){ toast('补签成功，连击保住了'); renderToday(); renderHud(); }
      else toast('补不了：' + (r.reason === 'gap-too-long' ? '断太久了' : '今天已经学过了'));
    });
    $('#tQz').addEventListener('click', () => { go('train'); startQuizCards(!!weakList().length); });
    $('#tK').addEventListener('click', () => {
      go('train');
      setTimeout(() => { const t = $('#trainerCard'); if(t) t.scrollIntoView({ behavior:'smooth', block:'start' }); }, 80);
    });
    $('#tBasic').addEventListener('click', () => {
      const d = basicsDone();
      const first = B.list.filter(x => d.indexOf(x.no) < 0)[0];
      if(first) openBasic(first.no); else toast('25 条已经全读完了');
    });
    $('#tReview').addEventListener('click', () => {
      go('me');
      setTimeout(() => { const t = $('#reviewList'); if(t) t.scrollIntoView({ behavior:'smooth', block:'center' }); }, 80);
    });

    /* hero 底部小字：今天做了什么，不刷屏 */
    const tip = $('#heroTip');
    if(tip){
      const tx = L ? L.todayXp(store) : 0;
      const lv = L ? L.levelOf(p.xp) : { into:0, need:200 };
      tip.innerHTML = acts
        ? `今天 <b>+${tx} XP</b> · 本段 ${lv.into}/${lv.need} · 连续 <b>${p.streak}</b> 天`
        : '今天还没开始。一组十题大约三分钟，做完就算打卡。';
    }
  }

  /* ============================================================
     自创流派：装配台
     ------------------------------------------------------------
     状态全在 CF.read(store) 里，改动即时落盘（不留"忘了保存"这种坑），
     重渲染只做局部：填字不重画整页，否则输入框会丢焦点。
     ============================================================ */
  function renderCraft(){
    const c = CF.read(store);
    paintGates(c); paintSlots(c); paintSeeds(); paintChecks(c); paintVerdict(c);

    const nm = $('#cfName');
    if(nm && $$('.view.on').length && nm.value !== c.name) nm.value = c.name;

    if(nm && !nm._bound){
      nm._bound = true;
      nm.addEventListener('input', () => {
        const v = CF.read(store); v.name = nm.value; CF.save(store, v);
        paintVerdict(v);
      });
    }
    const sv = $('#cfSave');
    if(sv && !sv._bound){
      sv._bound = true;
      sv.addEventListener('click', () => {
        const v = CF.read(store); v.at = todayKey(); CF.save(store, v);
        const r = CF.review(v);
        toast(r.pass ? '已保存 · ' + CF.verdict(r) : '已保存为草稿，还差：' + r.gates.filter(g => !g.ok)[0].why);
        paintVerdict(v);
      });
    }
    const rs = $('#cfReset');
    if(rs && !rs._bound){
      rs._bound = true;
      rs.addEventListener('click', () => {
        CF.save(store, { name:'', base:'fuso', draft:{}, checks:{}, at:'' });
        const nm2 = $('#cfName'); if(nm2) nm2.value = '';
        renderCraft();
        toast('已清空');
      });
    }
  }

  /* 从自测结果起个草稿：把那一派的核心规则塞进前四格，
     禁区塞进第 5 格，第 6 格留空 —— 那一格只能自己写。 */
  function seedFromSchool(k){
    const t = T.ALL.find(x => x.k === k);
    if(!t){ toast('没找到这一派'); return; }
    const c = CF.read(store);
    const core = (t.core || []).slice(0, 4);
    ['entry', 'size', 'stop', 'exit'].forEach((s, i) => {
      if(core[i]) c.draft[s] = core[i];
    });
    if(!(c.draft.forbid || '').trim()) c.draft.forbid = '退潮期 / 条件不满足时一律空仓';
    if(!c.name) c.name = t.name + '（改）';
    CF.save(store, c);
    go('craft');
    setTimeout(() => { paintSlots(CF.read(store)); paintGates(CF.read(store)); paintVerdict(CF.read(store)); }, 60);
    toast('已按「' + t.name + '」起了草稿，第 6 格留给你自己写');
  }

  function paintGates(c){
    const box = $('#cfGates'); if(!box) return;
    const r = CF.review(c);
    box.innerHTML = r.gates.map((g, i) => `
      <div class="gate ${g.ok ? 'on' : ''}">
        <span class="gi">${g.ok ? '✓' : i + 1}</span>
        <span class="gt">${g.why}</span>
      </div>`).join('');
    $('#cfState').textContent = r.pass ? '已挂牌' : (r.n ? '装配中' : '未开始');
  }

  function paintSlots(c){
    const box = $('#cfSlots'); if(!box) return;
    box.innerHTML = CF.SLOTS.map(s => {
      const v = (c.draft[s.k] || '');
      return `
      <div class="slot ${v.trim().length >= 2 ? 'on' : ''}">
        <div class="sh"><span class="no">${s.no}</span><span class="sn">${s.name}</span>
          ${s.k === 'forbid' ? '<span class="req">必填</span>' : ''}</div>
        <div class="sd">${s.hint}</div>
        <textarea class="sin" data-s="${s.k}" rows="2" placeholder="—">${v}</textarea>
        <div class="sw">填错了通常会是这样：${s.wrong}</div>
      </div>`;
    }).join('');
    $('#cfFill').textContent = CF.filled(c) + ' / ' + CF.SLOTS.length + ' 格';

    $$('#cfSlots .sin').forEach(t => {
      t.addEventListener('input', () => {
        const v = CF.read(store);
        v.draft[t.dataset.s] = t.value;
        CF.save(store, v);
        /* 只更新轻量部分，不动 textarea，避免光标跳 */
        $('#cfFill').textContent = CF.filled(v) + ' / ' + CF.SLOTS.length + ' 格';
        t.closest('.slot').classList.toggle('on', t.value.trim().length >= 2);
        paintGates(v); paintVerdict(v);
      });
    });
  }

  function paintSeeds(){
    const box = $('#cfSeeds'); if(!box) return;
    if(box._done) return;
    box._done = true;
    box.innerHTML = CF.SEEDS.map((s, i) => `<button class="seed" data-i="${i}">${s.from} · ${s.t}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('.seed'); if(!b) return;
      const s = CF.SEEDS[+b.dataset.i];
      const c = CF.read(store);
      /* 借来的规则默认落到「我明确不做的事」——八派的禁止条款本来就长这样 */
      const cur = (c.draft.forbid || '').trim();
      if(cur.indexOf(s.t) >= 0){ toast('这条已经在禁区里了'); return; }
      c.draft.forbid = cur ? cur + '\n' + s.t : s.t;
      CF.save(store, c);
      const t = $('#cfSlots .sin[data-s="forbid"]');
      if(t) t.value = c.draft.forbid;
      paintSlots(c); paintGates(c); paintVerdict(c);
      toast('已加进「我明确不做的事」');
    });
  }

  function paintChecks(c){
    const box = $('#cfChecks'); if(!box) return;
    box.innerHTML = CF.CHECKS.map((q, i) => {
      const a = c.checks[q.k];
      return `
      <div class="ckcard ${a ? 'done' : ''}" data-k="${q.k}">
        <div class="ckq"><span class="cn">${i + 1}</span>${q.name}</div>
        <button class="ckopt ${a === 'good' ? 'picked' : ''}" data-a="good">${q.good}</button>
        <button class="ckopt ${a === 'bad' ? 'picked bad' : ''}" data-a="bad">${q.bad}</button>
      </div>`;
    }).join('');
    const good = Object.keys(c.checks).filter(k => c.checks[k] === 'good').length;
    $('#cfScore').textContent = good + ' / ' + CF.CHECKS.length;

    $$('#cfChecks .ckopt').forEach(b => {
      b.addEventListener('click', () => {
        const v = CF.read(store);
        v.checks[b.closest('.ckcard').dataset.k] = b.dataset.a;
        CF.save(store, v);
        paintChecks(v); paintGates(v); paintVerdict(v);
      });
    });
  }

  function paintVerdict(c){
    const box = $('#cfVerdict'); if(!box) return;
    const r = CF.review(c);
    box.className = 'cfverdict ' + (r.pass ? 'ok' : '');
    box.innerHTML = `
      <div class="cv-nm">${CF.nameOf(c)}</div>
      <div class="cv-t">${CF.verdict(r)}</div>
      <div class="cv-d">${r.pass
        ? '规则 ' + r.n + ' 条 · 场景 ' + r.good + '/12。挂牌只是说明它<b>自洽</b>，不说明它能赚钱。'
        : '还差：' + r.gates.filter(g => !g.ok).map(g => g.why).join('；')}</div>`;
  }

  function renderMe(){
    const d = done();
    const s = kb(), c = cb();
    $('#mCourse').textContent = d.length + '/' + COURSES.length;
    const tot = (s.total || 0) + (c.total || 0), rgt = (s.right || 0) + (c.right || 0);
    $('#mAcc').textContent = tot ? Math.round(rgt / tot * 100) + '%' : '—';
    if($('#mSolid')) $('#mSolid').textContent = L ? L.mastery(store, CARDD.size).solid : 0;

    /* 等级卡 */
    const p = L ? L.readProf(store) : { xp:0, streak:0 };
    const lv = L ? L.levelOf(p.xp) : { lv:1, into:0, need:200, pct:0 };
    const rc = R ? R.current(store) : null;
    if($('#lvCard')){
      $('#lvCard').innerHTML = `
        <div class="l1">
          <div>
            <span class="lv">LV ${lv.lv} · 学习等级</span>
            <div style="font-size:15px;font-weight:800;margin-top:9px;letter-spacing:-.2px">
              ${rc ? rc.rank.name : '启蒙'}${rc && rc.allDone ? ' · 通关' : ''}
            </div>
            <div style="font-size:11px;opacity:.72;margin-top:4px">段位毕业只看真实成果，经验值只表示这一段走了多远</div>
          </div>
          <div class="xp">${p.xp}<span>累计 XP</span></div>
        </div>
        <div class="bar"><i style="width:${lv.pct}%"></i></div>
        <div class="foot"><span>本段 ${lv.into} / ${lv.need}</span><span>连续 ${p.streak || 0} 天</span></div>`;
    }

    /* 本周 */
    if($('#weekBar') && L){
      const wk = L.week(store);
      const on = wk.filter(x => x.on).length;
      $('#weekBar').innerHTML = wk.map(x =>
        `<div class="d ${x.on ? 'on' : ''} ${x.today ? 'today' : ''}">
           <div class="wd">${x.wd}</div>
           <div class="c">${x.on ? '✓' : ''}</div>
         </div>`).join('');
      if($('#weekSub')) $('#weekSub').textContent = on + ' / 7 天';
      if($('#weekTip')) $('#weekTip').textContent = on === 0
        ? '这一周还没有记录。不用每天都学很久，学过一次就算。'
        : on >= 6 ? '几乎全勤。注意别为了保持连击而敷衍——连续只是副产品。'
        : '有记录的天数：' + on + '。断一天不影响，断一周就很难回来了。';
    }

    /* 今天做了什么 */
    if($('#todayList') && L){
      const log = L.todayLog(store);
      const tx = L.todayXp(store);
      if($('#todayXp')) $('#todayXp').textContent = '+' + tx + ' XP';
      $('#todayList').innerHTML = log.length
        ? log.map(x => `<div class="logrow"><span class="w">${x.w}</span><span class="x">+${x.xp}</span></div>`).join('')
        : '<div class="logempty">今天还没有记录。<br>答一组卡或读一条启蒙，这里就会出现。</div>';
    }

    $('#badges').innerHTML = BADGES.map(b => {
      const on = b.on();
      return `<div class="badge ${on ? 'on' : ''}">
        <svg class="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${b.icon}"/></svg>
        <span>${b.label}</span></div>`;
    }).join('');
    $('#badgeCount').textContent = BADGES.filter(b => b.on()).length + ' / ' + BADGES.length;
    renderThemes();

    const key = 'ta_review_' + todayKey();
    const saved = store.get(key, []);
    $('#reviewList').innerHTML = REVIEW.map((t,i) => `
      <label style="display:flex;gap:9px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line-2);font-size:12.5px;color:var(--ink-2);cursor:pointer">
        <input type="checkbox" data-i="${i}" ${saved.includes(i) ? 'checked' : ''} style="margin-top:4px;accent-color:#20456e;width:15px;height:15px">
        <span style="${saved.includes(i) ? 'color:#9aa5b1;text-decoration:line-through' : ''}">${t}</span>
      </label>`).join('');
  }
  $('#reviewList').addEventListener('change', e => {
    if(e.target.tagName !== 'INPUT') return;
    const key = 'ta_review_' + todayKey();
    const saved = [];
    $$('#reviewList input').forEach((x,i) => { if(x.checked) saved.push(i); });
    const was = store.get(key, []).length;
    store.set(key, saved);
    /* 三问全勾 = 完成一次复盘，这是 L4/L5 的硬指标，所以给分 */
    if(saved.length >= 3 && was < 3) giveXp(XP.review, '完成盘后三问');
    else if(saved.length) L && L.touch(store);
    renderMe(); renderToday(); renderRank();
  });

  /* ================= 仓位计算器（抽屉） ================= */
  $('#btnCalcOpen').addEventListener('click', () => {
    $('#sheetBody').innerHTML = `
      <h2>仓位计算器</h2>
      <div class="lead">先算这笔最多能亏多少，再反推该买多少股。</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:5px">总资金（万元）</div>
          <input id="cCap" type="number" value="100" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:var(--card-2);font-family:var(--mono)"></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:5px">单笔风险 %</div>
          <input id="cRisk" type="number" value="2" step="0.5" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:var(--card-2);font-family:var(--mono)"></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:5px">止损幅度 %</div>
          <input id="cStop" type="number" value="8" step="1" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:var(--card-2);font-family:var(--mono)"></div>
        <div><div style="font-size:11px;color:var(--muted);margin-bottom:5px">单票硬顶 %</div>
          <input id="cMax" type="number" value="25" step="5" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:var(--card-2);font-family:var(--mono)"></div>
      </div>
      <div class="card" style="margin-top:16px;padding:16px;text-align:center;background:var(--brand);border:none">
        <div style="font-size:11px;color:rgba(255,255,255,.6);letter-spacing:.1em;font-family:var(--mono)">建议仓位</div>
        <div id="cOut" style="font:800 30px/1.3 var(--mono);color:#fff;margin-top:4px">—</div>
        <div id="cAmt" style="font-size:12px;color:rgba(255,255,255,.7)">—</div>
      </div>
      <div class="warnbox">止损越宽，仓位必须越小。两者是替代关系，不是叠加关系——放宽止损同时保持仓位，等于放大风险。</div>`;
    const upd = () => {
      const cap = +$('#cCap').value || 0, risk = +$('#cRisk').value || 0, stop = +$('#cStop').value || 1, mx = +$('#cMax').value || 100;
      /* 仓位 = 风险% ÷ 止损幅度%，再压一次单票硬顶。
         原来写成 cap*risk/100/(stop/100)/cap*100，cap 会被约掉；
         cap 填 0 时变成 0/0，金额那一栏直接显示 NaN。 */
      const pct = (cap > 0 && risk > 0 && stop > 0) ? Math.min(risk / stop * 100, mx) : 0;
      $('#cOut').textContent = pct.toFixed(1) + '%';
      $('#cAmt').textContent = '约 ' + (cap * pct / 100).toFixed(1) + ' 万元 · 最大亏损 ' + (cap * pct / 100 * stop / 100).toFixed(2) + ' 万元';
    };
    ['cCap','cRisk','cStop','cMax'].forEach(id => $('#' + id).addEventListener('input', upd));
    upd();
    openSheet();
  });

  /* ================= 概念卡 / 数据 / 起始入口 ================= */
  $('#btnWeak').addEventListener('click', () => {
    const w = weakList();
    if(!w.length){ toast('还没有错题。答错过的卡会自动出现在这里。'); return; }
    go('train'); startQuizCards(true);
  });

  $('#btnDaily').addEventListener('click', () => {
    go('train');
    startQuizCards(!!weakList().length);
    setTimeout(() => { const t = $('#quizPane'); if(t) t.scrollIntoView({ behavior:'smooth', block:'start' }); }, 80);
  });

  function renderDeck(){
    const box = $('#deckBox'); if(!box) return;
    const m = L ? L.mastery(store, CARDD.size) : { solid:0, weak:0, seen:0, pct:0 };
    const cs = cb();
    if($('#cardProg')) $('#cardProg').textContent = m.solid + ' / ' + CARDD.size + ' 掌握';
    box.innerHTML = `
      <div style="font-size:12px;line-height:1.7;color:var(--ink-2)">
        已掌握 <b style="color:var(--brand-2)">${m.solid}</b> 张 · 待复习 <b style="color:var(--up)">${m.weak}</b> 张 ·
        累计答对 <b>${cs.right || 0}</b> / ${cs.total || 0}
      </div>
      <div class="deckrow" style="margin-top:12px">
        <button class="btn btn-sm" id="deckGo">${m.weak ? '复习错题（' + m.weak + '）' : '答一组新题'}</button>
        <button class="btn btn-sm" id="deckNew">随机十题</button>
      </div>`;
    $('#deckGo').addEventListener('click', () => { go('train'); startQuizCards(!!m.weak); });
    $('#deckNew').addEventListener('click', () => { go('train'); startQuizCards(false); });

    /* 按组统计掌握度——哪一组最弱，一眼能看到 */
    const box2 = $('#mastBox'); if(!box2) return;
    box2.innerHTML = '<div class="mastlist" style="margin-top:0">' + CARDD.groups.map(g => {
      const items = CARDD.list.filter(c => c.g === g);
      const done = items.filter(c => statOf(c.id).level >= 3).length;
      const pct = items.length ? Math.round(done / items.length * 100) : 0;
      return `<div class="mastrow">
        <div class="nm">${g}</div>
        <div class="track"><i class="${pct < 50 ? 'low' : ''}" style="width:${pct}%"></i></div>
        <div class="n">${done}/${items.length}</div>
      </div>`;
    }).join('') + '</div>';
  }

  /* 数据导入导出：本地存储最容易被清掉（换浏览器 / 清缓存），
     而段位是靠几十天的记录算出来的。给一条自救的路，比写一百句提示有用。 */
  const IO_KEYS = ['ta_prof','ta_mast','ta_cardstat','ta_kline','ta_done','ta_basics','ta_quiz','ta_theme','ta_best_streak'];
  $('#btnExport').addEventListener('click', () => {
    const out = { v: 8, at: todayKey(), data:{} };
    IO_KEYS.forEach(k => { const v = store.get(k, null); if(v !== null) out.data[k] = v; });
    /* 复盘记录按日期分开存，单独扫一遍 */
    for(let i = 0; i < 400; i++){
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = 'ta_review_' + d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      const v = store.get(k, null);
      if(v) out.data[k] = v;
    }
    const txt = JSON.stringify(out);
    const ta = $('#ioBox');
    ta.classList.add('on');
    ta.value = txt;
    ta.select();
    try { document.execCommand('copy'); } catch(e){}
    const h = $('#ioHint');
    h.className = 'iohint';
    h.textContent = '已生成并尝试复制（' + Math.round(txt.length / 1024 * 10) / 10 + ' KB）。保存好这段文本。';
  });

  $('#btnImport').addEventListener('click', () => {
    const ta = $('#ioBox');
    const h = $('#ioHint');
    if(!ta.classList.contains('on') || !ta.value.trim()){
      ta.classList.add('on');
      ta.value = '';
      ta.focus();
      h.className = 'iohint';
      h.textContent = '把之前导出的文本粘贴进来，再点一次「导入」。';
      return;
    }
    let obj = null;
    try { obj = JSON.parse(ta.value); } catch(e){ obj = null; }
    if(!obj || !obj.data || typeof obj.data !== 'object'){
      h.className = 'iohint bad';
      h.textContent = '这段文本读不出来。请确认是完整复制，没有被截断。';
      return;
    }
    let n = 0;
    Object.keys(obj.data).forEach(k => {
      if(k.indexOf('ta_') !== 0) return;
      store.set(k, obj.data[k]); n++;
    });
    h.className = 'iohint';
    h.textContent = '导入 ' + n + ' 项，正在刷新…';
    setTimeout(() => location.reload(), 600);
  });

  /* ================= 其他 ================= */
  $('#btnSim').addEventListener('click', () => { location.href = 'playbook.html#sandbox'; });
  $('#btnContinue').addEventListener('click', () => {
    const d = done();
    const next = COURSES.find(c => !d.includes(c.id));
    if(next){ openCourse(next.id); return; }
    const first = B.list.filter(x => basicsDone().indexOf(x.no) < 0)[0];
    if(first){ openBasic(first.no); return; }
    toast('课程和启蒙都读完了。去训练场练判断吧。');
    go('train');
  });

  /* ================= 启动 ================= */
  renderCourses();
  renderStage(0);
  updateAcc();
  renderHud();
  renderMe();
  renderQ();
  renderTeachers();
  renderBasics();
  renderRank();
  renderDeaths();
  renderQuizCard();
  renderToday();
  renderDeck();
  renderPane();
  renderCraft();
  const lastTab = store.get('ta_tab', 'learn');
  go(location.hash === '#train' ? 'train' : lastTab);
  window.addEventListener('resize', () => { if($('#v-train').classList.contains('on')) drawK(); });
})();
