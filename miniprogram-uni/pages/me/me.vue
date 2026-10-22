<template>
  <view class="page" :class="themeCls">
    <view class="sec-title">
      <view class="h">我的</view>
      <view class="s">数据保存在本机</view>
    </view>

    <view class="stat3">
      <view class="s">
        <view class="v">{{ done.length }}/8</view>
        <view class="k">课程</view>
      </view>
      <view class="s">
        <view class="v">{{ acc }}</view>
        <view class="k">K线正确率</view>
      </view>
      <view class="s">
        <view class="v">{{ wrong }}</view>
        <view class="k">错题数</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">界面风格</view>
      <view class="s">{{ themeName }}</view>
    </view>

    <view class="themes">
      <view class="tcard" :class="['t-' + t.k, { on: t.k === theme }]" v-for="t in themes" :key="t.k" @click="pick(t.k)">
        <view class="ck" v-if="t.k === theme">✓</view>
        <view class="pv">
          <view class="row1">
            <view class="dot"></view>
            <view class="nm">{{ t.name }}</view>
          </view>
          <view class="ln hi"></view>
          <view class="ln m"></view>
          <view class="ln s"></view>
          <view class="tag">{{ t.k === 'light' ? '默认' : 'Aa' }}</view>
        </view>
        <view class="ft">{{ t.desc }}</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">成就</view>
      <view class="s">{{ badgeOn }} / 4</view>
    </view>

    <view class="badges">
      <view class="badge" :class="{ on: b.on }" v-for="b in badges" :key="b.t">
        <view class="sym">{{ b.sym }}</view>
        <view class="lb">{{ b.t }}</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">盘后三问</view>
      <view class="s">每天勾一次</view>
    </view>

    <view class="card list">
      <view class="row" v-for="(q, i) in review" :key="i" @click="toggle(i)">
        <view class="ck" :class="{ on: checked.includes(i) }">{{ checked.includes(i) ? '✓' : '' }}</view>
        <view class="qt" :class="{ done: checked.includes(i) }">{{ q }}</view>
      </view>
    </view>

    <view class="card risk">
      <view class="bk">风险提示</view>
      <view class="rt">
        本应用为交易方法论的教学演示，全部行情为程序生成的合成数据，不构成投资建议。集中持仓会放大单一判断错误的后果，实盘决策及后果由本人承担。
      </view>
    </view>
  </view>
</template>

<script>
import { THEMES, apply as applyTheme, read as readTheme } from '../../common/theme.js'

export default {
  data() {
    return {
      theme: 'light',
      themes: THEMES,
      done: [],
      stats: { total: 0, right: 0 },
      review: [
        '今天的操作全部在计划内',
        '没有触及止损却没执行的单子',
        '持仓的买入理由今天仍然成立'
      ],
      checked: []
    }
  },
  computed: {
    themeCls() { return 't-' + this.theme },

    acc() {
      const s = this.stats
      return s.total ? Math.round(s.right / s.total * 100) + '%' : '—'
    },
    wrong() {
      return Math.max(0, (this.stats.total || 0) - (this.stats.right || 0))
    },
    badges() {
      const best = uni.getStorageSync('ta_best_streak') || 0
      const d = this.done.length
      return [
        { sym: '课', t: '首课', on: d >= 1 },
        { sym: '连', t: '连对5', on: best >= 5 },
        { sym: '率', t: '80%正确', on: this.stats.total >= 5 && this.stats.right / this.stats.total >= 0.8 },
        { sym: '门', t: '4门课', on: d >= 4 }
      ]
    },
    badgeOn() { return this.badges.filter(b => b.on).length },
    themeName() {
      const t = this.themes.find(x => x.k === this.theme)
      return t ? t.name : ''
    }
  },
  onShow() {
    this.theme = readTheme()

    this.done = uni.getStorageSync('ta_done') || []
    const s = uni.getStorageSync('ta_kline') || {}
    this.stats = { total: s.total || 0, right: s.right || 0 }
    if ((s.streak || 0) > (uni.getStorageSync('ta_best_streak') || 0)) {
      uni.setStorageSync('ta_best_streak', s.streak)
    }
    const key = 'ta_review_' + this.today()
    this.checked = uni.getStorageSync(key) || []
    this._key = key
  },
  methods: {
    pick(k) {
      this.theme = applyTheme(k)
      if (uni.vibrateShort) uni.vibrateShort({ type: 'light' })
    },
    today() {
      const d = new Date()
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    },
    toggle(i) {
      const arr = this.checked.slice()
      const p = arr.indexOf(i)
      if (p >= 0) arr.splice(p, 1)
      else arr.push(i)
      this.checked = arr
      uni.setStorageSync(this._key, arr)
    }
  }
}
</script>

<style lang="scss" scoped>
.stat3 { display: flex; gap: 16rpx; }
.stat3 .s {
  flex: 1; background: #fff; border: 1px solid var(--line); border-radius: var(--r);
  padding: 24rpx 12rpx; text-align: center;
}
.stat3 .v { font-size: 38rpx; font-weight: 800; color: var(--brand-2); }
.stat3 .k { font-size: 21rpx; color: var(--muted); margin-top: 4rpx; }

.badges { display: flex; gap: 14rpx; }
.badge {
  flex: 1; aspect-ratio: 1 / 1; border-radius: var(--r);
  background: #fff; border: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.badge .sym { font-size: 30rpx; font-weight: 800; color: var(--muted); opacity: .35; }
.badge .lb { font-size: 19rpx; color: var(--muted); margin-top: 6rpx; }
.badge.on { background: var(--gold-soft); border-color: var(--gold-line); }
.badge.on .sym { color: var(--gold); opacity: 1; }
.badge.on .lb { color: var(--gold); }

.list { padding: 8rpx 28rpx; }
.row { display: flex; gap: 18rpx; align-items: flex-start; padding: 24rpx 0; border-bottom: 1px solid var(--line-2); }
.row:last-child { border-bottom: none; }
.ck {
  width: 36rpx; height: 36rpx; border-radius: 10rpx; flex: 0 0 auto;
  border: 1px solid var(--line); display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; color: #fff; margin-top: 2rpx;
}
.ck.on { background: var(--brand-2); border-color: var(--brand-2); }
.qt { font-size: 25rpx; color: var(--ink-2); line-height: 1.6; }
.qt.done { color: var(--muted); text-decoration: line-through; }

.risk { padding: 28rpx; margin-top: 32rpx; background: var(--gold-soft); border-color: var(--gold-line); }
.risk .bk { font-size: 20rpx; letter-spacing: 2rpx; font-weight: 700; color: var(--gold-ink); text-transform: uppercase; margin-bottom: 10rpx; }
.risk .rt { font-size: 23rpx; line-height: 1.75; color: var(--gold-ink-2); }
</style>
