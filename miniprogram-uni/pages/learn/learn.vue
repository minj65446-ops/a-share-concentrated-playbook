<template>
  <view class="page">

    <view class="hero">
      <view class="kicker">CONCENTRATED SYSTEM</view>
      <view class="h1">集中不是买得少{{ '\n' }}是看得比别人深</view>
      <view class="p">8 门课，从「先活下来」到「只做最强的一只」。每门课配一道图判题，别只是读。</view>
      <view class="row">
        <view class="btn primary" @click="go('train')">开始训练</view>
        <view class="btn ghost" @click="openNext">继续上次</view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">学习路径</view>
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
      <view class="h">今日任务</view>
      <view class="s">约 5 分钟</view>
    </view>
    <view class="card pad">
      <view class="task-t">读一根不属于你的 K 线</view>
      <view class="task-d">随机出现，形态不告诉你。先在图上判断，再看解析——顺序反了就学不到东西。</view>
      <view class="btn primary mt" @click="go('train')">去训练</view>
    </view>

    <!-- 详情弹层 -->
    <view class="mask" v-if="cur" @click="cur = null">
      <view class="sheet" @click.stop>
        <view class="handle"></view>
        <view class="sh-title">{{ cur.title }}</view>
        <view class="sh-lead">{{ cur.sub }}</view>
        <view class="sh-block">
          <view class="k">为什么</view>
          <view class="txt">{{ cur.why }}</view>
        </view>
        <view class="sh-block">
          <view class="k">三个要点</view>
          <view class="li" v-for="(p, i) in cur.points" :key="i">{{ p }}</view>
        </view>
        <view class="warn"><text class="b">常见死法：</text>{{ cur.bad }}</view>
        <view class="row2">
          <view class="btn primary" @click="markDone">标记完成</view>
          <view class="btn" @click="toDoc">看完整规则</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { COURSES } from '../../common/courses.js'

export default {
  data() {
    return { courses: COURSES, cur: null, done: [] }
  },
  onShow() {
    this.done = uni.getStorageSync('ta_done') || []
  },
  methods: {
    go(tab) {
      const map = { learn: 0, train: 1, map: 2, me: 3 }
      uni.switchTab({ url: '/pages/' + tab + '/' + tab })
    },
    open(c) { this.cur = c },
    openNext() {
      const next = this.courses.find(c => !this.done.includes(c.id)) || this.courses[0]
      this.cur = next
    },
    markDone() {
      const d = uni.getStorageSync('ta_done') || []
      if (!d.includes(this.cur.id)) d.push(this.cur.id)
      uni.setStorageSync('ta_done', d)
      this.done = d
      const id = this.cur.id
      this.cur = null
      uni.showToast({ title: '已完成 ' + id, icon: 'none' })
    },
    toDoc() {
      // H5 端跳文档；小程序端需改为 webview 或内嵌页
      // #ifdef H5
      window.location.href = 'playbook.html#' + 'playbook'
      // #endif
      // #ifndef H5
      uni.showToast({ title: '小程序内请查看「规则」页', icon: 'none' })
      // #endif
    }
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
.row2 { display: flex; gap: 16rpx; margin-top: 32rpx; }
.row2 .btn { flex: 1; }

.course {
  display: flex; align-items: center; gap: 22rpx;
  background: #fff; border: 1px solid $line; border-radius: $r;
  padding: 26rpx; margin-bottom: 18rpx;
}
.no {
  width: 80rpx; height: 80rpx; border-radius: 22rpx; flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 23rpx; font-weight: 800; color: $brand-2; background: $brand-soft;
}
.no.dim { color: $muted; background: $bg-2; }
.body { flex: 1; min-width: 0; }
.t { font-size: 29rpx; font-weight: 750; letter-spacing: -.4rpx; }
.sub { font-size: 23rpx; color: $muted; margin-top: 4rpx; line-height: 1.5; }
.meta { display: flex; gap: 10rpx; margin-top: 14rpx; flex-wrap: wrap; }
.ring {
  width: 72rpx; height: 72rpx; border-radius: 50%; flex: 0 0 auto;
  border: 2rpx solid $line-2;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: $muted;
}
.ring.on { border-color: $down; color: $down; background: $down-soft; font-weight: 800; }

.pad { padding: 28rpx; }
.task-t { font-size: 27rpx; font-weight: 700; }
.task-d { font-size: 23rpx; color: $muted; line-height: 1.7; margin-top: 6rpx; }
.mt { margin-top: 20rpx; }

.mask {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(15, 26, 38, .45); z-index: 90;
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; background: #fff; border-radius: 44rpx 44rpx 0 0;
  padding: 16rpx 36rpx 56rpx; max-height: 80vh; overflow-y: auto;
}
.handle { width: 76rpx; height: 8rpx; border-radius: 99rpx; background: $line; margin: 10rpx auto 26rpx; }
.sh-title { font-size: 36rpx; font-weight: 800; letter-spacing: -.6rpx; }
.sh-lead { font-size: 24rpx; color: $muted; margin-top: 8rpx; line-height: 1.7; }
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
.warn {
  margin-top: 26rpx; background: $gold-soft; border: 1px solid #f0e2c0;
  border-radius: $r-sm; padding: 20rpx 22rpx;
  font-size: 23rpx; color: #6b521a; line-height: 1.7;
}
.warn .b { font-weight: 700; }
</style>
