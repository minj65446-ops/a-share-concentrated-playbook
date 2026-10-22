<template>
  <view class="page" :class="themeCls">

    <view class="sec-title">
      <view class="h">找老师</view>
      <view class="s">{{ schools.length }} 个流派</view>
    </view>

    <view class="card pad intro">
      网上教金融的老师，本质上只有 <text class="b">8 个流派</text>。{{ '\n' }}
      你在任何一个平台刷到的任何一个人，都能归到这 8 个里。<text class="b">认流派，别记名字。</text>
    </view>

    <!-- 幻方 -->
    <view class="pantheon">
      <view class="axis v"></view>
      <view class="axis h"></view>
      <view class="core-chip">按「你怎么赚钱」分</view>
      <view
        class="pan"
        v-for="(q, i) in quads"
        :key="i"
        :class="{ on: isOn(q) }"
        @click="pick(q)"
      >
        <view class="dot"></view>
        <view class="qz">{{ q.qz }}</view>
        <view class="nm">{{ q.nm }}</view>
        <view class="ct">{{ q.ct }} · {{ q.keys.length }} 派</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">八派</view>
      <view class="s">点开看约束</view>
    </view>

    <view class="teacher-grid">
      <view
        class="tch"
        v-for="(t, i) in schools"
        :key="t.k"
        :class="{ hl: pickK === t.k }"
        @click="open(t)"
      >
        <view class="head">
          <view class="av" :class="'st-' + (i % 4 + 1)">{{ t.no }}</view>
          <view class="hdwrap">
            <view class="nm">{{ t.name }}</view>
            <view class="hd">
              <text class="badge-v" :class="{ none: t.verified.indexOf('无') === 0 }">{{ vlabel(t) }}</text>
              <text class="sep">·</text>
              <text>{{ t.tag }}</text>
            </view>
          </view>
        </view>
        <view class="promise">{{ t.promise }}</view>
        <view class="tags">
          <text class="tg" v-for="(m, j) in (t.match.length ? t.match : ['—'])" :key="j">{{ mname(m) }}</text>
        </view>
        <view class="foot">
          <text class="fit">识别难度 <text class="b">{{ t.tier === 'fake' ? '低' : (t.tier === 'inst' ? '高' : '中') }}</text></text>
          <text class="arrow">看约束 ›</text>
        </view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">反面样本</view>
      <view class="s">{{ fakes.length }} 类</view>
    </view>
    <view class="tip-s">这 4 类不是"老师"，是话术。认识它们的价值，大于认识任何一个真懂的人。</view>

    <view class="teacher-grid">
      <view class="tch fake" v-for="t in fakes" :key="t.k" @click="open(t)">
        <view class="head">
          <view class="av fake">{{ t.no }}</view>
          <view class="hdwrap">
            <view class="nm">{{ t.name }}</view>
            <view class="hd"><text class="badge-v none">无凭证</text><text class="sep">·</text><text>{{ t.tag }}</text></view>
          </view>
        </view>
        <view class="promise">{{ t.promise }}</view>
        <view class="tags"><text class="tg">话术</text></view>
        <view class="foot">
          <text class="fit">识别难度 <text class="b">低</text></text>
          <text class="arrow fake">看破绽 ›</text>
        </view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">三问识人</view>
      <view class="s">照这个问</view>
    </view>
    <view class="card pad">
      <view class="tip-s2">任何一个自称有方法的人，都可以用这三个问题过一遍。答不上来的，不必再听第二句。</view>
      <view class="q" v-for="(it, i) in idtest" :key="i">
        <view class="n">{{ i + 1 }}</view>
        <view class="qb">
          <view>{{ it.q }}</view>
          <view class="r">{{ it.a }}</view>
        </view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">师承链</view>
      <view class="s">方法从哪来</view>
    </view>
    <view class="card lineage-wrap">
      <view class="lineage">
        <view class="ln" v-for="l in lineage" :key="l.id">
          <view class="yr">{{ l.year }} · {{ l.id }}</view>
          <view class="src">{{ l.from }}</view>
          <view class="to">→ {{ l.to.join(' · ') }}</view>
          <view class="cn">{{ l.cn }}</view>
          <view class="note">{{ l.note }}</view>
        </view>
      </view>
    </view>

    <view class="warn">
      <view class="wk">关于"老师"这件事</view>
      本页不列任何人名，也不评价任何具体账号。列的是流派——因为流派的方法可以被检验，而个人业绩不能。
      任何要求你"亏损不担、盈利分成"、或声称"我有内幕"的人，都与本页所有流派无关，请直接离开。
    </view>

    <!-- 详情弹层 -->
    <view class="mask" v-if="cur" @click="cur = null">
      <view class="sheet" @click.stop>
        <view class="handle"></view>

        <view class="tch-hero">
          <view class="av" :class="{ fake: cur.tier === 'fake' }">{{ cur.no }}</view>
          <view class="hdwrap">
            <view class="sh-title">{{ cur.name }}</view>
            <view class="row-pill">
              <text class="pill" :class="cur.tier === 'fake' ? 'up' : 'brand'">{{ cur.tier === 'fake' ? '反面样本' : '真实流派' }}</text>
              <text class="pill">{{ cur.tag }}</text>
            </view>
            <view class="ver">{{ cur.verified }}</view>
          </view>
        </view>

        <view class="sh-lead mt">{{ cur.promise }}</view>

        <!-- 真实流派 -->
        <block v-if="cur.tier !== 'fake'">
          <view class="two-col">
            <view class="c ok"><view class="lb">教对了什么</view>{{ cur.right }}</view>
            <view class="c no"><view class="lb">教漏了什么</view>{{ cur.wrong }}</view>
          </view>
          <view class="c warn2 full">
            <view class="lb">识别陷阱</view>{{ cur.trap }}
          </view>

          <view class="sh-block">
            <view class="k">可执行的核心规则</view>
            <view class="li" v-for="(c, i) in cur.core" :key="i">{{ c }}</view>
          </view>

          <view class="rulebox" v-if="ruleOf(cur.k)">
            <view class="rh">跟这一派的约束条件</view>
            <view class="ri"><text>最低资金</text><text>{{ ruleOf(cur.k).minCap }}</text></view>
            <view class="ri"><text>最大仓位</text><text>{{ ruleOf(cur.k).maxPos }}</text></view>
            <view class="ri"><text>止损方式</text><text>{{ ruleOf(cur.k).stop }}</text></view>
            <view class="ri"><text>交易频率</text><text>{{ ruleOf(cur.k).freq }}</text></view>
            <view class="ri"><text>持仓数量</text><text>{{ ruleOf(cur.k).size }}</text></view>
            <view class="forbid"><text class="b">明确不适合的人：</text>{{ ruleOf(cur.k).forbid.join('、') }}</view>
          </view>

          <view class="warn" v-if="cur.base">{{ cur.base }}</view>

          <view class="sh-block">
            <view class="k">师承</view>
            <view class="stxt"><text class="b">{{ cur.st.name }}</text> · {{ cur.st.from }} · {{ cur.st.era }}</view>
            <view class="stxt dim">{{ cur.st.line }}</view>
          </view>
        </block>

        <!-- 反面样本 -->
        <block v-else>
          <view class="two-col">
            <view class="c no"><view class="lb">它的破绽在哪</view>{{ cur.wrong }}</view>
            <view class="c warn2"><view class="lb">识别信号</view>{{ cur.trap }}</view>
          </view>
          <view class="warn">
            <text class="b">处理方式：</text>不辩论、不投诉、不试单。直接离开。你花在它身上的每一分钟，
            都是从真正该练习的时间里偷出来的。
          </view>
        </block>
      </view>
    </view>
  </view>
