<template>
  <view class="page" :class="themeCls">
    <view class="sec-title">
      <view class="h">我的</view>
      <view class="s">数据保存在本机</view>
    </view>

    <!-- 等级卡：经验值 + 段内进度（段位仍由 rank.js 判定，经验值买不到毕业） -->
    <view class="lvcard">
      <view class="lvtop">
        <view class="lvl">
          <view class="lvno">LV{{ lv.lv }}</view>
          <view class="lvs">经验 {{ prof.xp }} · 连续 {{ prof.streak }} 天</view>
        </view>
        <view class="lvfreeze" v-if="prof.freezes">{{ prof.freezes }} 张补签卡</view>
      </view>
      <view class="lvtrack"><view class="fi" :style="{ width: lv.pct + '%' }"></view></view>
      <view class="lvfoot">本段 {{ lv.into }} / {{ lv.need }}　经验只影响本段进度，不影响段位判定</view>
    </view>

    <!-- 近 7 天：打卡记录是段位的基础数据之一，摆出来比藏着有用 -->
    <view class="sec-title">
      <view class="h">近 7 天</view>
      <view class="s">{{ weekOn }} 天学过</view>
    </view>
    <view class="week">
      <view class="wd" v-for="(d, i) in weekDays" :key="i" :class="{ on: d.on, today: d.today }">
        <view class="dot"></view>
        <view class="lb">{{ d.wd }}</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">今天做了什么</view>
      <view class="s">+{{ todayXp }} 经验</view>
    </view>
    <view class="card list">
      <view class="logrow" v-if="!todayList.length">
        <view class="lt">今天还没开始。答一张题卡就算打卡。</view>
      </view>
      <view class="logrow" v-for="(x, i) in todayList" :key="i">
        <view class="lt">{{ x.w }}</view>
        <view class="lx">+{{ x.xp }}</view>
      </view>
    </view>

    <!-- 数字后面的单位单独套 .u，和主数字分层：
         「6/8」三个字符同字号读起来是一坨，单位小一半就立住了 -->
    <view class="stat3">
      <view class="s">
        <view class="v">{{ done.length }}<text class="u">/8</text></view>
        <view class="k">课程</view>
      </view>
      <view class="s">
        <view class="v">{{ accNum }}<text class="u">{{ accUnit }}</text></view>
        <view class="k">K线正确率</view>
      </view>
      <view class="s">
        <view class="v">{{ wrong }}<text class="u">题</text></view>
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
import { store, readProf, week, levelOf, todayLog, todayXp } from '../../common/learn.js'

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
      checked: [],
      /* v8 */
      prof: { xp: 0, streak: 0, freezes: 0 },
      lv: { lv: 1, into: 0, need: 200, pct: 0 },
      weekDays: [],
      todayList: [],
      todayXp: 0
    }
  },
  computed: {
    themeCls() { return 't-' + this.theme },

    /* 数字和单位拆成两个字段，模板里才能分别排版。
       空态返回「还没有数」而不是「—」，和 Web 端一致。 */
    accNum() {
      const s = this.stats
      return s.total ? String(Math.round(s.right / s.total * 100)) : '还没有数'
    },
    accUnit() {
      return this.stats.total ? '%' : ''
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
    weekOn() { return this.weekDays.filter(d => d.on).length },
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

    /* 学习档案 */
    const p = readProf(store)
    this.prof = { xp: p.xp || 0, streak: p.streak || 0, freezes: p.freezes || 0 }
    this.lv = levelOf(p.xp || 0)
    this.weekDays = week(store)
    this.todayList = todayLog(store)
    this.todayXp = todayXp(store)
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
/* 等级卡 */
.lvcard {
  background: linear-gradient(150deg, var(--brand) 0%, var(--hero-mid) 62%, var(--hero-end) 100%);
  border-radius: var(--r-lg); padding: 30rpx; color: #fff;
  box-shadow: 0 12rpx 30rpx rgba(22, 40, 63, .2);
}
.lvtop { display: flex; align-items: flex-end; justify-content: space-between; }
.lvno { font-size: 42rpx; font-weight: 800; letter-spacing: -.5rpx; line-height: 1; }
.lvs { font-size: 21rpx; opacity: .75; margin-top: 10rpx; }
.lvfreeze {
  font-size: 20rpx; padding: 6rpx 16rpx; border-radius: 30rpx;
  background: rgba(255, 255, 255, .16);
}
/* 槽做凹陷（内阴影），和 Web 端同一套层次逻辑 */
.lvtrack {
  height: 10rpx; border-radius: 6rpx; margin-top: 22rpx;
  background: rgba(255, 255, 255, .2); overflow: hidden;
  box-shadow: inset 0 1rpx 3rpx rgba(10, 20, 32, .18);
}
.lvtrack .fi { height: 100%; background: #fff; border-radius: 6rpx; }
.lvfoot { font-size: 19rpx; opacity: .68; margin-top: 14rpx; line-height: 1.6; }

/* 近 7 天 */
.week { display: flex; gap: 12rpx; }
.week .wd {
  flex: 1; background: var(--card); border: 1rpx solid var(--line);
  border-radius: var(--r-sm); padding: 20rpx 0; text-align: center;
}
.week .wd .dot {
  width: 20rpx; height: 20rpx; border-radius: 50%;
  background: var(--bg-2); margin: 0 auto;
}
.week .wd .lb { font-size: 19rpx; color: var(--muted); margin-top: 10rpx; }
.week .wd.on { background: var(--brand-soft); border-color: var(--brand-line); }
.week .wd.on .dot { background: var(--brand); }
.week .wd.on .lb { color: var(--brand-2); }
.week .wd.today { border-color: var(--brand); }

/* 今天做了什么 */
.logrow {
  display: flex; align-items: center; justify-content: space-between;
  gap: 18rpx; padding: 22rpx 0; border-bottom: 1rpx solid var(--line-2);
}
.logrow:last-child { border-bottom: none; }
.logrow .lt { font-size: 24rpx; color: var(--ink-2); line-height: 1.55; }
.logrow .lx { font-size: 23rpx; font-weight: 800; color: var(--brand); flex: 0 0 auto; }

.stat3 { display: flex; gap: 16rpx; }
.stat3 .s {
  flex: 1; background: #fff; border: 1px solid var(--line); border-radius: var(--r);
  padding: 24rpx 12rpx; text-align: center;
}
.stat3 .v { font-size: 38rpx; font-weight: 800; color: var(--brand-2); }
/* 单位退后一步：字号砍到一半、透明度 .5，数字本身才立得住 */
.stat3 .v .u { font-size: 19rpx; font-weight: 700; opacity: .5; margin-left: 1rpx; }
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
