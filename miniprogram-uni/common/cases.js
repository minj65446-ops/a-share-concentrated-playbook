/**
 * K 线训练题库（小程序端）
 * 由 Web 端 trade-academy/cases.js 自动生成，请勿手改。
 * ------------------------------------------------------------
 * · 每题的 K 线是合成数据，不映射任何真实标的
 * · 每次 build(i) 都会换一套随机路径（salt），同题型不会重复出同一张图
 * · 选项每次洗牌，正确答案的字母不固定，防止背答案
 */
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

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

  /* 出题盐值：build() 前被 buildOne 改写，sd() 把所有写死的 seed 整体搬走 */
  let seedSalt = 0;
  const sd = base => (base + seedSalt * 7919) >>> 0;

  const mx = (arr, f) => { let m = -Infinity; arr.forEach(x => { const v = f(x); if(v > m) m = v; }); return m; };
  const mn = (arr, f) => { let m = Infinity; arr.forEach(x => { const v = f(x); if(v < m) m = v; }); return m; };
  const av = arr => { let s = 0; arr.forEach(x => s += x); return s / arr.length; };
  const argmn = arr => { let k = 0; for(let i=1;i<arr.length;i++) if(arr[i].l < arr[k].l) k = i; return k; };
  const argmx = arr => { let k = 0; for(let i=1;i<arr.length;i++) if(arr[i].h > arr[k].h) k = i; return k; };

  const CASES = [
    { title:'放量突破前高', q:'图上标了三个位置，哪个才是符合系统的买点？',
      build(){
        const a  = seg(30, 20, 0.0035, 0.012, sd(101));
        const high = mx(a, x => x.h);
        const b2 = seg(12, a[a.length-1].c, -0.002, 0.010, sd(202));
        const c3 = seg(5,  b2[b2.length-1].c, 0.014, 0.009, sd(303), 2.6);
        const d4 = seg(9,  c3[c3.length-1].c, -0.003, 0.008, sd(404));
        const bars = a.concat(b2, c3, d4);
        const base = b2[b2.length-1].c;
        const lo = argmn(d4);
        const bi = 47 + Math.min(lo, 6);
        const v = { high: high, brk: mx(c3, x => x.h), back: mn(d4, x => x.l), base: base };
        return { bars: bars, _v: v, marks:[{i:41, label:'A'}, {i:bi, label:'B'}, {i:Math.min(55, bi+4), label:'C'}],
          opts:[
            {k:'A', t:'A：突破前一天潜伏，成本最低'},
            {k:'B', t:'B：突破后回踩不破，确认再加仓'},
            {k:'C', t:'C：突破后过几天，趋势已经确立'}
          ], ans:'B',
          why:'突破当天买，最大的风险是假突破——放量冲高再砸回来，你连反应时间都没有。等回踩确认不破，成本高 2%–3%，但把「假突破」这个最大的亏损来源过滤掉了。等到加速段再追的问题是：止损位离得太远，同样的风险预算能买到的股数更少，风险收益比反而更差。' };
      },
      check(c){ const v = c._v; return v.brk > v.high && v.back < v.brk && v.back > v.base * 0.94; } },

    { title:'高位放量长上影', q:'这根长上影出现后，系统的动作是什么？',
      build(){
        const a = seg(32, 15, 0.005, 0.011, sd(505));
        const last = a[a.length-1].c;
        const spike = { o:last, c:last*1.004, h:last*1.062, l:last*0.996, v:3.4 };
        a.push(spike);
        const b2 = seg(12, spike.c, -0.004, 0.010, sd(606));
        const v = { rise: last / a[0].c, top: spike.h, prevHi: mx(a.slice(0, 32), x => x.h),
                    end: b2[b2.length-1].c / spike.c };
        return { bars: a.concat(b2), _v: v, marks:[{i:24, label:'A'}, {i:32, label:'B'}, {i:40, label:'C'}],
          opts:[
            {k:'A', t:'A：上涨途中，趋势完好，继续持有'},
            {k:'B', t:'B：长上影当天，放量滞涨，减仓一半'},
            {k:'C', t:'C：后面跌了再说，等跌破均线'}
          ], ans:'B',
          why:'连续上涨后出现放量长上影，说明当天有大量资金在更高价位出货——买盘接不住。这是趋势可能转折的第一个信号，不是确认，所以动作是「减仓」而不是「清仓」：留着底仓看后续，但先把大部分利润锁住。等跌破均线才走，等于把浮盈全部还回去。' };
      },
      check(c){ const v = c._v; return v.rise > 1.10 && v.top > v.prevHi && v.end < 0.99; } },

    { title:'跌破颈线', q:'形态已经走坏，图上哪个位置是必须离场的点？',
      build(){
        const a  = seg(18, 12, 0.006, 0.010, sd(707));
        const b2 = seg(10, a[a.length-1].c, -0.005, 0.009, sd(808));
        const c3 = seg(12, b2[b2.length-1].c, 0.005, 0.009, sd(909));
        const d4 = seg(12, c3[c3.length-1].c, -0.012, 0.010, sd(111));
        const neck = mn(b2, x => x.l);
        const bars = a.concat(b2, c3, d4);
        const h1 = mx(a, x => x.h), h2 = mx(c3, x => x.h);
        const ai = 28 + argmx(c3);
        let bi = -1;
        for(let i=0;i<d4.length;i++){ if(d4[i].c < neck){ bi = 40 + i; break; } }
        const broke = bi >= 0;
        if(bi < 0) bi = 45;
        const v = { h1: h1, h2: h2, neck: neck, rec: c3[c3.length-1].c / b2[b2.length-1].c,
                    broke: broke };
        return { bars: bars, _v: v, neck: neck,
          marks:[{i:ai, label:'A'}, {i:Math.min(49, bi), label:'B'}, {i:51, label:'C'}],
          opts:[
            {k:'A', t:'A：第二个头，还没跌破，先观察'},
            {k:'B', t:'B：跌破颈线放量，清仓'},
            {k:'C', t:'C：跌了这么多，等反弹再说'}
          ], ans:'B',
          why:'双头形态的颈线是这套形态的「逻辑边界」。跌破颈线且放量，说明前一个头部的买盘全部被套，抛压会自我强化。「等反弹再走」是最典型的错误——反弹永远不来，或者来了也到不了你的成本。' };
      },
      check(c){ const v = c._v; return v.broke && v.rec > 1.03 && v.h2 < v.h1 * 1.06 && v.h2 > v.h1 * 0.84; } },

    { title:'缩量阴跌', q:'这段走势里，系统应该做什么？',
      build(){
        const a1 = seg(14, 26, -0.008, 0.008, sd(121), 1.5);
        const a2 = seg(26, a1[a1.length-1].c, -0.004, 0.006, sd(122), 0.35);
        const bars = a1.concat(a2);
        const v = { drop: bars[bars.length-1].c / bars[0].c,
                    vH: mx(a1, x => x.v), vL: mx(a2, x => x.v) };
        return { bars: bars, _v: v, marks:[{i:5, label:'A'}, {i:22, label:'B'}, {i:36, label:'C'}],
          opts:[
            {k:'A', t:'A：跌了很多，估值便宜了，抄底'},
            {k:'B', t:'B：量已经缩到很小，抛压减弱，埋伏'},
            {k:'C', t:'C：不参与，没有买点'}
          ], ans:'C',
          why:'看图上的量柱：从左边到右边一波比一波矮，但价格还在往下走。这不是「抛压减弱」，是「没人接盘」——没有放量的下跌，说明卖的人还没卖完，买的人还在观望，这种走势可以持续很久。系统的买点需要「放量 + 结构确认」，两个条件一个都没满足，正确动作是空仓等待。' };
      },
      check(c){ const v = c._v; return v.drop < 0.86 && v.vL < v.vH * 0.45; } },

    { title:'回踩均线不破', q:'上升趋势中的这次回踩，哪个位置可以加仓？',
      build(){
        const a  = seg(34, 18, 0.0045, 0.011, sd(131));
        const b2 = seg(8,  a[a.length-1].c, -0.006, 0.008, sd(141));
        const c3 = seg(14, b2[b2.length-1].c, 0.006, 0.010, sd(151));
        const top = a[a.length-1].c;
        const pbLow = mn(b2, x => x.l);
        const v = { up: top / a[0].c, pb: pbLow / top, rec: c3[c3.length-1].c / pbLow };
        return { bars: a.concat(b2, c3), _v: v,
          marks:[{i:38, label:'A'}, {i:43, label:'B'}, {i:50, label:'C'}],
          opts:[
            {k:'A', t:'A：刚开始跌，先减仓避险'},
            {k:'B', t:'B：回踩均线缩量止跌，加仓'},
            {k:'C', t:'C：等它创新高再追'}
          ], ans:'B',
          why:'上升趋势里的回踩是机会，前提是「缩量 + 不破关键均线」。这两个条件同时满足，说明只是获利盘兑现，趋势结构没坏。一跌就减仓是过度反应；等创新高再追，则是把最好的成本让给了别人。加仓后立刻把止损上移到回踩低点下方——这才是完整动作。' };
      },
      check(c){ const v = c._v; return v.up > 1.08 && v.pb > 0.86 && v.pb < 0.98 && v.rec > 1.05; } },

    { title:'无量反弹到前高', q:'反弹到前高附近但没有量，该怎么做？',
      build(){
        const a  = seg(24, 30, 0.004, 0.010, sd(161));
        const b2 = seg(14, a[a.length-1].c, -0.010, 0.009, sd(171));
        const c3 = seg(14, b2[b2.length-1].c, 0.008, 0.006, sd(181), 0.5);
        const ai = 38 + Math.min(argmx(c3), 10);
        const v = { prevHi: mx(a, x => x.h), rbHi: mx(c3, x => x.h),
                    vA: av(a.map(x => x.v)), vR: av(c3.map(x => x.v)) };
        return { bars: a.concat(b2, c3), _v: v,
          marks:[{i:ai, label:'A'}, {i:ai+2, label:'B'}, {i:51, label:'C'}],
          opts:[
            {k:'A', t:'A：前高附近是压力位，减仓或观望'},
            {k:'B', t:'B：反弹有力，趋势反转，买入'},
            {k:'C', t:'C：等突破前高再说'}
          ], ans:'A',
          why:'反弹到前高但成交量明显萎缩（对比左边那波上涨的量柱），说明推动这波反弹的资金量远小于上一波——这是「反抽」而不是「反转」。前高是套牢盘最密集的位置，无量上攻基本等于送人头。正确做法是在压力位减仓：真突破了再买回来，也只贵几个点。' };
      },
      check(c){ const v = c._v; return v.rbHi < v.prevHi * 1.02 && v.rbHi > v.prevHi * 0.88 && v.vR < v.vA * 0.62; } },

    { title:'箱体震荡', q:'价格在箱体内来回震荡了很久，系统应该怎么做？',
      build(){
        const b1 = seg(9, 20, 0.010, 0.006, sd(191));
        const b2 = seg(9, b1[b1.length-1].c, -0.010, 0.006, sd(192));
        const b3 = seg(9, b2[b2.length-1].c, 0.010, 0.006, sd(193));
        const b4 = seg(9, b3[b3.length-1].c, -0.010, 0.006, sd(194));
        const bars = b1.concat(b2, b3, b4);
        const top = mx(bars, x => x.h), bot = mn(bars, x => x.l);
        const v = { w: top / bot, last: bars[bars.length-1].c, top: top, bot: bot };
        return { bars: bars, _v: v, marks:[{i:8, label:'A'}, {i:20, label:'B'}, {i:32, label:'C'}],
          opts:[
            {k:'A', t:'A：在下沿附近分批买，做箱体高抛低吸'},
            {k:'B', t:'B：不参与，等放量突破上沿再说'},
            {k:'C', t:'C：先买一半，突破再加仓'}
          ], ans:'B',
          why:'箱体里的每一次「低吸」，都是在赌它这次不会破位。赌对了赚几个点，赌错了就是一个月的震荡白干，还要搭上一次止损。集中投资只做大概率的方向性机会：箱体内没有方向，所以没有买点。等放量突破上沿，方向出现了，再按新信号进场——贵一点，但赢面完全不同。' };
      },
      check(c){ const v = c._v; return v.w < 1.28 && v.last < v.top * 0.99 && v.last > v.bot * 1.01; } },

    { title:'利好高开低走', q:'利好落地当天高开冲高回落，系统的动作是？',
      build(){
        const a = seg(20, 22, 0.003, 0.009, sd(211));
        const last = a[a.length-1].c;
        const gap = { o:last*1.055, c:last*1.004, h:last*1.078, l:last*0.997, v:3.2 };
        a.push(gap);
        const b2 = seg(12, gap.c, -0.005, 0.010, sd(212));
        const v = { gapOpen: gap.o / last, close: gap.c / gap.o, end: b2[b2.length-1].c / gap.o };
        return { bars: a.concat(b2), _v: v, marks:[{i:14, label:'A'}, {i:20, label:'B'}, {i:29, label:'C'}],
          opts:[
            {k:'A', t:'A：利好兑现，冲高回落，减仓'},
            {k:'B', t:'B：利好还在，回落是洗盘，加仓'},
            {k:'C', t:'C：不动，看明天再说'}
          ], ans:'A',
          why:'利好落地当天高开冲高回落，是最典型的「消息出尽」：想买的人在开盘那一刻已经全买完了，剩下的只有获利盘在卖。判断依据不是消息好不好，而是价格对消息的反应——好消息出来却涨不动，本身就是最强的负面信号。减仓不等于看空这家公司，只是承认「这段预期的钱已经被别人赚走了」。' };
      },
      check(c){ const v = c._v; return v.gapOpen > 1.03 && v.close < 1.0 && v.end < 0.98; } },

    { title:'止损后重新站回', q:'你按规则止损离场后，它放量重新站回关键位，下一步怎么办？',
      build(){
        const a  = seg(20, 18, 0.005, 0.010, sd(221));
        const b2 = seg(10, a[a.length-1].c, -0.012, 0.009, sd(222));
        const c3 = seg(12, b2[b2.length-1].c, 0.011, 0.009, sd(223), 2.2);
        const top = a[a.length-1].c;
        const v = { broke: mn(b2, x => x.l) / top, top: top,
                    back: c3[c3.length-1].c / top, vR: av(c3.map(x => x.v)), vA: av(a.map(x => x.v)) };
        return { bars: a.concat(b2, c3), _v: v, marks:[{i:19, label:'A'}, {i:29, label:'B'}, {i:38, label:'C'}],
          opts:[
            {k:'A', t:'A：被扫过一次说明我看错了，这只票不碰了'},
            {k:'B', t:'B：按新信号重新买回，仓位重新算一遍'},
            {k:'C', t:'C：加倍买回来，把上次亏的赚回来'}
          ], ans:'B',
          why:'止损和买入是两件独立的事。上一次止损，只说明上一次的入场条件被证伪了，不代表这只票被永久拉黑——只要它重新满足入场条件，就该按新信号重新买，仓位按新的止损位重算。赌气不碰，是把规则变成了情绪；加倍买回来，是把两笔交易混成一笔，风险预算直接翻倍。' };
      },
      check(c){ const v = c._v; return v.broke < 0.93 && v.back > 1.0 && v.vR > v.vA * 1.4; } },

    { title:'加速赶顶', q:'前面慢慢涨了很久，最近几天开始加速，系统应该？',
      build(){
        const a  = seg(22, 16, 0.005, 0.008, sd(231));
        const b2 = seg(8,  a[a.length-1].c, 0.018, 0.012, sd(232), 2.8);
        const v = { rise: a[a.length-1].c / a[0].c, accel: b2[b2.length-1].c / a[a.length-1].c,
                    vB: av(b2.map(x => x.v)), vA: av(a.map(x => x.v)) };
        return { bars: a.concat(b2), _v: v, marks:[{i:16, label:'A'}, {i:22, label:'B'}, {i:27, label:'C'}],
          opts:[
            {k:'A', t:'A：趋势最强的时候，加仓追'},
            {k:'B', t:'B：加速段不新开仓，已有的仓位上移止盈'},
            {k:'C', t:'C：涨这么快肯定要见顶，清仓'}
          ], ans:'B',
          why:'加速段是最容易让人上头的地方：涨幅最猛、账户最好看、身边的人也开始问你买了什么。但它同时也是风险收益比最差的地方——斜率越陡，止损位离得越远，一旦回落幅度也越大。正确动作不是猜顶（C 是拿猜测代替规则），而是在加速段停止新开仓，把已有仓位的止盈线跟着往上抬，让它自己走完。' };
      },
      check(c){ const v = c._v; return v.rise > 1.08 && v.accel > 1.12 && v.vB > v.vA * 1.4; } }
  ];

  /* 重新编号：把 A/B/C 随机分配给三个语义位置
     —— opts 和 marks 用同一套编号，所以「图上 B 点」永远对应「选项 B」；
     —— 列表顺序再洗一次，避免正确答案总排在同一个位置。
     解析文案里不出现字母，所以怎么编号都读得通。 */
  const LETTERS = ['A','B','C','D','E','F','G'];
  function shuf(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = (Math.random() * (i+1)) | 0;
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function relabel(c){
    const n = c.opts.length;
    const letters = shuf(LETTERS.slice(0, n));
    const ansIdx = LETTERS.indexOf(c.ans);
    const out = c.opts.map((o, j) => ({
      k: letters[j],
      t: letters[j] + '：' + String(o.t).replace(/^[A-G]：/, '')
    }));
    if(c.marks && c.marks.length === n){
      c.marks = c.marks.map((m, j) => ({ i: m.i, label: letters[j] }));
    }
    c.opts = shuf(out);              // 打散「正确答案总在第 2 个」的位置偏见
    c.ans = letters[ansIdx < 0 ? 0 : ansIdx];
  }

  /* 出第 i 题：换 salt 重画直到形态合格，再重新编号 */
  function buildOne(i){
    const meta = CASES[i % CASES.length];
    let c = null, okSalt = 0;
    for(let t=0;t<24;t++){
      seedSalt = ((Math.random() * 1e6) | 0) + 1;
      c = meta.build();
      if(!meta.check || meta.check(c)){ okSalt = seedSalt; break; }
    }
    if(!okSalt){ seedSalt = 0; c = meta.build(); }

    relabel(c);
    c.title = meta.title;
    c.q = meta.q;
    c.no = (i % CASES.length) + 1;
    c.total = CASES.length;
    delete c._v;
    return c;
  }
export { rng, seg }
export const cases = CASES
export const size = CASES.length
export const build = buildOne
export const buildCase = buildOne
export default CASES
