<script>
export default {
  globalData: {
    theme: 'light'
  },
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
/* ============================================================
   默认主题（晨光蓝）。其余 4 套在下面的 .t-* 类里覆盖同名变量，
   挂在页面根节点上向下继承。整段由 tools/gen-theme.js 从 Web 端生成。
   ============================================================ */
/* THEMES:BEGIN · 由 tools/gen-theme.js 从 Web 端 app.css / themes.css 生成，勿手改 */
page {
  --bg:#f6f7f9;
  --bg-2:#eff1f4;
  --card:#ffffff;
  --card-2:#fbfcfd;
  --ink:#1c2836;
  --ink-2:#485566;
  --muted:#8c97a4;
  --line:#e8ebef;
  --line-2:#f1f3f6;
  --brand:#3d5a78;
  --brand-2:#5a7fa6;
  --brand-soft:#eef3f9;
  --up:#d94a45;
  --up-soft:#fdecea;
  --down:#17855f;
  --down-soft:#e8f6f0;
  --gold:#b07c17;
  --gold-soft:#fdf5e3;
  --r-lg:40rpx;
  --r:28rpx;
  --r-sm:20rpx;
  --ok-line:#d5ece3;
  --ok-ink:#155a40;
  --ok-ink-2:#186349;
  --bad-line:#f3dad7;
  --bad-ink:#8d332d;
  --bad-ink-2:#923a33;
  --bad-bg-2:#fefbfa;
  --gold-line:#f0e3c4;
  --gold-ink:#8c6c25;
  --gold-ink-2:#6d5520;
  --brand-line:#dfe7f0;
  --brand-line-2:#d6dfe9;
  --hero-mid:#4a6c8e;
  --hero-end:#54799f;
  --panel-1:#fcfdfe;
  --panel-2:#f4f6f9;
}
.t-dark {
  --bg:#0e131a;
  --bg-2:#0a0e14;
  --card:#161c26;
  --card-2:#1b2230;
  --ink:#e8edf4;
  --ink-2:#b8c2d0;
  --muted:#7c8798;
  --line:#252d3a;
  --line-2:#1f2733;
  --brand:#4a90d9;
  --brand-2:#7fb3ea;
  --brand-soft:#182a3f;
  --up:#ff5f5a;
  --up-soft:#3a1f20;
  --down:#28c07d;
  --down-soft:#14322a;
  --gold:#e0a83a;
  --gold-soft:#33280f;
  --r-lg:40rpx;
  --r:28rpx;
  --r-sm:20rpx;
  --ok-line:#20493c;
  --ok-ink:#7fd6b0;
  --ok-ink-2:#5cc79b;
  --bad-line:#4a2626;
  --bad-ink:#ff9b95;
  --bad-ink-2:#ff8f88;
  --bad-bg-2:#241618;
  --gold-line:#4a3c1c;
  --gold-ink:#e8c069;
  --gold-ink-2:#d4ab52;
  --brand-line:#25405c;
  --brand-line-2:#2b3a4d;
  --hero-mid:#1f5b96;
  --hero-end:#2b7fc4;
  --panel-1:#1a212c;
  --panel-2:#141a23;
}
.t-paper {
  --bg:#faf7f0;
  --bg-2:#f1ebdf;
  --card:#fffdf8;
  --card-2:#faf5ec;
  --ink:#1e1a14;
  --ink-2:#4a4237;
  --muted:#8a7f6d;
  --line:#e3dbc9;
  --line-2:#efe8da;
  --brand:#7a3b2e;
  --brand-2:#9c5340;
  --brand-soft:#f7ece6;
  --up:#c0392b;
  --up-soft:#fbeae6;
  --down:#1e7a52;
  --down-soft:#e6f2ea;
  --gold:#a67c0d;
  --gold-soft:#faf1d8;
  --r-lg:40rpx;
  --r:28rpx;
  --r-sm:20rpx;
  --ok-line:#cfe3d5;
  --ok-ink:#1e5c3e;
  --ok-ink-2:#2c7a52;
  --bad-line:#edcec6;
  --bad-ink:#8f2f24;
  --bad-ink-2:#9c3b2e;
  --bad-bg-2:#fdf6f3;
  --gold-line:#e8d8a8;
  --gold-ink:#8a6a10;
  --gold-ink-2:#6b521a;
  --brand-line:#e6d5cc;
  --brand-line-2:#d9c8bd;
  --hero-mid:#8f4a38;
  --hero-end:#a9614a;
  --panel-1:#fffdf8;
  --panel-2:#f6f0e4;
}
.t-mono {
  --bg:#ffffff;
  --bg-2:#f7f7f8;
  --card:#ffffff;
  --card-2:#fafafa;
  --ink:#0a0a0a;
  --ink-2:#3f3f46;
  --muted:#8b8b93;
  --line:#e7e7e9;
  --line-2:#f2f2f3;
  --brand:#0a0a0a;
  --brand-2:#2b2b31;
  --brand-soft:#f2f2f3;
  --up:#d92d20;
  --up-soft:#fdeceb;
  --down:#067647;
  --down-soft:#e6f5ee;
  --gold:#a15c07;
  --gold-soft:#fdf3e3;
  --r-lg:28rpx;
  --r:20rpx;
  --r-sm:14rpx;
  --ok-line:#c8e6d6;
  --ok-ink:#07553a;
  --ok-ink-2:#0b6b48;
  --bad-line:#f2c9c5;
  --bad-ink:#912018;
  --bad-ink-2:#9e2219;
  --bad-bg-2:#fdf7f6;
  --gold-line:#e8d5b0;
  --gold-ink:#7d4a08;
  --gold-ink-2:#5e3706;
  --brand-line:#e0e0e3;
  --brand-line-2:#d4d4d8;
  --hero-mid:#26262b;
  --hero-end:#3f3f46;
  --panel-1:#ffffff;
  --panel-2:#f7f7f8;
}
.t-celadon {
  --bg:#f2f6f5;
  --bg-2:#e7eeec;
  --card:#ffffff;
  --card-2:#f7faf9;
  --ink:#12241f;
  --ink-2:#33524a;
  --muted:#74908a;
  --line:#dde7e4;
  --line-2:#eaf1ef;
  --brand:#12594c;
  --brand-2:#1a7a68;
  --brand-soft:#e6f2ef;
  --up:#d6453f;
  --up-soft:#fbeceb;
  --down:#0f8a5f;
  --down-soft:#e5f4ed;
  --gold:#a67c0d;
  --gold-soft:#fbf3df;
  --r-lg:40rpx;
  --r:28rpx;
  --r-sm:20rpx;
  --ok-line:#c9e5d8;
  --ok-ink:#12563f;
  --ok-ink-2:#14754f;
  --bad-line:#f0ccc7;
  --bad-ink:#8f2f26;
  --bad-ink-2:#9c3b30;
  --bad-bg-2:#fdf7f5;
  --gold-line:#e6d7ab;
  --gold-ink:#7f6110;
  --gold-ink-2:#5e4708;
  --brand-line:#cfe0da;
  --brand-line-2:#c3d6d0;
  --hero-mid:#1a6f5e;
  --hero-end:#22897a;
  --panel-1:#fbfdfc;
  --panel-2:#f1f6f4;
}
/* THEMES:END */

page {
  background: var(--bg);
  color: var(--ink);
  font-size: 28rpx;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}
view, text, button, input { box-sizing: border-box; }
button::after { border: none; }

/* 页面根节点：主题类挂这里，变量向下继承 */
.page {
  padding: 32rpx 32rpx 160rpx;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: 0 2rpx 10rpx rgba(15,26,38,.05);
}
.sec-title {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 44rpx 4rpx 20rpx;
}
.sec-title .h { font-size: 32rpx; font-weight: 800; letter-spacing: -0.5rpx; color: var(--ink); }
.sec-title .s { font-size: 23rpx; color: var(--muted); }

.pill {
  display: inline-block; font-size: 21rpx; font-weight: 700;
  padding: 6rpx 16rpx; border-radius: 99rpx;
  background: var(--bg-2); color: var(--ink-2);
}
.pill.up { background: var(--up-soft); color: var(--up); }
.pill.down { background: var(--down-soft); color: var(--down); }
.pill.gold { background: var(--gold-soft); color: var(--gold); }
.pill.brand { background: var(--brand-soft); color: var(--brand-2); }

.btn {
  display: flex; align-items: center; justify-content: center;
  height: 84rpx; border-radius: var(--r-sm); font-size: 27rpx; font-weight: 700;
  background: var(--bg-2); color: var(--ink); border: 1px solid var(--line);
}
.btn.primary { background: var(--brand); color: #fff; border-color: var(--brand); }
.btn.ghost { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.24); }

/* ---------- 界面风格选择（Web 端同款，见 themes.css） ---------- */
.themes { display: flex; flex-wrap: wrap; gap: 20rpx; }
.tcard {
  width: 339rpx; position: relative; overflow: hidden;
  border: 1px solid var(--line); border-radius: var(--r); background: var(--card);
}
.tcard.on { border-color: var(--brand-2); box-shadow: 0 0 0 5rpx rgba(32,69,110,.10); }
.tcard .ck {
  position: absolute; top: 16rpx; right: 16rpx; width: 34rpx; height: 34rpx;
  border-radius: 50%; background: var(--brand); color: #fff;
  font-size: 20rpx; font-weight: 800; display: flex; align-items: center; justify-content: center;
}
.tcard .pv { padding: 24rpx 24rpx 20rpx; }
.tcard .row1 { display: flex; align-items: center; gap: 12rpx; margin-bottom: 18rpx; }
.tcard .dot { width: 32rpx; height: 32rpx; border-radius: 10rpx; background: var(--brand); }
.tcard .nm { font-size: 25rpx; font-weight: 700; color: var(--ink); }
.tcard .ln { height: 12rpx; border-radius: 99rpx; background: var(--line); margin-bottom: 10rpx; }
.tcard .ln.m { width: 88%; }
.tcard .ln.s { width: 62%; }
.tcard .ln.hi { background: linear-gradient(90deg, var(--brand), var(--brand-2)); }
.tcard .tag {
  display: inline-block; margin-top: 16rpx; font-size: 20rpx; font-weight: 700;
  padding: 6rpx 14rpx; border-radius: 99rpx; background: var(--brand-soft); color: var(--brand-2);
}
.tcard .ft {
  padding: 14rpx 24rpx; border-top: 1px solid var(--line);
  background: var(--card-2); font-size: 22rpx; color: var(--muted); line-height: 1.5;
}
</style>