</template>

<script>
import { SCHOOLS, FAKES, LINEAGE, RULES, IDTEST, QUADS } from '../../common/teachers.js'

export default {
  data() {
    return {
      theme: 'light',
      schools: SCHOOLS,
      fakes: FAKES,
      lineage: LINEAGE,
      idtest: IDTEST,
      quads: QUADS,
      cur: null,
      pickK: null
    }
  },
  onShow() {
    let v = uni.getStorageSync('ta_theme') || 'light'
    if (v.charAt(0) === '"') { try { v = JSON.parse(v) } catch (e) { v = 'light' } }
    this.theme = v

    // 从「学」页流派自测跳过来：ta_open_school 存的是要展开的流派 key
    const k = uni.getStorageSync('ta_open_school')
    if (k) {
      uni.removeStorageSync('ta_open_school')
      const t = this.schools.find(x => x.k === k)
      if (t) this.cur = t
    }
  },
  methods: {
    vlabel(t) {
      if (t.verified === '无') return '无凭证'
      if (t.verified.indexOf('无') === 0) return '无业绩'
      return '可核查'
    },
    mname(m) {
      const map = { 趋势: '趋势市', 震荡: '震荡市', 发酵: '发酵期', 启动: '启动期', 底部: '底部区' }
      return map[m] || m
    },
    isOn(q) {
      return this.pickK !== null && q.keys.indexOf(this.pickK) >= 0
    },
    pick(q) {
      const wasOn = this.isOn(q)
      this.pickK = wasOn ? null : q.keys[0]
    },
    ruleOf(k) {
      return RULES[k] || null
    },
    open(t) {
      this.cur = t
      uni.vibrateShort && uni.vibrateShort({ type: 'light' })
    }
  }
  computed: {
    themeCls() { return 't-' + this.theme },
}
</script>

<style lang="scss" scoped>
.intro {
  padding: 28rpx;
  font-size: 25rpx;
  line-height: 1.8;
  color: var(--ink-2);
  white-space: pre-line;
}
.intro .b { color: var(--brand-2); font-weight: 700; }

/* 幻方 */
.pantheon {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  padding: 28rpx;
  margin-top: 28rpx;
  border-radius: var(--r-lg);
  background: linear-gradient(160deg, var(--panel-1), var(--panel-2));
  border: 1px solid var(--line);
}
.axis { position: absolute; background: var(--line); z-index: 0; }
.axis.v { left: 50%; top: 50%; width: 1px; height: 140rpx; transform: translate(-50%, -50%); }
.axis.h { left: 50%; top: 50%; height: 1px; width: 140rpx; transform: translate(-50%, -50%); }
.core-chip {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1;
  font-size: 18rpx; font-weight: 700; color: var(--muted); letter-spacing: 1rpx;
  background: var(--bg); padding: 8rpx 14rpx; border-radius: 99rpx; border: 1px solid var(--line);
}
.pan {
  position: relative; z-index: 2;
  background: #fff; border: 1px solid var(--line); border-radius: 24rpx;
  padding: 22rpx 24rpx;
}
.pan.on { border-color: var(--brand-2); box-shadow: 0 0 0 5rpx rgba(32, 69, 110, .10); }
.pan .qz { font-size: 19rpx; font-weight: 700; letter-spacing: 2rpx; color: var(--muted); }
.pan .nm { font-size: 27rpx; font-weight: 800; margin-top: 8rpx; }
.pan .ct { font-size: 21rpx; color: var(--muted); margin-top: 6rpx; }
.pan .dot {
  position: absolute; right: 20rpx; top: 20rpx;
  width: 12rpx; height: 12rpx; border-radius: 50%;
  background: var(--brand-2); opacity: .18;
}
.pan.on .dot { opacity: 1; background: var(--up); box-shadow: 0 0 0 6rpx rgba(217, 74, 69, .14); }

/* 老师卡 */
.teacher-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.tch {
  background: #fff; border: 1px solid var(--line); border-radius: 24rpx;
  padding: 24rpx; display: flex; flex-direction: column; gap: 14rpx;
}
.tch.hl { border-color: var(--brand-2); box-shadow: 0 0 0 5rpx rgba(32, 69, 110, .09); }
.tch .head { display: flex; gap: 16rpx; align-items: flex-start; }
.av {
  width: 74rpx; height: 74rpx; border-radius: 22rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 800; color: #fff;
  background: linear-gradient(145deg, var(--brand), var(--brand-2));
}
.av.st-1 { background: linear-gradient(145deg, #b0532f, #d4703f); }
.av.st-2 { background: linear-gradient(145deg, #1f6b52, #2c8f6d); }
.av.st-3 { background: linear-gradient(145deg, #7a5c1e, #a9832c); }
.av.st-4 { background: linear-gradient(145deg, #4a3f7a, #6b5ba8); }
.av.fake { background: linear-gradient(145deg, #8a8f96, #b0b5bb); }
.hdwrap { flex: 1; min-width: 0; }
.nm { font-size: 27rpx; font-weight: 800; line-height: 1.3; }
.hd { font-size: 20rpx; color: var(--muted); margin-top: 6rpx; }
.hd .sep { margin: 0 6rpx; }
.badge-v {
  font-size: 17rpx; font-weight: 700; padding: 4rpx 9rpx; border-radius: 8rpx;
  background: var(--brand-soft); color: var(--brand-2);
}
.badge-v.none { background: var(--bg-2); color: var(--muted); }
.promise {
  font-size: 23rpx; line-height: 1.6; color: var(--ink-2);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.tags { display: flex; flex-wrap: wrap; gap: 8rpx; }
.tg {
  font-size: 19rpx; padding: 5rpx 12rpx; border-radius: 8rpx;
  background: var(--bg-2); color: var(--muted);
}
.foot {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 14rpx; border-top: 1px solid var(--line-2);
}
.fit { font-size: 20rpx; color: var(--muted); }
.fit .b { color: var(--brand-2); font-weight: 700; }
.arrow { font-size: 21rpx; font-weight: 700; color: var(--up); }
.arrow.fake { color: var(--bad-ink); }

.tch.fake { background: var(--card-2); border-color: var(--bad-line); }
.tch.fake .nm { color: var(--bad-ink); }

.tip-s { font-size: 23rpx; color: var(--muted); line-height: 1.7; margin: 0 4rpx 20rpx; }
.tip-s2 { font-size: 23rpx; color: var(--muted); line-height: 1.7; margin-bottom: 18rpx; }

/* 三问 */
.q {
  display: flex; gap: 16rpx; align-items: flex-start;
  padding: 20rpx 22rpx; border: 1px solid var(--line); border-radius: 20rpx;
  font-size: 23rpx; line-height: 1.65; color: var(--ink-2); margin-bottom: 14rpx;
}
.q .n {
  flex: 0 0 auto; width: 34rpx; height: 34rpx; border-radius: 9rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 19rpx; font-weight: 700; background: var(--brand-soft); color: var(--brand-2);
}
.q .qb { flex: 1; }
.q .r { font-size: 21rpx; color: var(--up); font-weight: 700; margin-top: 6rpx; display: block; }

/* 师承 */
.lineage-wrap { padding: 8rpx 32rpx 20rpx; }
.lineage { position: relative; padding-left: 40rpx; }
.lineage::before {
  content: ''; position: absolute; left: 10rpx; top: 12rpx; bottom: 12rpx;
  width: 3rpx; background: linear-gradient(180deg, var(--brand-2), var(--line));
}
.ln { position: relative; padding: 22rpx 0; border-bottom: 1px solid var(--line-2); }
.ln::before {
  content: ''; position: absolute; left: -37rpx; top: 32rpx;
  width: 18rpx; height: 18rpx; border-radius: 50%;
  background: #fff; border: 4rpx solid var(--brand-2);
}
.ln .yr { font-size: 19rpx; font-weight: 700; color: var(--muted); letter-spacing: 1rpx; }
.ln .src { font-size: 25rpx; font-weight: 800; margin-top: 8rpx; }
.ln .to { font-size: 21rpx; color: var(--muted); margin-top: 8rpx; line-height: 1.6; }
.ln .cn { font-size: 21rpx; color: var(--brand-2); font-weight: 700; margin-top: 10rpx; }
.ln .note { font-size: 20rpx; color: var(--muted); margin-top: 6rpx; line-height: 1.6; font-style: italic; }

.warn {
  margin-top: 32rpx; background: var(--gold-soft); border: 1px solid var(--gold-line);
  border-radius: var(--r-sm); padding: 22rpx 24rpx;
  font-size: 23rpx; color: var(--gold-ink-2); line-height: 1.75;
}
.warn .wk {
  font-size: 19rpx; font-weight: 700; letter-spacing: 2rpx;
  margin-bottom: 10rpx; opacity: .8;
}
.warn .b { font-weight: 700; }

/* 弹层 */
.mask {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(15, 26, 38, .45); z-index: 90;
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; background: #fff; border-radius: 44rpx 44rpx 0 0;
  padding: 16rpx 36rpx 60rpx; max-height: 86vh; overflow-y: auto;
}
.handle { width: 76rpx; height: 8rpx; border-radius: 99rpx; background: var(--line); margin: 10rpx auto 26rpx; }
.tch-hero { display: flex; gap: 24rpx; align-items: flex-start; }
.sh-title { font-size: 36rpx; font-weight: 800; letter-spacing: -1rpx; line-height: 1.3; }
.row-pill { display: flex; gap: 10rpx; margin-top: 10rpx; flex-wrap: wrap; }
.ver { font-size: 20rpx; color: var(--muted); margin-top: 10rpx; }
.sh-lead { font-size: 25rpx; color: var(--muted); line-height: 1.7; }
.mt { margin-top: 22rpx; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin-top: 28rpx; }
.two-col .c {
  border-radius: 20rpx; padding: 20rpx 22rpx;
  font-size: 22rpx; line-height: 1.65; border: 1px solid;
}
.two-col .c .lb {
  font-size: 18rpx; font-weight: 700; letter-spacing: 1.5rpx;
  margin-bottom: 10rpx; opacity: .75; display: block;
}
.two-col .ok { background: var(--down-soft); border-color: var(--ok-line); color: var(--ok-ink-2); }
.two-col .no { background: var(--up-soft); border-color: var(--bad-line); color: var(--bad-ink); }
.two-col .warn2 { background: var(--gold-soft); border-color: var(--gold-line); color: var(--gold-ink-2); }
.c.warn2.full {
  margin-top: 16rpx; border-radius: 20rpx; padding: 20rpx 22rpx;
  font-size: 22rpx; line-height: 1.65; border: 1px solid var(--gold-line);
  background: var(--gold-soft); color: var(--gold-ink-2);
}
.c.warn2.full .lb {
  font-size: 18rpx; font-weight: 700; letter-spacing: 1.5rpx;
  margin-bottom: 10rpx; opacity: .75; display: block;
}

.sh-block { margin-top: 32rpx; }
.sh-block .k {
  font-size: 19rpx; letter-spacing: 2rpx; color: var(--muted);
  font-weight: 700; margin-bottom: 14rpx;
}
.li {
  font-size: 24rpx; color: var(--ink-2); line-height: 1.7;
  padding-left: 26rpx; position: relative; margin-bottom: 12rpx;
}
.li::before {
  content: ''; position: absolute; left: 0; top: 16rpx;
  width: 10rpx; height: 10rpx; border-radius: 50%; background: var(--brand-2); opacity: .5;
}
.stxt { font-size: 23rpx; color: var(--ink-2); line-height: 1.75; }
.stxt.dim { color: var(--muted); margin-top: 6rpx; }
.stxt .b { font-weight: 700; }

.rulebox { margin-top: 24rpx; border: 1px solid var(--line); border-radius: 20rpx; overflow: hidden; }
.rulebox .rh {
  font-size: 18rpx; font-weight: 700; letter-spacing: 2rpx;
  background: var(--brand-soft); color: var(--brand-2); padding: 16rpx 24rpx;
}
.rulebox .ri {
  display: flex; justify-content: space-between; gap: 20rpx;
  padding: 18rpx 24rpx; font-size: 23rpx; border-top: 1px solid var(--line-2);
}
.rulebox .ri text:first-child { color: var(--muted); flex: 0 0 auto; }
.rulebox .ri text:last-child { font-weight: 700; color: var(--brand-2); text-align: right; }
.rulebox .forbid {
  padding: 18rpx 24rpx; border-top: 1px solid var(--line-2);
  font-size: 21rpx; color: var(--bad-ink); background: var(--bad-bg-2); line-height: 1.7;
}
.rulebox .forbid .b { font-weight: 700; }
</style>
