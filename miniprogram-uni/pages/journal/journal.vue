<template>
  <view class="page" :class="themeCls">
    <view class="sec-title">
      <view class="h">复盘台</view>
      <view class="s">{{ list.length }} 笔</view>
    </view>

    <view class="intro">
      交易记录不是记账，是把「我以为什么」和「实际发生什么」摆在一起。
      不写下来的交易，第二次还会犯同样的错，只是换个标的。
      这里只看三件事：<text class="b">纪律分</text>、<text class="b">盈亏比</text>、<text class="b">违规次数</text>——胜率不单独看。
    </view>

    <!-- 统计四格 -->
    <view class="stat4">
      <view class="c"><view class="k">Trades</view><view class="v">{{ st.n }}</view></view>
      <view class="c"><view class="k">Win %</view><view class="v">{{ st.n ? st.winRate + '%' : '—' }}</view></view>
      <view class="c"><view class="k">P/L</view><view class="v">{{ st.pl ? st.pl.toFixed(2) : '—' }}</view></view>
      <view class="c"><view class="k">Discipline</view>
        <view class="v" :class="st.n ? (st.disc >= 80 ? 'ok' : (st.disc < 50 ? 'bad' : '')) : ''">{{ st.n ? st.disc + '%' : '—' }}</view>
      </view>
    </view>

    <!-- 记一笔 -->
    <view class="sec-title"><view class="h">记一笔</view><view class="s">平仓后立刻写</view></view>
    <view class="card form">
      <view class="row2">
        <view class="fg">
          <view class="fl">标的代号</view>
          <input class="inp" v-model="f.sym" maxlength="12" placeholder="如 600XXX" />
        </view>
        <view class="fg">
          <view class="fl">方向</view>
          <picker class="inp picker" :range="['做多', '做空 / 反向']" :value="f.side === 'short' ? 1 : 0" @change="f.side = $event.detail.value == 1 ? 'short' : 'long'">
            <view>{{ f.side === 'short' ? '做空 / 反向' : '做多' }}</view>
          </picker>
        </view>
      </view>
      <view class="row2">
        <view class="fg">
          <view class="fl">这笔结果 %</view>
          <input class="inp" v-model="f.pct" type="digit" placeholder="-3.2" />
        </view>
        <view class="fg">
          <view class="fl">仓位 %</view>
          <input class="inp" v-model="f.pos" type="number" placeholder="20" />
        </view>
      </view>
      <view class="fg">
        <view class="fl">买入理由（一句话，事后不能改）</view>
        <input class="inp" v-model="f.why" maxlength="60" placeholder="如：主线龙头回踩 20 日线，止损放在 19.4" />
      </view>

      <view class="fl">三条纪律 · 做到一条算一分</view>
      <view class="chk" @click="f.c1 = !f.c1">
        <view class="box" :class="{ on: f.c1 }">{{ f.c1 ? '✓' : '' }}</view>
        <view class="ct">下单前已经写下止损位</view>
      </view>
      <view class="chk" @click="f.c2 = !f.c2">
        <view class="box" :class="{ on: f.c2 }">{{ f.c2 ? '✓' : '' }}</view>
        <view class="ct">按事先计划的位置卖出（不临时改）</view>
      </view>
      <view class="chk" @click="f.c3 = !f.c3">
        <view class="box" :class="{ on: f.c3 }">{{ f.c3 ? '✓' : '' }}</view>
        <view class="ct">亏损后没有补仓摊低成本</view>
      </view>

      <view class="hint">
        「止损位」指下单那一秒就存在的数字，不是事后画的线。三条都不勾也算合法记录，但它会记进违规——这一栏本来就是为了让你看见自己。
      </view>
      <view class="actrow">
        <view class="btn primary" @click="save">保存这笔</view>
        <view class="btn ghost" @click="reset">清空</view>
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="sec-title"><view class="h">交易记录</view><view class="s">{{ st.n ? '违规 ' + st.slips + ' 项' : '最近的在前' }}</view></view>
    <view class="empty" v-if="!list.length">
      <view class="eb">还没有记录</view>
      <view class="es">第一笔可以是你上一笔真实交易，也可以是从案例库借来的一个场景。先用三条纪律勾一遍，就知道自己平时在哪一步破功。</view>
    </view>
    <view class="item" v-for="x in list" :key="x.id">
      <view class="l1">
        <view class="sym">{{ x.sym }}<text class="tag" :class="x.side === 'short' ? 'short' : 'long'">{{ x.side === 'short' ? '反' : '多' }}</text></view>
        <view class="pl" :class="x.pct > 0 ? 'up' : (x.pct < 0 ? 'down' : '')">{{ x.pct > 0 ? '+' : ''}}{{ x.pct.toFixed(1) }}%</view>
      </view>
      <view class="l2">
        <text>{{ x.at }}</text>
        <text>仓位 {{ x.pos }}%</text>
        <text :class="x.c === 3 ? 'good' : 'bad'">纪律 {{ x.c }}/3</text>
        <text class="del" @click="del(x.id)">删除</text>
      </view>
      <view class="why" v-if="x.why">{{ x.why }}</view>
    </view>

    <!-- 复盘四问 -->
    <view class="sec-title"><view class="h">复盘四问</view><view class="s">每笔都问</view></view>
    <view class="rules">
      <view class="r"><text class="no">01</text><view class="rt">买入前的理由，现在还成立吗？<text class="b">不成立就该走，与盈亏无关。</text></view></view>
      <view class="r"><text class="no">02</text><view class="rt">这笔亏损是<text class="b">规则内的成本</text>，还是<text class="b">违规的代价</text>？</view></view>
      <view class="r"><text class="no">03</text><view class="rt">如果明天出现一模一样的机会，我会不会做同样的动作？</view></view>
      <view class="r"><text class="no">04</text><view class="rt">仓位大小，是按止损幅度算的，还是按「感觉能赚」给的？</view></view>
    </view>

    <view class="usage">
      <view class="uk">用法</view>
      <view class="ut">先连着记 <text class="b">20 笔</text>再评价方法。20 笔以内的胜率是噪声，不是结论；能看的是纪律分——它在你赚钱的时候也照样能算出来。</view>
    </view>
  </view>
