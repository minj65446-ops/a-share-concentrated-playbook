<template>
  <view class="page">

    <view class="hero">
      <view class="kicker">FROM ZERO TO SYSTEM</view>
      <view class="h1">从小白到有系统{{ '\n' }}中间只差五段路</view>
      <view class="p">先知道股票是什么，再学怎么算亏多少，最后找到适合你的那一派。顺序反了就学不会。</view>
      <view class="row">
        <view class="btn primary" @click="go('train')">开始训练</view>
        <view class="btn ghost" @click="openNext">继续上次</view>
      </view>
    </view>

    <!-- 当前段位 -->
    <view class="rankcard">
      <view class="top">
        <view class="tl">
          <text class="lv">{{ cur.allDone ? '已满级' : ('LV ' + (cur.idx + 1) + ' / 5') }}</text>
          <view class="nm">{{ cur.rank.name }}{{ cur.allDone ? ' · 通关' : '' }}</view>
          <view class="en">{{ cur.rank.en }}</view>
          <view class="sub">{{ cur.rank.sub }}</view>
        </view>
        <view class="pct">
          <view class="pn">{{ cur.allDone ? 100 : cur.pct }}%</view>
          <view class="pl">本段进度</view>
        </view>
      </view>
      <view class="rankbar"><view class="fi" :style="{ width: (cur.allDone ? 100 : cur.pct) + '%' }"></view></view>
      <view class="goal">{{ cur.rank.goal }}</view>
      <view class="after"><text class="b">毕业后：</text>{{ cur.rank.after }}</view>
    </view>

    <view class="sec-title">
      <view class="h">五段路径</view>
      <view class="s">点开看毕业标准</view>
    </view>
    <view class="ranklist">
      <view class="rk" v-for="(x, i) in cur.list" :key="x.r.id"
            :class="{ passed: x.passed, active: x.active }" @click="openRank(i)">
        <view class="badge">{{ x.passed ? '✓' : x.r.id }}</view>
        <view class="body">
          <view class="t">{{ x.r.name }}<text class="en">{{ x.r.en }}</text></view>
          <view class="s">{{ x.r.need }}</view>
          <view class="mini"><view class="fi" :style="{ width: miniPct(x) + '%' }"></view></view>
        </view>
        <view class="chev">›</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">Lv1 启蒙 · 先搞懂是什么</view>
      <view class="s">{{ basics.length }} / {{ BASICS.length }}</view>
    </view>
    <view class="intro">这 13 条不讲任何策略。它们只回答一个问题：你买的到底是什么。跳过这一层直接学战法，是大多数人学不会的原因。</view>
    <view class="path">
      <block v-for="g in GROUPS" :key="g">
        <view class="grp-label">{{ g }}</view>
        <view class="basic" v-for="b in groupOf(g)" :key="b.no"
              :class="{ read: basics.includes(b.no) }" @click="openBasic(b.no)">
          <view class="no">{{ basics.includes(b.no) ? '✓' : b.no }}</view>
          <view class="bd">
            <view class="bt">{{ b.title }}</view>
            <view class="one">{{ b.one }}</view>
          </view>
          <view class="tick">{{ basics.includes(b.no) ? '✓' : '' }}</view>
        </view>
      </block>
    </view>

    <view class="sec-title">
      <view class="h">课程 · 再学怎么做</view>
      <view class="s">{{ done.length }} / 8 完成</view>
    </view>
    <view class="course" v-for="c in courses" :key="c.id" @click="open(c)">
      <view class="no" :class="{ dim: !done.includes(c.id) }">{{ c.id }}</view>
      <view class="body">
        <view class="t">{{ c.title }}</view>
        <view class="sub">{{ c.sub }}</view>
        <view class="meta">
          <text class="pill">{{ c.level }}</text>
          <text class="pill">{{ c.min }} 分钟</text>
          <text class="pill" :class="c.risk.includes('高') ? 'up' : 'down'">风险 {{ c.risk }}</text>
        </view>
      </view>
      <view class="ring" :class="{ on: done.includes(c.id) }">
        <text>{{ done.includes(c.id) ? '✓' : '' }}</text>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">常见死法 · {{ DEATHS.length }} 个场景</view>
      <view class="s">见过就不用自己买一次</view>
    </view>
    <view class="intro">从小白到「大佬」之间，拉开差距的不是学了多少种方法，是见过多少种死法。没见过的人每种都要用自己的钱买一次；见过的人第一次遇到就能认出来。</view>
    <view class="path">
      <block v-for="g in DGROUPS" :key="g">
        <view class="grp-label">{{ g }}</view>
        <view class="death" v-for="d in deathOf(g)" :key="d.id" @click="openDeath(d.id)">
          <view class="no">{{ d.id.slice(1) }}</view>
          <view class="bd">
            <view class="dt">{{ d.title }}</view>
            <view class="dh"><text class="b">你以为：</text>{{ d.think }}</view>
          </view>
        </view>
      </block>
    </view>

    <view class="sec-title">
      <view class="h">流派自测</view>
      <view class="s">{{ quizText }}</view>
    </view>
    <view class="card pad">
      <!-- 未测 -->
      <block v-if="!saved">
        <view class="tip">8 道题，围绕三个硬约束：你能投入多少时间、能承受多大回撤、本金规模。测完直接跳到那一派的约束条件。</view>
        <view class="btn primary mt" @click="startQuiz">开始自测</view>
      </block>
      <!-- 已测 -->
      <block v-else>
        <view class="quiz-res">
          <view class="kick">你的倾向流派</view>
          <view class="qn">{{ schoolName(saved.top) }}</view>
          <view class="qs">匹配度 {{ saved.share }}%</view>
          <view class="qd">{{ schoolPromise(saved.top) }}</view>
        </view>
        <view class="row2">
          <view class="btn primary" @click="seeFit">看这一派的约束</view>
          <view class="btn" @click="redoQuiz">重测</view>
        </view>
      </block>
    </view>

    <view class="sec-title">
      <view class="h">今日任务</view>
      <view class="s">约 5 分钟</view>
    </view>
    <view class="card pad">
      <view class="task-t">读一根不属于你的 K 线</view>
      <view class="task-d">随机出现，形态不告诉你。先在图上判断，再看解析——顺序反了就学不到东西。</view>
      <view class="btn primary mt" @click="go('train')">去训练</view>
    </view>

    <!-- 详情弹层：课程 / 启蒙 / 段位 / 自测 -->
    <view class="mask" v-if="mode" @click="close">
      <view class="sheet" @click.stop>
        <view class="handle"></view>

        <!-- 课程 -->
        <block v-if="mode === 'course' && c2">
          <view class="sh-title">{{ c2.title }}</view>
          <view class="sh-lead">{{ c2.sub }}</view>
          <view class="sh-block">
            <view class="k">为什么</view>
            <view class="txt">{{ c2.why }}</view>
          </view>
          <view class="sh-block">
            <view class="k">三个要点</view>
            <view class="li" v-for="(p, i) in c2.points" :key="i">{{ p }}</view>
          </view>
          <view class="warn"><text class="b">常见死法：</text>{{ c2.bad }}</view>
          <view class="row2">
            <view class="btn primary" @click="markDone">标记完成</view>
            <view class="btn" @click="toDoc">看完整规则</view>
          </view>
        </block>

        <!-- Lv1 启蒙条目 -->
        <block v-if="mode === 'basic' && b2">
          <view class="chips">
            <text class="pill gold">Lv1 启蒙</text>
            <text class="pill">{{ b2.grp }}</text>
          </view>
          <view class="sh-title">{{ b2.title }}</view>
          <view class="sh-lead lead2">{{ b2.one }}</view>
          <view class="sh-block">
            <view class="k">为什么重要</view>
            <view class="txt">{{ b2.why }}</view>
          </view>
          <view class="sh-block">
            <view class="k">常见误解</view>
            <view class="txt">{{ b2.mis }}</view>
          </view>
          <view class="eg">
            <view class="egk">举个例子</view>
            <view class="egt">{{ b2.eg }}</view>
          </view>
          <view class="row2">
            <view class="btn primary" @click="markBasic">{{ basics.includes(b2.no) ? '已读 · 再看一遍' : '标记已读' }}</view>
            <view class="btn" v-if="b2.link" @click="toCourse">学相关课程</view>
          </view>
        </block>

        <!-- 段位详情 -->
        <block v-if="mode === 'rank' && r2">
          <view class="chips">
            <text class="pill brand">{{ r2.r.id }}</text>
            <text class="pill">{{ r2.r.en }}</text>
          </view>
          <view class="sh-title">{{ r2.r.name }}</view>
          <view class="sh-lead">{{ r2.r.sub }}</view>
          <view class="sh-block">
            <view class="k">这一阶段解决什么</view>
            <view class="txt">{{ r2.r.goal }}</view>
          </view>
          <view class="sh-block">
            <view class="k">毕业标准 · {{ r2.g.cur }}/{{ r2.g.total }}</view>
            <view class="chk" v-for="(d, i) in r2.g.detail" :key="i">
              <text class="mk" :class="{ on: d.on }">{{ d.on ? '✓' : '○' }}</text>
              <text class="ct" :class="{ on: d.on }">{{ d.t }}</text>
            </view>
            <view class="txt" v-if="!r2.g.detail">当前 {{ r2.g.cur }} / {{ r2.g.total }} {{ r2.g.unit }}</view>
          </view>
          <view class="warn"><text class="b">毕业后：</text>{{ r2.r.after }}</view>
        </block>

        <!-- 亏损案例 -->
        <block v-if="mode === 'death' && d2">
          <view class="chips">
            <text class="pill up">常见死法</text>
            <text class="pill">{{ d2.grp }}</text>
          </view>
          <view class="sh-title">{{ d2.title }}</view>
          <view class="dt-scene"><text class="b">场景：</text>{{ d2.scene }}</view>
          <view class="dt-k">你以为</view>
          <view class="txt">{{ d2.think }}</view>
          <view class="dt-k">实际发生了什么</view>
          <view class="txt">{{ d2.real }}</view>
          <view class="dt-bad"><text class="b">代价：</text>这笔亏损只是开始——真正的代价是它会重复发生，直到你认出这个模式。</view>
          <view class="dt-fix"><text class="b">正确做法：</text>{{ d2.fix }}</view>
          <view class="row2">
            <view class="btn" v-if="d2.link" @click="toBasicFromDeath">看相关启蒙条目</view>
            <view class="btn primary" @click="close">知道了</view>
          </view>
        </block>

        <!-- 自测答题 -->
        <block v-if="mode === 'quiz' && q2">
          <view class="qbar">
            <text class="qtxt">{{ qi + 1 }} / {{ QUIZ.length }}</text>
            <view class="track"><view class="fi" :style="{ width: (qi / QUIZ.length * 100) + '%' }"></view></view>
          </view>
          <view class="qt">{{ q2.q }}</view>
          <view class="quiz-opt" v-for="(o, i) in q2.opts" :key="i"
                :class="{ on: picked === i, warn: isTrap(o) }" @click="pick(i)">
            <view class="ot">{{ o.t }}</view>
            <view class="nt">{{ o.note }}</view>
          </view>
          <view class="row2">
            <view class="btn" v-if="qi > 0" @click="prevQ">上一题</view>
            <view class="btn primary" @click="nextQ">{{ qi === QUIZ.length - 1 ? '看结果' : '下一题' }}</view>
          </view>
        </block>

        <!-- 自测结果 -->
        <block v-if="mode === 'qres' && res">
          <view class="quiz-res">
            <view class="kick">你倾向的流派</view>
            <view class="qn">{{ schoolName(res.top) }}</view>
            <view class="qs">匹配度 {{ res.share }}%</view>
            <view class="qd">{{ schoolPromise(res.top) }}</view>
          </view>
          <view class="rulebox" v-if="rule">
            <view class="rh">这一派对你的约束</view>
            <view class="ri"><text>最低资金</text><text>{{ rule.minCap }}</text></view>
            <view class="ri"><text>最大仓位</text><text>{{ rule.maxPos }}</text></view>
            <view class="ri"><text>止损方式</text><text>{{ rule.stop }}</text></view>
            <view class="ri"><text>交易频率</text><text>{{ rule.freq }}</text></view>
            <view class="forbid"><text class="b">明确不适合的人：</text>{{ rule.forbid.join('、') }}</view>
          </view>
          <view class="warn">自测结果只反映你现在的状态。资金量、可投入时间、承受力变了，答案也会变——建议资金或时间发生重大变化时重测一次。</view>
          <view class="row2">
            <view class="btn primary" @click="finishQuiz">知道了</view>
            <view class="btn" @click="redoQuiz">重测</view>
          </view>
        </block>
      </view>
    </view>
  </view>
