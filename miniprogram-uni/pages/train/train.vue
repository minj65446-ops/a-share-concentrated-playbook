<template>
  <view class="page" :class="themeCls">
    <view class="sec-title">
      <view class="h">训练场</view>
      <view class="s">{{ accText }}</view>
    </view>

    <!-- 答题卡：一次十题（v8）。K 线考认形态，这里考记没记住 -->
    <view class="quizcard">
      <view class="qzhead">
        <view class="qt">{{ qzTitle }}</view>
        <text class="pill brand" v-if="qz.mode === 'run'">{{ qz.i + 1 }}/{{ qz.qs.length }} · 连对 {{ qz.combo }}</text>
      </view>
      <view class="qzprog" v-if="qz.mode === 'run'">
        <view class="fi" :style="{ width: (qz.i / qz.qs.length * 100) + '%' }"></view>
      </view>

      <!-- 待开始 -->
      <block v-if="qz.mode === 'idle'">
        <view class="qzdesc">十题一组，答错的会自动回到下一组。题不算难，但多数人会在同一处记反——所以每道题都写了「容易记反的那一点」。</view>
        <view class="qzrow">
          <view class="btn primary" @click="startCards">开始今天的 10 题</view>
        </view>
        <view class="qzrow" v-if="weakCount > 0">
          <view class="btn ghost" @click="startCards(true)">只练错题（{{ weakCount }}）</view>
        </view>
        <view class="qzmeta">已掌握 {{ mast.solid }} / {{ CARDS.size }} 张 · 生疏 {{ mast.weak }} 张</view>
      </block>

      <!-- 答题中 -->
      <block v-if="qz.mode === 'run' && qzQ">
        <view class="qtag">
          <text class="pill">{{ qzQ.g }}</text>
          <text class="pill">{{ qzQ.tag }}</text>
          <text class="pill up" v-if="qzQ.weak">上次答错</text>
        </view>
        <view class="qqt">{{ qzQ.q }}</view>

        <view class="copt" v-for="(o, i) in qzQ.opts" :key="i"
              :class="coptClass(i)" @click="pickOpt(i)">
          <view class="kb">{{ LETTERS[i] }}</view>
          <view class="ot">{{ o }}</view>
        </view>

        <view class="cfb" v-if="qz.done" :class="qzRight ? 'ok' : 'no'">
          <view class="fb1">{{ qzRight ? '对。' : '不对。' }}</view>
          <view class="fb2">{{ qzQ.why }}</view>
          <view class="trap"><text class="b">容易记反：</text>{{ qzQ.trap }}</view>
          <view class="btn primary mt" @click="nextCard">{{ qz.i === qz.qs.length - 1 ? '看本组结果' : '下一题' }}</view>
        </view>
        <view class="qzquit" v-if="!qz.done" @click="quitCards">先不做了</view>
      </block>

      <!-- 结算 -->
      <block v-if="qz.mode === 'done'">
        <view class="qzstat">{{ qz.right }} / {{ qz.qs.length }}</view>
        <view class="qzstatl">本组正确率 {{ Math.round(qz.right / qz.qs.length * 100) }}%{{ qz.combo >= 3 ? ' · 连对 ' + qz.combo : '' }}</view>
        <view class="qzrow">
          <view class="btn primary" @click="startCards(false)">再来一组</view>
        </view>
        <view class="qzrow" v-if="weakCount > 0">
          <view class="btn ghost" @click="startCards(true)">只练错题（{{ weakCount }}）</view>
        </view>
      </block>
    </view>

    <view class="grid">
      <view class="tcard" v-for="t in tools" :key="t.k" @click="onTool(t)">
        <view class="ic">{{ t.s }}</view>
        <view class="tt">{{ t.t }}</view>
        <view class="td">{{ t.d }}</view>
      </view>
    </view>

    <view class="card trainer">
      <view class="head">
        <view>
          <view class="h3">{{ qa.title }}</view>
          <view class="q">{{ qa.q }}</view>
        </view>
        <text class="pill brand">{{ idx + 1 }}/{{ total }} · 连对 {{ streak }}</text>
      </view>

      <canvas canvas-id="kline" id="kline" class="kbox" @touchstart="onTap"></canvas>

      <view class="opt" v-for="o in qa.opts" :key="o.k"
            :class="resultClass(o.k)" @click="answer(o.k)">
        <view class="kb">{{ o.k }}</view>
        <view class="ot">{{ o.t }}</view>
      </view>

      <view class="explain" v-if="answered">
        <text class="b">{{ lastOK ? '对。' : '不对，正确答案是 ' + qa.ans + '。' }}</text>{{ qa.why }}
      </view>

      <view class="btn primary mt" @click="next">下一题</view>
    </view>

    <view class="tip">图中走势为合成教学数据，不对应任何真实股票。</view>
  </view>
