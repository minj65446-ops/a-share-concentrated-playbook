<script>
export default {
  onLaunch() {
    // 本地进度：uni.setStorageSync('ta_done', ['01','02'])
    const done = uni.getStorageSync('ta_done')
    if (!done) uni.setStorageSync('ta_done', [])
  },
  onShow() {},
  onHide() {}
}
</script>

<style>
/* 全局：与 Web 端 device 容器同源 */
page {
  background: #f4f5f7;
  color: #0f1a26;
  font-size: 28rpx;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}
view, text, button, input { box-sizing: border-box; }
button::after { border: none; }

.page { padding: 32rpx 32rpx 160rpx; }
.card {
  background: #fff;
  border: 1px solid #e5e8ed;
  border-radius: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(15,26,38,.05);
}
.sec-title {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 44rpx 4rpx 20rpx;
}
.sec-title .h { font-size: 32rpx; font-weight: 800; letter-spacing: -0.5rpx; }
.sec-title .s { font-size: 23rpx; color: #7b8794; }

.pill {
  display: inline-block; font-size: 21rpx; font-weight: 700;
  padding: 6rpx 16rpx; border-radius: 99rpx;
  background: #eceef2; color: #35414f;
}
.pill.up { background: #fdecea; color: #d94a45; }
.pill.down { background: #e8f6f0; color: #17855f; }
.pill.gold { background: #fdf5e3; color: #b07c17; }
.pill.brand { background: #eef3f9; color: #20456e; }

.btn {
  display: flex; align-items: center; justify-content: center;
  height: 84rpx; border-radius: 20rpx; font-size: 27rpx; font-weight: 700;
  background: #eceef2; color: #0f1a26; border: 1px solid #e5e8ed;
}
.btn.primary { background: #16283f; color: #fff; border-color: #16283f; }
.btn.ghost { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.24); }
</style>
