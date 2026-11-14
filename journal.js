/* ============================================================
   A股交易学院 · 复盘台（v12）
   ------------------------------------------------------------
   为什么单独做这一块：
     课程讲「应该怎么做」，训练场练「认不认得出来」，
     但真正决定长期结果的，是**每一笔交易有没有按自己写的规则执行**。
     这件事只能靠记录 —— 而且必须是当时记，不能事后补。

   一条刻意的取舍：**不算总收益，只算纪律分**。
     总收益受行情影响，纪律分不受。一个按规则亏钱的月份，
     纪律分应该很高；一个靠运气赚钱的月份，纪律分可能很低。
     如果这里只显示收益率，用户就会去优化收益率。

   数据：localStorage['ta_journal']，数组，最新在前。
     { id, sym, side, pct, pos, why, c(0-3 条纪律勾选), at }
   ============================================================ */
(function(){
  'use strict';

  const KEY = 'ta_journal';
  const MAX = 200;

  const read = () => {
    try{
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    }catch(e){ return []; }
  };
  const write = list => {
    try{ localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); }catch(e){}
  };

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');

  function num(v){
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function dayKey(){
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* ---------- 统计 ---------- */
  function stats(){
    const list = read();
    const n = list.length;
    const wins = list.filter(x => num(x.pct) > 0);
    const losses = list.filter(x => num(x.pct) < 0);
    const sum = list.reduce((a, b) => a + num(b.pct), 0);

    const avgW = wins.length ? wins.reduce((a, b) => a + num(b.pct), 0) / wins.length : 0;
    const avgL = losses.length ? Math.abs(losses.reduce((a, b) => a + num(b.pct), 0) / losses.length) : 0;
    /* 盈亏比：没有亏损样本时不给数字（∞ 会误导），返回 0 由界面显示「—」 */
    const pl = (avgL > 0 && avgW > 0) ? avgW / avgL : 0;

    const disc = n ? Math.round(list.reduce((a, b) => a + (b.c || 0), 0) / (n * 3) * 100) : 0;
    const slips = list.reduce((a, b) => a + (3 - (b.c || 0)), 0);

    return {
      n: n,
      winRate: n ? Math.round(wins.length / n * 100) : 0,
      avgW: avgW,
      avgL: avgL,
      pl: pl,
      disc: disc,
      slips: slips,
      sum: sum,
      lossStreak: (function(){
        let k = 0;
        for(const x of list){ if(num(x.pct) < 0) k++; else break; }
        return k;
      })()
    };
  }

  /* ---------- 渲染 ---------- */
  function paintHead(){
    const box = document.getElementById('jrHead');
    if(!box) return;
    const s = stats();
    box.innerHTML = [
      ['Trades', s.n, ''],
      ['Win %', s.n ? s.winRate : '—', ''],
      ['P/L', s.pl ? s.pl.toFixed(2) : '—', ''],
      ['Discipline', s.n ? s.disc : '—', s.n ? (s.disc >= 80 ? 'ok' : (s.disc < 50 ? 'bad' : '')) : '']
    ].map(([k, v, cls]) => `
      <div class="c">
        <div class="k">${k}</div>
        <div class="v ${cls}">${v}${k === 'Win %' && s.n ? '<small>%</small>' : ''}${k === 'Discipline' && s.n ? '<small>%</small>' : ''}</div>
      </div>`).join('');
  }

  function paintList(){
    const box = document.getElementById('jrList');
    if(!box) return;
    const list = read();

    if(!list.length){
      box.innerHTML = `
        <div class="jr-empty">
          <div class="b">还没有记录</div>
          <div class="s">第一笔可以是你上一笔真实交易，也可以是从案例库借来的一个场景。<br>先用三条纪律勾一遍，就知道自己平时在哪一步破功。</div>
        </div>`;
    }else{
      box.innerHTML = list.map(x => {
        const p = num(x.pct);
        const cls = p > 0 ? 'up' : (p < 0 ? 'down' : '');
        const sign = p > 0 ? '+' : '';
        const c = x.c || 0;
        return `
          <div class="jr-item" data-id="${esc(x.id)}">
            <button class="del" data-del="${esc(x.id)}" aria-label="删除这笔">×</button>
            <div class="l1">
              <span class="sym">${esc(x.sym)}<i class="${x.side === 'short' ? 'short' : 'long'}">${x.side === 'short' ? '反' : '多'}</i></span>
              <span class="pl ${cls}">${sign}${p.toFixed(1)}%</span>
            </div>
            <div class="l2">
              <span>${esc(x.at)}</span>
              <span>仓位 ${num(x.pos)}%</span>
              <span class="${c === 3 ? 'good' : 'bad'}">纪律 ${c}/3</span>
            </div>
            ${x.why ? `<div class="why">${esc(x.why)}</div>` : ''}
          </div>`;
      }).join('');
    }

    const cnt = document.getElementById('jrCount');
    if(cnt) cnt.textContent = list.length + ' 笔';
    const sub = document.getElementById('jrSub');
    if(sub) sub.textContent = list.length ? ('共 ' + list.length + ' 笔 · 违规 ' + stats().slips + ' 项') : '最近的在前';
    const rail = document.getElementById('railJr');
    if(rail) rail.innerHTML = list.length + '<small>笔</small>';
  }

  function tip(msg, bad){
    const form = document.getElementById('jrF');
    if(!form) return;
    let el = document.getElementById('jrTip');
    if(!el){
      el = document.createElement('div');
      el.id = 'jrTip';
      el.className = 'jr-tip';
      form.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'jr-tip on' + (bad ? ' bad' : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = 'jr-tip'; }, 2600);
  }

  function clearForm(){
    ['jrSym','jrPct','jrPos','jrWhy'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = '';
    });
    ['jrC1','jrC2','jrC3'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.checked = false;
    });
  }

  /* ---------- 挂载 ---------- */
  let bound = false;
  function mount(){
    paintHead();
    paintList();
    if(bound) return;
    bound = true;

    const form = document.getElementById('jrF');
    if(form){
      form.addEventListener('submit', e => {
        e.preventDefault();
        const sym = (document.getElementById('jrSym').value || '').trim();
        const pctRaw = document.getElementById('jrPct').value;
        if(!sym){ tip('先填标的代号', true); return; }
        if(pctRaw === '' || !isFinite(parseFloat(pctRaw))){ tip('这笔结果要填一个数字（%），亏损写负数', true); return; }

        const item = {
          id: 'j' + Date.now().toString(36),
          sym: sym.slice(0, 12),
          side: document.getElementById('jrSide').value,
          pct: num(pctRaw),
          pos: num(document.getElementById('jrPos').value),
          why: (document.getElementById('jrWhy').value || '').trim().slice(0, 60),
          c: ['jrC1','jrC2','jrC3'].filter(id => document.getElementById(id).checked).length,
          at: dayKey()
        };
        const list = read();
        list.unshift(item);
        write(list);
        clearForm();
        paintHead(); paintList();
        tip(item.c === 3 ? '记下了 · 三条纪律全做到' : ('记下了 · 这次漏了 ' + (3 - item.c) + ' 条纪律'));
        document.getElementById('jrSym').focus();
      });
    }

    const list = document.getElementById('jrList');
    if(list){
      list.addEventListener('click', e => {
        const b = e.target.closest('[data-del]');
        if(!b) return;
        const id = b.dataset.del;
        const rest = read().filter(x => x.id !== id);
        write(rest);
        paintHead(); paintList();
      });
    }

    const rs = document.getElementById('jrReset');
    if(rs) rs.addEventListener('click', clearForm);
  }

  window.JOURNAL = { mount: mount, stats: stats, count: () => read().length };
})();
