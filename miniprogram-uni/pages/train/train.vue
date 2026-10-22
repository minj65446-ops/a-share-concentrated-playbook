<template>
  <view class="page" :class="themeCls">
    <view class="sec-title">
      <view class="h">训练场</view>
      <view class="s">{{ accText }}</view>
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
      streak: 0, stats: { total: 0, right: 0 }
    }
  },
  computed: {
    themeCls() { return 't-' + this.theme },

    accText() {
      const s = this.stats
      return s.total ? '正确率 ' + Math.round(s.right / s.total * 100) + '%（' + s.right + '/' + s.total + '）' : '正确率 —'
    }
  },
  onLoad() {
    const s = uni.getStorageSync('ta_kline')
    if (s) this.stats = { total: s.total || 0, right: s.right || 0 }
    this.streak = (uni.getStorageSync('ta_kline') || {}).streak || 0
    this.load(0)
  },
  onReady() { this.$nextTick(() => this.draw()) },
  onShow() {
    let v = uni.getStorageSync('ta_theme') || 'light'
    if (v.charAt(0) === '"') { try { v = JSON.parse(v) } catch (e) { v = 'light' } }
    this.theme = v
  },
  methods: {
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