</template>

<script>
import { buildCase, size } from '../../common/cases.js'
import { canvas as canvasColors } from '../../common/theme.js'
import { list as CARDS, size as CARD_SIZE } from '../../common/cards.js'
import {
  SESSION, LETTERS, toQuestion, buildSession, weakIds
} from '../../common/srs.js'
import {
  store, readProf, addXp, touch, markCard, cardStat, mastery, levelOf
} from '../../common/learn.js'

/* 经验值口径与 Web 端一致（learn.js 里那份 XP 表），
   这里只取用得到的几项，避免把整张表抄一遍又漂移 */
const XP_CARD = 15
const XP_SESSION = 50

const dayKey = () => {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

export default {
  data() {
    return {
      theme: 'light',
      tools: [
        { k: 'k', s: 'K', t: 'K线读图', d: '在图上找买卖点' },
        { k: 'c', s: '仓', t: '仓位计算', d: '先算能亏多少' },
        { k: 's', s: '盘', t: '模拟盘', d: '用虚拟账户试错' },
        { k: 'm', s: '期', t: '情绪周期', d: '几成仓看阶段' }
      ],
      idx: 0, qa: {}, answered: false, lastOK: false, pick: '',
      total: size,
      streak: 0, stats: { total: 0, right: 0 },

      /* ---- 答题卡 ---- */
      CARDS, LETTERS,
      /* QZ 只放内存：一组三分钟，关掉就重来。
         半场回来人已经不记得第几题，续着答反而更乱。 */
      qz: { mode: 'idle', qs: [], i: 0, combo: 0, right: 0, pick: -1, done: false, weakOnly: false },
      weakCount: 0,
      mast: { solid: 0, weak: 0, pct: 0 }
    }
  },
  computed: {
    themeCls() { return 't-' + this.theme },

    accText() {
      const s = this.stats
      return s.total ? '正确率 ' + Math.round(s.right / s.total * 100) + '%（' + s.right + '/' + s.total + '）' : '正确率 —'
    },
    qzQ() {
      return this.qz.qs[this.qz.i] || null
    },
    qzRight() {
      return !!(this.qzQ && this.qz.pick === this.qzQ.ans)
    },
    qzTitle() {
      if (this.qz.mode === 'run') return this.qz.weakOnly ? '错题重练' : '概念卡'
      if (this.qz.mode === 'done') return '这一组做完了'
      return '概念卡 · 一次十题'
    }
  },
  onLoad() {
    const s = uni.getStorageSync('ta_kline')
    if (s) this.stats = { total: s.total || 0, right: s.right || 0 }
    this.streak = (uni.getStorageSync('ta_kline') || {}).streak || 0
    this.load(0)
    this.syncCards()
  },
  onReady() { this.$nextTick(() => this.draw()) },
  onShow() {
    let v = uni.getStorageSync('ta_theme') || 'light'
    if (v.charAt(0) === '"') { try { v = JSON.parse(v) } catch (e) { v = 'light' } }
    this.theme = v
    this.syncCards()
  },
  methods: {
    /* ---- 答题卡 ---- */
    syncCards() {
      const ids = weakIds(CARDS, id => cardStat(store, id))
      this.weakCount = ids.length
      this.mast = mastery(store, CARD_SIZE)
    },
    startCards(weakOnly) {
      /* 第三个参数是「只从这些 id 里抽」，传 weakIds 的结果而不是 true */
      const only = weakOnly ? weakIds(CARDS, id => cardStat(store, id)) : null
      const qs = buildSession(CARDS, id => cardStat(store, id), SESSION, only)
      if (!qs.length) {
        uni.showToast({ title: '还没有错题，先去答一组', icon: 'none' })
        return
      }
      this.qz = { mode: 'run', qs, i: 0, combo: 0, right: 0, pick: -1, done: false, weakOnly: !!weakOnly }
    },
    coptClass(i) {
      if (!this.qz.done || !this.qzQ) return ''
      if (this.LETTERS[i] === this.qzQ.ans) return 'right'
      if (i === this.qz.pick) return 'wrong'
      return ''
    },
    pickOpt(i) {
      if (this.qz.done || !this.qzQ) return
      const q = this.qzQ
      const ok = this.LETTERS[i] === q.ans
      this.qz.pick = i
      this.qz.done = true

      if (ok) { this.qz.right++; this.qz.combo++ } else { this.qz.combo = 0 }

      /* 掌握度：答对两次算掌握，答错一次掉回生疏 —— 规则在 learn.js 里，这里只调用 */
      markCard(store, q.id, ok)
      /* 今天的「答 1 张概念卡」用得是这个计数 */
      const tc = store.get('ta_today_c', { d: '', n: 0 })
      const t = dayKey()
      store.set('ta_today_c', { d: t, n: (tc.d === t ? tc.n : 0) + 1 })

      if (ok) addXp(store, XP_CARD, '答对概念卡')
      else touch(store)
    },
    nextCard() {
      if (this.qz.i === this.qz.qs.length - 1) {
        /* 清完一组给一次结算奖励，奖励「做完」而不是「做对」 */
        addXp(store, XP_SESSION, '清完一组')
        const cs = store.get('ta_cardstat', { total: 0, right: 0, combo: 0, bestCombo: 0, sessions: 0 })
        cs.total += this.qz.qs.length
        cs.right += this.qz.right
        cs.bestCombo = Math.max(cs.bestCombo || 0, this.qz.combo)
        cs.sessions = (cs.sessions || 0) + 1
        store.set('ta_cardstat', cs)
        this.qz.mode = 'done'
        this.qz.done = true
        this.syncCards()
        return
      }
      this.qz.i++
      this.qz.pick = -1
      this.qz.done = false
    },
    quitCards() {
      this.qz = { mode: 'idle', qs: [], i: 0, combo: 0, right: 0, pick: -1, done: false, weakOnly: false }
      this.syncCards()
    },

    load(i) {
      this.idx = i
      this.qa = buildCase(i)
      this.answered = false
      this.lastOK = false
      this.pick = ''
      this.$nextTick(() => this.draw())
    },
    next() { this.load((this.idx + 1) % size) },
    resultClass(k) {
      if (!this.answered) return ''
      if (k === this.qa.ans) return 'right'
      if (k === this.pick) return 'wrong'
      return ''
    },
    answer(k) {
      if (this.answered) return
      this.answered = true
      this.pick = k
      const ok = k === this.qa.ans
      this.lastOK = ok
      this.stats.total++
      if (ok) { this.stats.right++; this.streak++ } else { this.streak = 0 }
      uni.setStorageSync('ta_kline', {
        total: this.stats.total, right: this.stats.right, streak: this.streak
      })
    },
    onTap(e) {
      if (this.answered) return
      const x = e.touches[0].x
      const bars = this.qa.bars
      const w = this.w || 300
      const padL = 6, padR = 6
      const iw = (w - padL - padR) / bars.length
      const idx = (x - padL) / iw
      let best = null, bd = 99
      this.qa.marks.forEach(m => {
        const d = Math.abs(m.i - idx)
        if (d < bd) { bd = d; best = m }
      })
      if (best && bd < 3) this.answer(best.label)
    },
    draw() {
      const q = uni.createSelectorQuery().in(this)
      q.select('#kline').boundingClientRect(rect => {
        if (!rect) return
        this.w = rect.width
        this.paint(rect.width, rect.height)
      }).exec()
    },
    paint(w, h) {
      const bars = this.qa.bars
      if (!bars || !bars.length) return
      const ctx = uni.createCanvasContext('kline', this)
      const padL = 6, padR = 6, padT = 18, volH = 34
      const chartH = h - padT - volH - 18
      const iw = (w - padL - padR) / bars.length
      const CC = canvasColors(this.theme)
      const bw = Math.max(2, iw * 0.62)

      let hi = -Infinity, lo = Infinity
      bars.forEach(b => { if (b.h > hi) hi = b.h; if (b.l < lo) lo = b.l })
      const pad = (hi - lo) * 0.08 || 0.5
      hi += pad; lo -= pad
      const Y = v => padT + (hi - v) / (hi - lo) * chartH
      const X = i => padL + iw * i + iw / 2

      ctx.setFillStyle(CC.bg)
      ctx.fillRect(0, 0, w, h)

      // 网格
      ctx.setStrokeStyle(CC.grid)
      ctx.setLineWidth(1)
      for (let i = 0; i <= 3; i++) {
        const y = padT + chartH / 3 * i
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke()
      }

      // 成交量
      let vmax = 0
      bars.forEach(b => { if (b.v > vmax) vmax = b.v })
      bars.forEach((b, i) => {
        const bh = Math.max(1, b.v / vmax * volH)
        ctx.setFillStyle(b.c >= b.o ? CC.volUp : CC.volDown)
        ctx.fillRect(X(i) - bw / 2, h - 12 - bh, bw, bh)
      })

      // K线
      bars.forEach((b, i) => {
        const up = b.c >= b.o
        const col = up ? CC.up : CC.down
        ctx.setStrokeStyle(col)
        ctx.setFillStyle(col)
        ctx.setLineWidth(1)
        ctx.beginPath(); ctx.moveTo(X(i), Y(b.h)); ctx.lineTo(X(i), Y(b.l)); ctx.stroke()
        const y1 = Y(Math.max(b.o, b.c)), y2 = Y(Math.min(b.o, b.c))
        ctx.fillRect(X(i) - bw / 2, y1, bw, Math.max(1.5, y2 - y1))
      })

      // 颈线（双头那类题）
      if (this.qa.neck) {
        ctx.setStrokeStyle(CC.axis)
        ctx.setLineWidth(1)
        const y = Y(this.qa.neck)
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke()
        ctx.setLineDash([])
      }

      // 标记
      this.qa.marks.forEach(m => {
        const x = X(m.i)
        ctx.setStrokeStyle(CC.mark)
        ctx.setLineWidth(1)
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, h - 12); ctx.stroke()

        ctx.setFillStyle(CC.lab)
        ctx.beginPath(); ctx.arc(x, padT - 4, 10, 0, Math.PI * 2); ctx.fill()

        ctx.setFillStyle(CC.labInk)
        ctx.setFontSize(11)
        ctx.setTextAlign('center')
        ctx.fillText(m.label, x, padT)
      })

      ctx.draw()
    },
    onTool(t) {
      if (t.k === 'm') return uni.switchTab({ url: '/pages/map/map' })
      uni.showToast({ title: t.t + '：Web 端已实现', icon: 'none' })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 答题卡 */
.quizcard {
  background: var(--card); border: 1rpx solid var(--line);
  border-radius: var(--r-lg); padding: 30rpx; margin-bottom: 24rpx;
  box-shadow: var(--shadow-sm);
}
.qzhead { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.qt { font-size: 30rpx; font-weight: 800; letter-spacing: -.4rpx; }
.qzprog { height: 8rpx; background: var(--bg-2); border-radius: 5rpx; margin-top: 18rpx; overflow: hidden; }
.qzprog .fi { height: 100%; background: var(--brand); border-radius: 5rpx; }
.qzdesc { font-size: 23rpx; color: var(--ink-2); line-height: 1.75; margin-top: 18rpx; }
.qzrow { margin-top: 18rpx; }
.qzrow .btn { width: 100%; }
.qzmeta { font-size: 21rpx; color: var(--muted); margin-top: 16rpx; text-align: center; }

.qtag { display: flex; gap: 10rpx; margin-top: 20rpx; flex-wrap: wrap; }
.qqt { font-size: 30rpx; font-weight: 750; line-height: 1.55; margin-top: 18rpx; letter-spacing: -.3rpx; }
.copt {
  display: flex; align-items: center; gap: 18rpx;
  border: 1rpx solid var(--line); border-radius: var(--r-sm);
  padding: 22rpx; margin-top: 14rpx; background: var(--card);
}
.copt .kb {
  width: 44rpx; height: 44rpx; border-radius: 12rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; font-weight: 700; background: var(--bg-2); color: var(--ink-2);
}
.copt .ot { font-size: 25rpx; line-height: 1.55; }
.copt.right { border-color: var(--down); background: var(--down-soft); }
.copt.right .kb { background: var(--down); color: #fff; }
.copt.wrong { border-color: var(--up); background: var(--up-soft); }
.copt.wrong .kb { background: var(--up); color: #fff; }

.cfb {
  margin-top: 24rpx; padding: 24rpx; border-radius: var(--r-sm);
  border: 1rpx solid var(--brand-line); background: var(--brand-soft);
}
.cfb.ok { border-color: var(--ok-line); background: var(--down-soft); }
.cfb.no { border-color: var(--up); background: var(--up-soft); }
.cfb .fb1 { font-size: 26rpx; font-weight: 800; margin-bottom: 8rpx; }
.cfb .fb2 { font-size: 23rpx; line-height: 1.8; color: var(--ink-2); }
.trap {
  margin-top: 14rpx; padding-top: 14rpx; border-top: 1rpx dashed var(--line);
  font-size: 22rpx; line-height: 1.75; color: var(--ink-2);
}
.trap .b { font-weight: 800; color: var(--gold-ink); }
.qzquit { text-align: center; font-size: 22rpx; color: var(--muted); margin-top: 22rpx; }

.qzstat { font-size: 56rpx; font-weight: 800; text-align: center; margin-top: 24rpx; color: var(--brand); letter-spacing: -2rpx; }
.qzstatl { font-size: 23rpx; color: var(--ink-2); text-align: center; margin-top: 6rpx; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.tcard {
  background: #fff; border: 1px solid var(--line); border-radius: var(--r); padding: 26rpx;
}
.ic {
  width: 66rpx; height: 66rpx; border-radius: 20rpx; margin-bottom: 16rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 800; color: var(--brand-2); background: var(--brand-soft);
}
.tt { font-size: 27rpx; font-weight: 750; }
.td { font-size: 22rpx; color: var(--muted); margin-top: 4rpx; }

.trainer { padding: 30rpx; margin-top: 24rpx; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16rpx; }
.h3 { font-size: 30rpx; font-weight: 800; letter-spacing: -.4rpx; }
.q { font-size: 23rpx; color: var(--muted); margin-top: 8rpx; line-height: 1.6; }

.kbox {
  width: 100%; height: 420rpx; margin: 22rpx 0 0;
  border: 1px solid var(--line-2); border-radius: var(--r-sm); background: var(--card-2);
}

.opt {
  display: flex; align-items: center; gap: 18rpx;
  border: 1px solid var(--line); border-radius: var(--r-sm);
  padding: 20rpx 22rpx; margin-top: 14rpx; background: #fff;
}
.opt .kb {
  width: 44rpx; height: 44rpx; border-radius: 12rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; font-weight: 700; background: var(--bg-2); color: var(--ink-2);
}
.opt .ot { font-size: 25rpx; line-height: 1.5; }
.opt.right { border-color: var(--down); background: var(--down-soft); }
.opt.right .kb { background: var(--down); color: #fff; }
.opt.wrong { border-color: var(--up); background: var(--up-soft); }
.opt.wrong .kb { background: var(--up); color: #fff; }

.explain {
  margin-top: 22rpx; padding: 24rpx; border-radius: var(--r-sm);
  background: var(--brand-soft); border: 1px solid var(--brand-line);
  font-size: 24rpx; color: var(--ink-2); line-height: 1.75;
}
.explain .b { font-weight: 800; color: var(--brand-2); }
.mt { margin-top: 26rpx; }
.tip { text-align: center; font-size: 22rpx; color: var(--muted); margin-top: 26rpx; line-height: 1.7; }
</style>
