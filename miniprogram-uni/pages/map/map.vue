<template>
  <view class="page" :class="themeCls">
    <view class="sec-title">
      <view class="h">市场阶段</view>
      <view class="s">仓位由阶段决定</view>
    </view>

    <view class="seg">
      <view v-for="(s, i) in stages" :key="s.name" class="seg-b"
            :class="{ on: i === cur }" @click="cur = i">{{ s.name }}</view>
    </view>

    <view class="card cycle">
      <view class="stage">
        <view class="sn">{{ stage.name }}</view>
        <view class="pos">{{ stage.pos }}</view>
      </view>
      <view class="desc">{{ stage.desc }}</view>
      <view class="bar"><view class="fill" :style="{ width: stage.pct + '%' }"></view></view>

      <view class="split">
        <view class="box do">
          <view class="bk">该做</view>
          <view class="li" v-for="(x, j) in stage.do" :key="j">{{ x }}</view>
        </view>
        <view class="box dont">
          <view class="bk">不该做</view>
          <view class="li" v-for="(x, j) in stage.dont" :key="j">{{ x }}</view>
        </view>
      </view>
    </view>

    <view class="sec-title">
      <view class="h">策略 × 市况</view>
      <view class="s">左右滑动</view>
    </view>

    <scroll-view scroll-x class="mxrow">
      <view class="mx" v-for="m in matrix" :key="m.q">
        <view class="qt">{{ m.q }}</view>
        <view class="mt">{{ m.items[0][1] }}</view>
        <view class="item" v-for="(it, j) in m.items.slice(1)" :key="j">
          <text>{{ it[0] }}</text><text class="v">{{ it[1] }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="card pad">
      <view class="bk">一条铁律</view>
      <view class="rule">
        阶段判断错误的代价，远大于选股错误的代价。选错一只股票亏 8%，判断错阶段满仓扛一轮下跌亏 30%。先定阶段，再定仓位，最后才选股。
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      theme: 'light',
      cur: 0,
      stages: [
        { name: '冰点', pos: '0–20%', pct: 12,
          desc: '跌停家数最多，连板高度归零，交易群没人说话。这个阶段唯一要做的是活着。',
          do: ['空仓，或极轻仓试错', '观察谁在逆势抗跌', '把股票池删到 10 只以内'],
          dont: ['抄「跌了很多」的票', '重仓博反弹', '频繁换股找机会'] },
        { name: '启动', pos: '20–40%', pct: 30,
          desc: '新题材开始出现，首板数量回升，但持续性还没验证。轻仓试错，只做最强的那个方向。',
          do: ['小仓位试错，只做首板或 1 进 2', '记录哪些方向有资金反复做', '严格止损，错了立刻换'],
          dont: ['一次就重仓', '同时试三个方向', '把试探仓当底仓拿'] },
        { name: '发酵', pos: '60–80%', pct: 72,
          desc: '主线明确，板块内涨停家数扩散，梯队完整。这是全年最该重仓的阶段，也是最少出现的阶段。',
          do: ['仓位提到 6–8 成，聚焦主线', '只在盈利头寸上加仓', '跟随 5 日线或 10 日线持有'],
          dont: ['这时候才刚开始研究', '分散到杂毛股', '提前「落袋为安」'] },
        { name: '退潮', pos: '0–10%', pct: 8,
          desc: '高标断板、批量跌停、赚钱效应消失。这个阶段的正确操作是空仓，而不是「找个跌得少的」。',
          do: ['清仓，不做任何反抽', '复盘这一轮赚在哪、亏在哪', '等下一个冰点'],
          dont: ['逆势做龙头二波', '补仓摊低成本', '相信「这次不一样」'] }
      ],
      matrix: [
        { q: '趋势市 · 行业分化', items: [['主策略', '趋势动量'], ['持仓', '3–5 只'], ['行业数', '1–2 个'], ['单票上限', '25%'], ['止损', '−8% / 2ATR']] },
        { q: '震荡市 · 无主线', items: [['主策略', '核心卫星'], ['持仓', '5–8 只'], ['行业数', '3 个以上'], ['单票上限', '20%'], ['总仓位', '30%–50%']] },
        { q: '下跌市 · 退潮', items: [['主策略', '空仓'], ['持仓', '0–1 只'], ['总仓位', '0%–20%'], ['单票上限', '10%'], ['动作', '等待冰点']] },
        { q: '底部区 · 景气反转', items: [['主策略', '困境反转'], ['持仓', '3–5 只'], ['行业数', '2 个以上'], ['单票上限', '20%'], ['建仓', '左侧分三笔']] }
      ]
    }
  },
  computed: {
    themeCls() { return 't-' + this.theme },

    stage() { return this.stages[this.cur] }
  }
}
</script>