</template>

<script>
/* 复盘台（与 Web 端 journal.js 同口径）
   刻意不算总收益，只算纪律分：总收益受行情影响，纪律分不受。
   数据存 storage 'ta_journal'，数组，最新在前。
   { id, sym, side, pct, pos, why, c(0-3), at } */
const KEY = 'ta_journal'
const MAX = 200

const dayKey = () => {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}
const num = v => {
  const n = parseFloat(v)
  return isFinite(n) ? n : 0
}

export default {
  data() {
    return {
      theme: 'light',
      list: [],
      f: { sym: '', side: 'long', pct: '', pos: '', why: '', c1: false, c2: false, c3: false }
    }
  },
  computed: {
    themeCls() { return 't-' + this.theme },
    st() {
      const list = this.list
      const n = list.length
      const wins = list.filter(x => num(x.pct) > 0)
      const losses = list.filter(x => num(x.pct) < 0)
      const avgW = wins.length ? wins.reduce((a, b) => a + num(b.pct), 0) / wins.length : 0
      const avgL = losses.length ? Math.abs(losses.reduce((a, b) => a + num(b.pct), 0) / losses.length) : 0
      /* 盈亏比：没有亏损样本时不给数字（∞ 会误导） */
      const pl = (avgL > 0 && avgW > 0) ? avgW / avgL : 0
      const disc = n ? Math.round(list.reduce((a, b) => a + (b.c || 0), 0) / (n * 3) * 100) : 0
      const slips = list.reduce((a, b) => a + (3 - (b.c || 0)), 0)
      return { n, winRate: n ? Math.round(wins.length / n * 100) : 0, pl, disc, slips }
    }
  },
  onLoad() { this.load() },
  onShow() {
    let v = uni.getStorageSync('ta_theme') || 'light'
    if (v.charAt(0) === '"') { try { v = JSON.parse(v) } catch (e) { v = 'light' } }
    this.theme = v
    this.load()
  },
  methods: {
    load() {
      const v = uni.getStorageSync(KEY)
      this.list = Array.isArray(v) ? v : []
    },
    write() {
      uni.setStorageSync(KEY, this.list.slice(0, MAX))
    },
    save() {
      const sym = (this.f.sym || '').trim()
      if (!sym) {
        uni.showToast({ title: '先填标的代号', icon: 'none' })
        return
      }
      if (this.f.pct === '' || !isFinite(parseFloat(this.f.pct))) {
        uni.showToast({ title: '结果要填数字（%），亏损写负数', icon: 'none' })
        return
      }
      const c = [this.f.c1, this.f.c2, this.f.c3].filter(Boolean).length
      this.list.unshift({
        id: 'j' + Date.now().toString(36),
        sym: sym.slice(0, 12),
        side: this.f.side,
        pct: num(this.f.pct),
        pos: num(this.f.pos),
        why: (this.f.why || '').trim().slice(0, 60),
        c, at: dayKey()
      })
      this.write()
      this.reset()
      uni.showToast({
        title: c === 3 ? '记下了 · 三条全做到' : '记下了 · 漏了 ' + (3 - c) + ' 条纪律',
        icon: 'none'
      })
    },
    reset() {
      this.f = { sym: '', side: 'long', pct: '', pos: '', why: '', c1: false, c2: false, c3: false }
    },
    del(id) {
      uni.showModal({
        title: '删除这笔？',
        content: '删掉的记录找不回来。',
        confirmText: '删除',
        success: r => {
          if (!r.confirm) return
          this.list = this.list.filter(x => x.id !== id)
          this.write()
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.page { padding: 24rpx; }
.sec-title {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 28rpx 4rpx 16rpx;
}
.sec-title .h { font-size: 30rpx; font-weight: 750; }
.sec-title .s { font-size: 22rpx; color: var(--muted); }
.intro {
  font-size: 24rpx; line-height: 1.8; color: var(--ink-2);
  border-left: 2rpx solid var(--line); padding-left: 20rpx; margin-bottom: 24rpx;
}
.b { font-weight: 700; color: var(--ink); }

/* 统计四格 */
.stat4 {
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: var(--card); border: 1rpx solid var(--line);
  border-radius: var(--r-lg); overflow: hidden; margin-bottom: 8rpx;
}
.stat4 .c { padding: 24rpx 16rpx; border-left: 1rpx solid var(--line); }
.stat4 .c:first-child { border-left: none; }
.stat4 .k { font-size: 18rpx; letter-spacing: 2rpx; color: var(--muted); text-transform: uppercase; }
.stat4 .v { font-size: 38rpx; font-weight: 800; margin-top: 10rpx; letter-spacing: -1rpx; }
.stat4 .v.ok { color: var(--down); }
.stat4 .v.bad { color: var(--up); }

/* 表单 */
.card {
  background: var(--card); border: 1rpx solid var(--line);
  border-radius: var(--r-lg); padding: 28rpx; margin-bottom: 8rpx;
}
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.fg { margin-bottom: 20rpx; }
.fl {
  font-size: 19rpx; letter-spacing: 2rpx; color: var(--muted);
  text-transform: uppercase; margin-bottom: 10rpx;
}
.inp {
  width: 100%; box-sizing: border-box;
  font-size: 26rpx; color: var(--ink);
  padding: 18rpx 20rpx; border-radius: 16rpx;
  background: var(--bg-2); border: 1rpx solid var(--line);
}
.picker { line-height: 1.5; }
.chk {
  display: flex; align-items: center; gap: 14rpx;
  padding: 18rpx 20rpx; border-radius: 16rpx; margin-bottom: 12rpx;
  background: var(--bg-2); border: 1rpx solid var(--line);
}
.chk .box {
  width: 32rpx; height: 32rpx; border-radius: 8rpx; flex: none;
  border: 2rpx solid var(--muted); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; line-height: 1;
}
.chk .box.on { background: var(--up); border-color: var(--up); }
.chk .ct { font-size: 24rpx; color: var(--ink-2); }
.hint { font-size: 21rpx; line-height: 1.7; color: var(--muted); margin-top: 12rpx; }
.actrow { display: flex; gap: 16rpx; margin-top: 24rpx; }
.btn {
  flex: 1; text-align: center; font-size: 26rpx; font-weight: 700;
  padding: 20rpx 0; border-radius: 16rpx; border: 1rpx solid var(--line);
  background: var(--card); color: var(--ink-2);
}
.btn.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
.btn.ghost { flex: none; width: 150rpx; }

/* 记录 */
.empty {
  padding: 44rpx 28rpx; text-align: center;
  border: 1rpx dashed var(--line); border-radius: var(--r-lg);
}
.empty .eb { font-size: 28rpx; font-weight: 750; }
.empty .es { font-size: 23rpx; color: var(--muted); line-height: 1.8; margin-top: 12rpx; }
.item {
  background: var(--card); border: 1rpx solid var(--line);
  border-radius: 26rpx; padding: 24rpx 26rpx; margin-bottom: 14rpx;
}
.item .l1 { display: flex; align-items: baseline; justify-content: space-between; }
.item .sym { font-size: 28rpx; font-weight: 800; }
.item .tag {
  font-size: 18rpx; font-weight: 700; padding: 4rpx 10rpx;
  border-radius: 8rpx; margin-left: 10rpx; vertical-align: 4rpx;
}
.item .tag.long { background: var(--up-soft); color: var(--up); }
.item .tag.short { background: var(--down-soft); color: var(--down); }
.item .pl { font-size: 28rpx; font-weight: 800; }
.item .pl.up { color: var(--up); }
.item .pl.down { color: var(--down); }
.item .l2 {
  display: flex; gap: 20rpx; margin-top: 12rpx;
  font-size: 20rpx; color: var(--muted);
}
.item .l2 .good { color: var(--down); }
.item .l2 .bad { color: var(--up); }
.item .l2 .del { margin-left: auto; color: var(--muted); text-decoration: underline; }
.item .why {
  font-size: 24rpx; line-height: 1.7; color: var(--ink-2);
  margin-top: 14rpx; padding-top: 14rpx; border-top: 1rpx solid var(--line);
}

/* 复盘四问 */
.rules {
  background: var(--card); border: 1rpx solid var(--line);
  border-radius: var(--r-lg); overflow: hidden; margin-bottom: 24rpx;
}
.rules .r {
  display: flex; gap: 18rpx; padding: 22rpx 26rpx;
  border-top: 1rpx solid var(--line);
}
.rules .r:first-child { border-top: none; }
.rules .no { font-size: 20rpx; font-weight: 700; color: var(--brand-2); margin-top: 4rpx; }
.rules .rt { flex: 1; font-size: 24rpx; line-height: 1.7; color: var(--ink-2); }

.usage {
  background: var(--brand-soft); border: 1rpx solid var(--brand-line);
  border-radius: 26rpx; padding: 24rpx 26rpx; margin-bottom: 40rpx;
}
.usage .uk {
  font-size: 20rpx; letter-spacing: 2rpx; color: var(--brand);
  text-transform: uppercase; margin-bottom: 10rpx;
}
.usage .ut { font-size: 24rpx; line-height: 1.8; color: var(--ink-2); }
</style>