</template>

<script>
import { COURSES } from '../../common/courses.js'
import { BASICS, GROUPS } from '../../common/basics.js'
import { DEATHS, DGROUPS } from '../../common/deaths.js'
import { RANKS, current, readState } from '../../common/rank.js'
import { QUIZ, result as quizResult } from '../../common/quiz.js'
import { SCHOOLS, RULES } from '../../common/teachers.js'

export default {
  data() {
    return {
      courses: COURSES,
      BASICS, GROUPS, DEATHS, DGROUPS, QUIZ, RANKS,
      cur: current(),
      basics: [],
      done: [],
      saved: null,
      mode: null,          // course | basic | rank | death | quiz | qres
      c2: null, b2: null, r2: null, d2: null,
      qi: 0, picked: -1, ans: {}, res: null
    }
  },
  computed: {
    quizText() {
      if (!this.saved) return '8 题 · 约 2 分钟'
      return '已测 · ' + this.schoolName(this.saved.top)
    },
    q2() {
      return this.qi < this.QUIZ.length ? this.QUIZ[this.qi] : null
    },
    rule() {
      return this.res ? (RULES[this.res.top] || null) : null
    }
  },
  onShow() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.basics = uni.getStorageSync('ta_basics') || []
      this.done = uni.getStorageSync('ta_done') || []
      this.saved = uni.getStorageSync('ta_quiz') || null
      this.cur = current()
    },
    go(tab) {
      uni.switchTab({ url: '/pages/' + tab + '/' + tab })
    },
    groupOf(g) { return BASICS.filter(x => x.grp === g) },
    deathOf(g) { return DEATHS.filter(x => x.grp === g) },
    openDeath(id) {
      this.d2 = DEATHS.find(x => x.id === id) || null
      this.mode = 'death'
    },
    toBasicFromDeath() {
      const no = this.d2.link
      this.close()
      if (no) setTimeout(() => this.openBasic(no), 200)
    },
    miniPct(x) { return x.g.total ? Math.round(x.g.cur / x.g.total * 100) : 0 },
    schoolName(k) {
      const s = SCHOOLS.find(x => x.k === k)
      return s ? s.name : k
    },
    schoolPromise(k) {
      const s = SCHOOLS.find(x => x.k === k)
      return s ? s.promise : ''
    },
    isTrap(o) { return Object.keys(o.w || {}).length === 0 },

    /* ---- 课程 ---- */
    open(c) { this.c2 = c; this.mode = 'course' },
    openNext() {
      const next = this.courses.find(c => !this.done.includes(c.id)) || this.courses[0]
      this.open(next)
    },
    markDone() {
      const d = uni.getStorageSync('ta_done') || []
      if (!d.includes(this.c2.id)) d.push(this.c2.id)
      uni.setStorageSync('ta_done', d)
      const id = this.c2.id
      this.close()
      this.refresh()
      uni.showToast({ title: '已完成 ' + id, icon: 'none' })
    },
    toDoc() {
      // #ifdef H5
      window.location.href = 'playbook.html#playbook'
      // #endif
      // #ifndef H5
      uni.showToast({ title: '小程序内请查看「规则」页', icon: 'none' })
      // #endif
    },

    /* ---- Lv1 启蒙 ---- */
    openBasic(no) {
      this.b2 = BASICS.find(x => x.no === no) || null
      this.mode = 'basic'
    },
    markBasic() {
      const d = uni.getStorageSync('ta_basics') || []
      if (d.indexOf(this.b2.no) < 0) d.push(this.b2.no)
      uni.setStorageSync('ta_basics', d)
      this.close()
      this.refresh()
      uni.showToast({ title: '已读', icon: 'none' })
    },
    toCourse() {
      const c = this.courses.find(x => x.id === this.b2.link)
      this.close()
      if (c) setTimeout(() => this.open(c), 200)
    },

    /* ---- 段位 ---- */
    openRank(i) {
      const r = RANKS[i]
      this.r2 = { r, g: r.check(readState()) }
      this.mode = 'rank'
    },

    /* ---- 流派自测 ---- */
    startQuiz() {
      this.qi = 0; this.picked = -1; this.ans = {}; this.res = null
      this.mode = 'quiz'
    },
    pick(i) { this.picked = i },
    prevQ() { this.qi--; this.picked = (this.ans[this.qi] != null ? this.ans[this.qi] : -1) },
    nextQ() {
      if (this.picked < 0) {
        uni.showToast({ title: '先选一个', icon: 'none' })
        return
      }
      this.ans[this.qi] = this.picked
      if (this.qi === this.QUIZ.length - 1) {
        this.res = quizResult(this.ans)
        this.mode = 'qres'
      } else {
        this.qi++
        this.picked = (this.ans[this.qi] != null ? this.ans[this.qi] : -1)
      }
    },
    finishQuiz() {
      if (this.res) uni.setStorageSync('ta_quiz', this.res)
      this.close()
      this.refresh()
    },
    redoQuiz() {
      uni.removeStorageSync('ta_quiz')
      this.startQuiz()
    },
    seeFit() {
      const k = this.saved ? this.saved.top : null
      if (!k) return
      uni.setStorageSync('ta_open_school', k)
      uni.switchTab({ url: '/pages/teacher/teacher' })
    },

    close() { this.mode = null; this.c2 = null; this.b2 = null; this.r2 = null; this.d2 = null }
  }
}
</script>