<style lang="scss" scoped>
.seg {
  display: flex; gap: 8rpx; background: #fff; border: 1px solid var(--line);
  border-radius: 99rpx; padding: 8rpx; margin-bottom: 24rpx;
}
.seg-b {
  flex: 1; text-align: center; font-size: 25rpx; font-weight: 700;
  padding: 16rpx 0; border-radius: 99rpx; color: var(--muted);
}
.seg-b.on { background: var(--brand); color: #fff; }

.cycle { padding: 32rpx; }
.stage { display: flex; align-items: baseline; justify-content: space-between; }
.sn { font-size: 36rpx; font-weight: 800; }
.pos { font-size: 40rpx; font-weight: 800; color: var(--brand-2); }
.desc { font-size: 24rpx; color: var(--muted); margin: 8rpx 0 24rpx; line-height: 1.7; }
.bar { height: 16rpx; border-radius: 99rpx; background: var(--line-2); overflow: hidden; margin-bottom: 28rpx; }
.fill { height: 100%; border-radius: 99rpx; background: linear-gradient(90deg, var(--brand-2), var(--up)); }

.split { display: flex; gap: 16rpx; }
.box { flex: 1; border-radius: var(--r-sm); padding: 20rpx 22rpx; }
.box.do { background: var(--down-soft); border: 1px solid var(--ok-line); }
.box.dont { background: var(--up-soft); border: 1px solid var(--bad-line); }
.box .bk { font-size: 20rpx; letter-spacing: 2rpx; font-weight: 700; margin-bottom: 10rpx; opacity: .8; }
.box.do .bk, .box.do .li { color: var(--ok-ink-2); }
.box.dont .bk, .box.dont .li { color: var(--bad-ink); }
.li { font-size: 22rpx; line-height: 1.7; padding-left: 20rpx; position: relative; margin-bottom: 6rpx; }
.li::before {
  content: ''; position: absolute; left: 0; top: 14rpx;
  width: 7rpx; height: 7rpx; border-radius: 50%; background: currentColor; opacity: .5;
}

.mxrow { white-space: nowrap; width: 100%; }
.mx {
  display: inline-block; white-space: normal; vertical-align: top;
  width: 580rpx; margin-right: 18rpx;
  background: #fff; border: 1px solid var(--line); border-radius: var(--r); padding: 26rpx;
}
.qt { font-size: 20rpx; letter-spacing: 2rpx; color: var(--muted); font-weight: 600; }
.mt { font-size: 30rpx; font-weight: 800; margin: 10rpx 0 16rpx; }
.item {
  display: flex; justify-content: space-between; font-size: 23rpx;
  padding: 12rpx 0; border-bottom: 1px solid var(--line-2); color: var(--ink-2);
}
.item:last-child { border-bottom: none; }
.item .v { color: var(--brand-2); font-weight: 700; }

.pad { padding: 28rpx; margin-top: 20rpx; }
.bk { font-size: 20rpx; letter-spacing: 2rpx; color: var(--muted); font-weight: 600; text-transform: uppercase; margin-bottom: 10rpx; }
.rule { font-size: 25rpx; line-height: 1.8; color: var(--ink-2); }
</style>
