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
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

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
  const VIEWS = ['learn', 'train', 'map', 'teacher', 'me'];

  function go(v){
    if(VIEWS.indexOf(v) < 0) v = 'learn';
    $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
    $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    window.scrollTo(0, 0);
    store.set('ta_tab', v);
    if(v === 'train') setTimeout(drawK, 30);
    if(v === 'me') renderMe();
    if(v === 'teacher') renderTeachers();
    if(v === 'learn'){ renderRank(); renderBasics(); renderDeaths(); renderQuizCard(); }
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
    $('#progressText').textContent = d.length + ' / 8 完成';
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
      if(!d.includes(id)){ d.push(id); store.set('ta_done', d); }
      renderCourses(); renderMe(); renderRank(); closeSheet();
      setTimeout(() => go('train'), 220);
    });
    $('#goDoc').addEventListener('click', () => { location.href = c.link; });
    openSheet();
  }

  /* ================= 抽屉 ================= */
  function openSheet(){ $('#mask').classList.add('on'); $('#sheet').classList.add('on'); }
  function closeSheet(){ $('#mask').classList.remove('on'); $('#sheet').classList.remove('on'); }
  $('#mask').addEventListener('click', closeSheet);

  /* ================= K线生成 ================= */
  function seg(n, start, drift, vol, seed, vb){
    const r = rng(seed); let p = start; const out = [];
    for(let i=0;i<n;i++){
      const o = p;
      const c = Math.max(0.5, p * (1 + drift + (r()*2-1)*vol));
      const h = Math.max(o, c) * (1 + r()*0.004);
      const l = Math.min(o, c) * (1 - r()*0.004);
      out.push({o:o, h:h, l:l, c:c, v:(0.5 + r()) * (vb || 1)});
      p = c;
    }
    return out;
  }

  const CASES = [
    { title:'放量突破前高', q:'图上标了三个位置，哪个才是符合系统的买点？',
      build(){
        let a = seg(30, 20, 0.0035, 0.012, 101);
        const high = Math.max.apply(null, a.map(b => b.h));
        let b2 = seg(12, a[a.length-1].c, -0.002, 0.010, 202);
        let c3 = seg(5, b2[b2.length-1].c, 0.014, 0.009, 303, 2.6);
        let d4 = seg(9, c3[c3.length-1].c, -0.003, 0.008, 404);
        const bars = a.concat(b2, c3, d4);
        return { bars, marks:[{i:41, label:'A'}, {i:50, label:'B'}, {i:54, label:'C'}],
          opts:[
            {k:'A', t:'A：突破前一天潜伏，成本最低'},
            {k:'B', t:'B：突破后回踩不破，确认再加仓'},
            {k:'C', t:'C：突破后第四天，趋势已经确立'}
          ], ans:'B',
          why:'突破当天买，最大的风险是假突破——放量冲高再砸回来，你连反应时间都没有。等回踩确认不破，成本高 2%–3%，但把「假突破」这个最大亏损来源过滤掉了。C 的问题是已经在加速段，止损位离得太远，风险收益比变差。' };
      } },

    { title:'高位放量长上影', q:'这根长上影出现后，系统的动作是什么？',
      build(){
        let a = seg(32, 15, 0.005, 0.011, 505);
        const last = a[a.length-1].c;
        const spike = { o:last, c:last*1.004, h:last*1.062, l:last*0.996, v:3.4 };
        a.push(spike);
        let b2 = seg(12, spike.c, -0.004, 0.010, 606);
        const bars = a.concat(b2);
        return { bars, marks:[{i:24, label:'A'}, {i:32, label:'B'}, {i:40, label:'C'}],
          opts:[
            {k:'A', t:'A：上涨途中，趋势完好，继续持有'},
            {k:'B', t:'B：长上影当天，放量滞涨，减仓一半'},
            {k:'C', t:'C：后面跌了再说，等跌破均线'}
          ], ans:'B',
          why:'连续上涨后出现放量长上影，说明当天有大量资金在更高价位出货——买盘接不住。这是趋势可能转折的第一个信号，不是确认。所以动作是「减仓」而不是「清仓」：留着底仓看后续，但先把大部分利润锁住。等跌破均线才走，等于把浮盈全部还回去。' };
      } },

    { title:'跌破颈线', q:'形态已经走坏，图上哪个位置是必须离场的点？',
      build(){
        let a = seg(18, 12, 0.006, 0.010, 707);
        let b2 = seg(10, a[a.length-1].c, -0.005, 0.009, 808);
        let c3 = seg(12, b2[b2.length-1].c, 0.005, 0.009, 909);
        const neck = Math.min.apply(null, b2.map(x => x.l));
        let d4 = seg(12, c3[c3.length-1].c, -0.012, 0.010, 111);
        const bars = a.concat(b2, c3, d4);
        return { bars, marks:[{i:39, label:'A'}, {i:48, label:'B'}, {i:53, label:'C'}], neck:neck,
          opts:[
            {k:'A', t:'A：第二个头，还没跌破，先观察'},
            {k:'B', t:'B：跌破颈线放量，清仓'},
            {k:'C', t:'C：跌了这么多，等反弹再说'}
          ], ans:'B',
          why:'双头形态的颈线是这套形态的「逻辑边界」。跌破颈线且放量，说明前一个头部的买盘全部被套，抛压会自我强化。C 是最典型的错误——「等反弹再走」，结果反弹永远不来，或者来了也不到你的成本。' };
      } },

    { title:'缩量阴跌', q:'这段走势里，系统应该做什么？',
      build(){
        let a = seg(40, 26, -0.0035, 0.007, 121, 0.55);
        const bars = a;
        return { bars, marks:[{i:12, label:'A'}, {i:26, label:'B'}, {i:36, label:'C'}],
          opts:[
            {k:'A', t:'A：跌了很多，抄底'},
            {k:'B', t:'B：缩量了，说明抛压减弱，埋伏'},
            {k:'C', t:'C：不参与，没有买点'}
          ], ans:'C',
          why:'缩量阴跌不是「抛压减弱」，是「没人接盘」。没有放量的下跌，说明卖的人还没卖完，买的人还在观望——这种走势可以持续很久。系统的买点需要「放量 + 结构确认」，两个条件一个都没满足，正确动作是空仓等待。' };
      } },

    { title:'回踩均线不破', q:'上升趋势中的这次回踩，哪个位置可以加仓？',
      build(){
        let a = seg(34, 18, 0.0045, 0.011, 131);
        let b2 = seg(8, a[a.length-1].c, -0.006, 0.008, 141);
        let c3 = seg(14, b2[b2.length-1].c, 0.006, 0.010, 151);
        const bars = a.concat(b2, c3);
        return { bars, marks:[{i:38, label:'A'}, {i:42, label:'B'}, {i:50, label:'C'}],
          opts:[
            {k:'A', t:'A：刚开始跌，先减仓避险'},
            {k:'B', t:'B：回踩均线缩量止跌，加仓'},
            {k:'C', t:'C：等它创新高再追'}
          ], ans:'B',
          why:'上升趋势里的回踩是机会，前提是「缩量 + 不破关键均线」。这两个条件同时满足，说明只是获利盘兑现，趋势结构没坏。A 是过度反应，C 是把最好的成本让给了别人。加仓后立刻把止损上移到回踩低点下方——这才是完整动作。' };
      } },

    { title:'无量反弹到前高', q:'反弹到前高附近但没有量，该怎么做？',
      build(){
        let a = seg(24, 30, 0.004, 0.010, 161);
        let b2 = seg(14, a[a.length-1].c, -0.010, 0.009, 171);
        let c3 = seg(14, b2[b2.length-1].c, 0.008, 0.006, 181, 0.5);
        const bars = a.concat(b2, c3);
        return { bars, marks:[{i:30, label:'A'}, {i:50, label:'B'}, {i:54, label:'C'}],
          opts:[
            {k:'A', t:'A：前高附近，压力位，减仓或观望'},
            {k:'B', t:'B：反弹有力，趋势反转，买入'},
            {k:'C', t:'C：等突破前高再说'}
          ], ans:'A',
          why:'反弹到前高但成交量明显萎缩，说明推动这波反弹的资金量远小于上一波——这是「反抽」而不是「反转」。前高是套牢盘最密集的位置，无量上攻基本等于送人头。正确的做法是在压力位减仓，而不是等突破：真突破了再买回来也只贵几个点。' };
      } }
  ];

  /* ================= K线绘制 ================= */
  let curCase = null, curIdx = 0, answered = false;
  const kb = () => store.get('ta_kline', { total:0, right:0, streak:0, best:0 });

  function drawK(){
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
    ctx.strokeStyle = '#f0f2f5'; ctx.lineWidth = 1;
    for(let i=0;i<=3;i++){
      const y = padT + chartH / 3 * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    }

    // 成交量
    let vmax = 0; bars.forEach(b => { if(b.v > vmax) vmax = b.v; });
    const vTop = h - 10 - volH;
    bars.forEach((b,i) => {
      const bh = Math.max(1, b.v / vmax * volH);
      ctx.fillStyle = b.c >= b.o ? 'rgba(217,74,69,.32)' : 'rgba(23,133,95,.32)';
      ctx.fillRect(X(i) - bw/2, h - 10 - bh, bw, bh);
    });

    // K线
    bars.forEach((b,i) => {
      const up = b.c >= b.o;
      const col = up ? '#d94a45' : '#17855f';
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
    ma(5, 'rgba(32,69,110,.55)');
    ma(20, 'rgba(176,124,23,.55)');

    // 颈线
    if(curCase.neck){
      ctx.setLineDash([3,3]); ctx.strokeStyle = 'rgba(15,26,38,.35)'; ctx.lineWidth = 1;
      const y = Y(curCase.neck);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // 标记
    curCase.marks.forEach(m => {
      const x = X(m.i);
      ctx.setLineDash([3,3]);
      ctx.strokeStyle = answered ? 'rgba(15,26,38,.22)' : 'rgba(32,69,110,.35)';
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - 10); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#20456e';
      ctx.beginPath(); ctx.arc(x, padT - 2, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 10px ui-monospace,monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.label, x, padT - 1);
    });
  }

  function renderQ(){
    const meta = CASES[curIdx % CASES.length];
    curCase = meta.build();
    curCase.title = meta.title;
    curCase.q = meta.q;
    answered = false;

    $('#qTitle').textContent = meta.title;
    $('#qText').textContent = meta.q;
    const s = kb();
    $('#qStreak').textContent = '连对 ' + s.streak;

    $('#opts').innerHTML = curCase.opts.map(o =>
      `<button class="opt" data-k="${o.k}"><span class="k">${o.k}</span><span>${o.t.replace(/^[A-C]：/, '')}</span></button>`
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

    const ex = $('#explain');
    ex.innerHTML = '<b>' + (ok ? '对。' : '不对，正确答案是 ' + curCase.ans + '。') + '</b> ' + curCase.why;
    ex.classList.add('show');
    renderMe();
  });

  $('#btnNextQ').addEventListener('click', () => { curIdx++; renderQ(); });
  $('#btnShowWhy').addEventListener('click', () => {
    if(answered) return;
    answered = true;
    $$('#opts .opt').forEach(x => { if(x.dataset.k === curCase.ans) x.classList.add('right'); });
    const ex = $('#explain');
    ex.innerHTML = '<b>解析：</b>' + curCase.why;
    ex.classList.add('show');
  });

  function updateAcc(){
    const s = kb();
    $('#accText').textContent = s.total ? '正确率 ' + Math.round(s.right/s.total*100) + '%（' + s.right + '/' + s.total + '）' : '正确率 —';
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
  function renderBasics(){
    const box = $('#basicsList'); if(!box) return;
    const d = basicsDone();
    let html = '';
    B.groups.forEach(g => {
      const items = B.list.filter(x => x.grp === g);
      if(!items.length) return;
      html += `<div class="grp-label">${g}</div>`;
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
    box.innerHTML = html;
    $('#basicsProgress').textContent = d.length + ' / ' + B.list.length;
  }

  $('#basicsList').addEventListener('click', e => {
    const b = e.target.closest('.basic'); if(!b) return;
    openBasic(b.dataset.b);
  });

  function openBasic(no){
    const b = B.list.find(x => x.no === no); if(!b) return;
    const isRead = basicsDone().indexOf(no) >= 0;
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
          ${isRead ? '已读 · 再看一遍' : '标记已读'}
        </button>
        ${b.link ? '<button class="btn btn-block" id="toCourse">学相关课程</button>' : ''}
      </div>`;
    $('#markBasic').addEventListener('click', () => {
      const d = basicsDone();
      if(d.indexOf(no) < 0){ d.push(no); store.set('ta_basics', d); }
      renderBasics(); renderRank(); closeSheet();
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
    $('#dDone').addEventListener('click', closeSheet);
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
        </div>`;
      $('#seeFit').addEventListener('click', () => { go('teacher'); setTimeout(() => openTeacher(saved.top), 120); });
      $('#redoQuiz').addEventListener('click', () => { store.set('ta_quiz', null); quizAns = {}; quizIdx = 0; renderQuizCard(); renderRank(); });
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

  function renderMe(){
    $('#mCourse').textContent = done().length + '/8';
    const s = kb();
    $('#mAcc').textContent = s.total ? Math.round(s.right/s.total*100) + '%' : '—';
    $('#mViol').textContent = s.total - s.right;

    $('#badges').innerHTML = BADGES.map(b => {
      const on = b.on();
      return `<div class="badge ${on ? 'on' : ''}">
        <svg class="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${b.icon}"/></svg>
        <span>${b.label}</span></div>`;
    }).join('');
    $('#badgeCount').textContent = BADGES.filter(b => b.on()).length + ' / 4';

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
    store.set(key, saved);
    renderMe();
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
      const pct = Math.min(cap * risk / 100 / (stop / 100) / cap * 100, mx);
      $('#cOut').textContent = (isNaN(pct) ? 0 : pct).toFixed(1) + '%';
      $('#cAmt').textContent = '约 ' + (cap * pct / 100).toFixed(1) + ' 万元 · 最大亏损 ' + (cap * pct / 100 * stop / 100).toFixed(2) + ' 万元';
    };
    ['cCap','cRisk','cStop','cMax'].forEach(id => $('#' + id).addEventListener('input', upd));
    upd();
    openSheet();
  });

  /* ================= 其他 ================= */
  $('#btnSim').addEventListener('click', () => { location.href = 'playbook.html#sandbox'; });
  $('#btnContinue').addEventListener('click', () => {
    const d = done();
    const next = COURSES.find(c => !d.includes(c.id)) || COURSES[0];
    openCourse(next.id);
  });

  $('#dailyTask').innerHTML = `
    <div style="font-size:13px;font-weight:700;margin-bottom:4px">读一根不属于你的 K 线</div>
    <div style="font-size:11.5px;color:var(--muted);line-height:1.7">随机出现，形态不告诉你。先在图上判断，再看解析——顺序反了就学不到东西。</div>
    <button class="btn btn-sm" style="margin-top:10px;background:var(--brand);color:#fff;border-color:var(--brand)" data-go2="train">去训练</button>`;
  $('#dailyTask').addEventListener('click', e => { if(e.target.dataset.go2) go('train'); });

  /* ================= 启动 ================= */
  const s0 = kb();
  $('#streakTop').textContent = Math.max(1, s0.best || 1);
  renderCourses();
  renderStage(0);
  updateAcc();
  renderMe();
  renderQ();
  renderTeachers();
  renderBasics();
  renderRank();
  renderDeaths();
  renderQuizCard();
  const lastTab = store.get('ta_tab', 'learn');
  go(location.hash === '#train' ? 'train' : lastTab);
  window.addEventListener('resize', () => { if($('#v-train').classList.contains('on')) drawK(); });
})();