<style lang="scss" scoped>
.hero {
  background: linear-gradient(150deg, $brand 0%, #1c3f66 58%, #255a86 100%);
  border-radius: $r-lg;
  padding: 40rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(22, 40, 63, .24);
}
.kicker {
  font-size: 19rpx; letter-spacing: 4rpx; opacity: .7;
  margin-bottom: 18rpx; font-weight: 600;
}
.h1 { font-size: 42rpx; line-height: 1.35; font-weight: 800; letter-spacing: -1rpx; white-space: pre-line; }
.p { font-size: 24rpx; opacity: .78; margin-top: 14rpx; line-height: 1.65; }
.row { display: flex; gap: 16rpx; margin-top: 30rpx; }
.row .btn { flex: 0 0 auto; padding: 0 36rpx; height: 78rpx; }
.row2 { display: flex; gap: 16rpx; margin-top: 28rpx; }
.row2 .btn { flex: 1; }

/* 段位卡 */
.rankcard {
  background: linear-gradient(150deg, $brand 0%, #1c3f66 62%, #255a86 100%);
  border-radius: $r-lg; padding: 34rpx; color: #fff;
  box-shadow: 0 14rpx 34rpx rgba(22, 40, 63, .2);
}
.rankcard .top { display: flex; align-items: flex-start; justify-content: space-between; }
.tl { min-width: 0; flex: 1; }
.lv {
  font-size: 19rpx; letter-spacing: 3rpx; font-weight: 800;
  background: rgba(255, 255, 255, .16); padding: 5rpx 14rpx; border-radius: 99rpx;
}
.nm { font-size: 40rpx; font-weight: 800; letter-spacing: -1rpx; margin-top: 14rpx; }
.en { font-size: 19rpx; letter-spacing: 4rpx; opacity: .62; margin-top: 4rpx; font-weight: 600; }
.sub { font-size: 23rpx; opacity: .8; margin-top: 8rpx; line-height: 1.5; }
.pct { flex: 0 0 auto; text-align: right; padding-left: 16rpx; }
.pn { font-size: 40rpx; font-weight: 800; letter-spacing: -1rpx; }
.pl { font-size: 18rpx; opacity: .6; margin-top: 2rpx; }
.rankbar { height: 8rpx; background: rgba(255, 255, 255, .18); border-radius: 99rpx; margin-top: 22rpx; overflow: hidden; }
.rankbar .fi { height: 100%; background: #fff; border-radius: 99rpx; }
.goal { font-size: 24rpx; line-height: 1.7; margin-top: 20rpx; opacity: .9; }
.after {
  font-size: 22rpx; line-height: 1.65; margin-top: 14rpx; opacity: .72;
  border-top: 1rpx solid rgba(255, 255, 255, .16); padding-top: 14rpx;
}
.after .b { font-weight: 700; opacity: 1; }

/* 段位列表 */
.rk {
  display: flex; align-items: center; gap: 22rpx;
  background: #fff; border: 1rpx solid $line; border-radius: $r;
  padding: 24rpx; margin-bottom: 16rpx;
}
.rk.passed { background: $card-2; }
.rk.active { border-color: $brand-2; box-shadow: 0 6rpx 18rpx rgba(32, 69, 110, .1); }
.badge {
  width: 76rpx; height: 76rpx; border-radius: 22rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; font-weight: 800; color: $brand-2; background: $brand-soft;
}
.rk.passed .badge { color: $down; background: $down-soft; }
.rk.active .badge { color: #fff; background: $brand-2; }
.rk .body { flex: 1; min-width: 0; }
.rk .t { font-size: 28rpx; font-weight: 750; letter-spacing: -.4rpx; }
.rk .t .en { font-size: 19rpx; color: $muted; font-weight: 600; margin-left: 10rpx; }
.rk .s { font-size: 22rpx; color: $muted; margin-top: 4rpx; line-height: 1.5; }
.mini { height: 6rpx; background: $bg-2; border-radius: 99rpx; margin-top: 12rpx; overflow: hidden; }
.mini .fi { height: 100%; background: $brand-2; border-radius: 99rpx; }
.rk.passed .mini .fi { background: $down; }
.chev { font-size: 32rpx; color: $line; flex: 0 0 auto; }

.intro { font-size: 22rpx; color: $muted; line-height: 1.7; margin: 0 4rpx 16rpx; }
.grp-label {
  font-size: 20rpx; letter-spacing: 3rpx; font-weight: 700; color: $muted;
  text-transform: uppercase; margin: 18rpx 4rpx 12rpx;
}
.basic {
  display: flex; align-items: flex-start; gap: 20rpx;
  background: #fff; border: 1rpx solid $line; border-radius: $r;
  padding: 24rpx; margin-bottom: 14rpx;
}
.basic.read { background: $card-2; border-color: $line-2; }
.basic .no {
  width: 66rpx; height: 66rpx; border-radius: 20rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; font-weight: 800; color: $brand-2; background: $brand-soft;
}
.basic.read .no { color: $down; background: $down-soft; }
.basic .bd { flex: 1; min-width: 0; }
.bt { font-size: 27rpx; font-weight: 750; letter-spacing: -.4rpx; }
.one { font-size: 22rpx; color: $muted; line-height: 1.6; margin-top: 5rpx; }
.tick { font-size: 24rpx; color: $down; font-weight: 800; flex: 0 0 auto; width: 28rpx; text-align: center; }

/* 亏损案例 */
.death {
  display: flex; align-items: flex-start; gap: 20rpx;
  background: #fff; border: 1rpx solid $line; border-radius: $r;
  padding: 24rpx; margin-bottom: 14rpx;
}
.death .no {
  width: 66rpx; height: 66rpx; border-radius: 20rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; font-weight: 800; color: $up; background: $up-soft;
}
.death .bd { flex: 1; min-width: 0; }
.dt { font-size: 27rpx; font-weight: 750; letter-spacing: -.4rpx; }
.dh { font-size: 22rpx; color: $muted; line-height: 1.6; margin-top: 5rpx; }
.dh .b { color: $up; font-weight: 700; }

.dt-scene {
  margin-top: 18rpx; background: $bg-2; border-radius: $r-sm;
  padding: 20rpx 22rpx; font-size: 23rpx; line-height: 1.7; color: $ink-2;
}
.dt-scene .b { font-weight: 700; }
.dt-k {
  font-size: 20rpx; letter-spacing: 3rpx; color: $muted;
  font-weight: 700; margin: 26rpx 0 10rpx;
}
.dt-fix {
  margin-top: 22rpx; background: $down-soft; border: 1rpx solid #cfeadf;
  border-radius: $r-sm; padding: 22rpx;
  font-size: 24rpx; line-height: 1.75; color: #0f5138;
}
.dt-fix .b { font-weight: 700; }
.dt-bad {
  margin-top: 20rpx; background: $up-soft; border: 1rpx solid #f5cfca;
  border-radius: $r-sm; padding: 22rpx;
  font-size: 23rpx; line-height: 1.75; color: #8a2b26;
}
.dt-bad .b { font-weight: 700; }

/* 课程 */
.course {
  display: flex; align-items: center; gap: 22rpx;
  background: #fff; border: 1rpx solid $line; border-radius: $r;
  padding: 26rpx; margin-bottom: 18rpx;
}
.course .no {
  width: 80rpx; height: 80rpx; border-radius: 22rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 23rpx; font-weight: 800; color: $brand-2; background: $brand-soft;
}
.course .no.dim { color: $muted; background: $bg-2; }
.course .body { flex: 1; min-width: 0; }
.course .t { font-size: 29rpx; font-weight: 750; letter-spacing: -.4rpx; }
.course .sub { font-size: 23rpx; color: $muted; margin-top: 4rpx; line-height: 1.5; }
.meta { display: flex; gap: 10rpx; margin-top: 14rpx; flex-wrap: wrap; }
.ring {
  width: 72rpx; height: 72rpx; border-radius: 50%; flex: 0 0 auto;
  border: 2rpx solid $line-2;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: $muted;
}
.ring.on { border-color: $down; color: $down; background: $down-soft; font-weight: 800; }

/* 自测 */
.tip { font-size: 23rpx; color: $muted; line-height: 1.7; }
.quiz-res { text-align: center; padding: 10rpx 0 4rpx; }
.kick { font-size: 20rpx; letter-spacing: 3rpx; color: $muted; font-weight: 600; }
.qn { font-size: 40rpx; font-weight: 800; letter-spacing: -1rpx; margin-top: 10rpx; }
.qs { font-size: 24rpx; color: $gold; font-weight: 700; margin-top: 6rpx; }
.qd { font-size: 23rpx; color: $muted; line-height: 1.65; margin-top: 10rpx; }

.rulebox {
  margin-top: 22rpx; background: $card-2; border: 1rpx solid $line;
  border-radius: $r-sm; padding: 22rpx;
}
.rh { font-size: 21rpx; letter-spacing: 2rpx; color: $muted; font-weight: 700; margin-bottom: 12rpx; }
.ri { display: flex; justify-content: space-between; font-size: 23rpx; padding: 8rpx 0; color: $ink-2; }
.ri text:last-child { font-weight: 700; }
.forbid {
  margin-top: 12rpx; padding-top: 14rpx; border-top: 1rpx solid $line;
  font-size: 22rpx; color: $up; line-height: 1.65;
}
.forbid .b { font-weight: 700; }

/* 答题 */
.qbar { display: flex; align-items: center; gap: 16rpx; margin-bottom: 22rpx; }
.qtxt { font-size: 21rpx; font-weight: 700; color: $muted; flex: 0 0 auto; }
.track { flex: 1; height: 6rpx; background: $bg-2; border-radius: 99rpx; overflow: hidden; }
.track .fi { height: 100%; background: $brand-2; border-radius: 99rpx; }
.qt { font-size: 30rpx; font-weight: 750; line-height: 1.55; letter-spacing: -.4rpx; }
.quiz-opt {
  margin-top: 16rpx; padding: 22rpx; border: 1rpx solid $line;
  border-radius: $r-sm; background: #fff;
}
.quiz-opt.on { border-color: $brand-2; background: $brand-soft; }
.quiz-opt.warn.on { border-color: $up; background: $up-soft; }
.ot { font-size: 25rpx; font-weight: 650; line-height: 1.5; }
.nt { font-size: 21rpx; color: $muted; line-height: 1.6; margin-top: 8rpx; }

.pad { padding: 28rpx; }
.task-t { font-size: 27rpx; font-weight: 700; }
.task-d { font-size: 23rpx; color: $muted; line-height: 1.7; margin-top: 6rpx; }
.mt { margin-top: 20rpx; }

/* 弹层 */
.mask {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(15, 26, 38, .45); z-index: 90;
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; background: #fff; border-radius: 44rpx 44rpx 0 0;
  padding: 16rpx 36rpx 56rpx; max-height: 80vh; overflow-y: auto;
  box-sizing: border-box;
}
.handle { width: 76rpx; height: 8rpx; border-radius: 99rpx; background: $line; margin: 10rpx auto 26rpx; }
.chips { display: flex; gap: 10rpx; margin-bottom: 14rpx; }
.sh-title { font-size: 36rpx; font-weight: 800; letter-spacing: -.6rpx; }
.sh-lead { font-size: 24rpx; color: $muted; margin-top: 8rpx; line-height: 1.7; }
.lead2 { color: $brand-2; font-weight: 700; font-size: 26rpx; }
.sh-block { margin-top: 30rpx; }
.sh-block .k {
  font-size: 21rpx; letter-spacing: 2rpx; color: $muted;
  text-transform: uppercase; margin-bottom: 12rpx; font-weight: 600;
}
.sh-block .txt { font-size: 25rpx; line-height: 1.8; color: $ink-2; }
.li {
  font-size: 25rpx; color: $ink-2; line-height: 1.7;
  padding-left: 24rpx; position: relative; margin-bottom: 10rpx;
}
.li::before {
  content: ''; position: absolute; left: 0; top: 16rpx;
  width: 9rpx; height: 9rpx; border-radius: 50%; background: $brand-2; opacity: .5;
}
.eg {
  margin-top: 22rpx; padding: 22rpx; background: $brand-soft;
  border: 1rpx solid #dbe6f2; border-radius: $r-sm;
}
.egk { font-size: 19rpx; letter-spacing: 3rpx; color: $muted; font-weight: 700; margin-bottom: 10rpx; }
.egt { font-size: 23rpx; line-height: 1.75; color: $ink-2; }
.chk { display: flex; gap: 12rpx; align-items: flex-start; margin-bottom: 10rpx; }
.mk { font-size: 23rpx; font-weight: 800; color: $muted; flex: 0 0 auto; }
.mk.on { color: $down; }
.ct { font-size: 23rpx; color: $ink-2; line-height: 1.6; flex: 1; }
.ct.on { color: $down; }
.warn {
  margin-top: 26rpx; background: $gold-soft; border: 1rpx solid #f0e2c0;
  border-radius: $r-sm; padding: 20rpx 22rpx;
  font-size: 23rpx; color: #6b521a; line-height: 1.7;
}
.warn .b { font-weight: 700; }
</style>
