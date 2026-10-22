/**
 * 界面风格 · 主题元数据（小程序端）
 * 由 Web 端 trade-academy/theme.js 自动生成，请勿手改。
 * ------------------------------------------------------------
 * 颜色变量定义在 App.vue 的 .t-* 类里（同样由 tools/gen-theme.js 生成）。
 */
var THEMES = [
    { k:'light',   name:'晨光蓝',   cls:'t-light',   desc:'默认 · 券商蓝白，信息密度高' },
    { k:'dark',    name:'夜航深',   cls:'t-dark',    desc:'深色终端，夜里看盘不刺眼' },
    { k:'paper',   name:'纸感暖',   cls:'t-paper',   desc:'米白纸底 + 衬线标题，读长文舒服' },
    { k:'mono',    name:'极简黑白', cls:'t-mono',    desc:'纯黑白高对比，去掉一切装饰' },
    { k:'celadon', name:'青瓷',     cls:'t-celadon', desc:'低饱和青绿，长时间看不累' }
  ];

  var DEFAULT = 'light';

  function valid(k){
    for(var i=0;i<THEMES.length;i++){ if(THEMES[i].k === k) return true; }
    return false;
  }

  function nameOf(k){
    for(var i=0;i<THEMES.length;i++){ if(THEMES[i].k === k) return THEMES[i].name; }
    return THEMES[0].name;
  }

  /* K 线画布配色。小程序 canvas 拿不到 CSS 变量，所以画布用色统一放这里，
     Web 端也读同一份，避免两端两套颜色。 */
  var CANVAS = {
    light:   { grid:'#f0f2f5', bg:'#fafbfc', up:'#d94a45', down:'#17855f',
               volUp:'rgba(217,74,69,.32)', volDown:'rgba(23,133,95,.32)',
               ma5:'rgba(32,69,110,.55)', ma20:'rgba(176,124,23,.55)',
               axis:'rgba(15,26,38,.35)', mark:'rgba(32,69,110,.35)', markDone:'rgba(15,26,38,.22)',
               lab:'#20456e', labInk:'#ffffff' },
    dark:    { grid:'#232b37', bg:'#1b2230', up:'#ff5f5a', down:'#28c07d',
               volUp:'rgba(255,95,90,.34)', volDown:'rgba(40,192,125,.34)',
               ma5:'rgba(127,179,234,.60)', ma20:'rgba(224,168,58,.60)',
               axis:'rgba(232,237,244,.32)', mark:'rgba(127,179,234,.40)', markDone:'rgba(232,237,244,.22)',
               lab:'#7fb3ea', labInk:'#0e131a' },
    paper:   { grid:'#efe8da', bg:'#faf5ec', up:'#c0392b', down:'#1e7a52',
               volUp:'rgba(192,57,43,.30)', volDown:'rgba(30,122,82,.30)',
               ma5:'rgba(122,59,46,.50)', ma20:'rgba(166,124,13,.55)',
               axis:'rgba(30,26,20,.35)', mark:'rgba(122,59,46,.38)', markDone:'rgba(30,26,20,.20)',
               lab:'#7a3b2e', labInk:'#fffdf8' },
    mono:    { grid:'#f2f2f3', bg:'#fafafa', up:'#d92d20', down:'#067647',
               volUp:'rgba(217,45,32,.30)', volDown:'rgba(6,118,71,.30)',
               ma5:'rgba(10,10,10,.50)', ma20:'rgba(161,92,7,.55)',
               axis:'rgba(10,10,10,.35)', mark:'rgba(10,10,10,.38)', markDone:'rgba(10,10,10,.20)',
               lab:'#0a0a0a', labInk:'#ffffff' },
    celadon: { grid:'#eaf1ef', bg:'#f7faf9', up:'#d6453f', down:'#0f8a5f',
               volUp:'rgba(214,69,63,.30)', volDown:'rgba(15,138,95,.30)',
               ma5:'rgba(18,89,76,.55)', ma20:'rgba(166,124,13,.55)',
               axis:'rgba(18,36,31,.32)', mark:'rgba(18,89,76,.38)', markDone:'rgba(18,36,31,.20)',
               lab:'#1a7a68', labInk:'#ffffff' }
  };

  function canvas(k){
    return CANVAS[k] || CANVAS[DEFAULT];
  }
/* 小程序端存裸字符串（Web 端是 JSON.stringify），两端互相兼容读取 */
export function read() {
  let v = ''
  try { v = uni.getStorageSync('ta_theme') || '' } catch (err) {}
  if (!v) return DEFAULT
  if (v.charAt(0) === '"') { try { v = JSON.parse(v) } catch (err) { return DEFAULT } }
  return valid(v) ? v : DEFAULT
}

export function apply(k) {
  if (!valid(k)) k = DEFAULT
  try { uni.setStorageSync('ta_theme', k) } catch (err) {}
  const nav = {
    light: ['#000000', '#f4f5f7'],
    dark: ['#ffffff', '#0e131a'],
    paper: ['#000000', '#faf7f0'],
    mono: ['#000000', '#ffffff'],
    celadon: ['#000000', '#f2f6f5']
  }[k]
  try {
    uni.setNavigationBarColor({ frontColor: nav[0], backgroundColor: nav[1] })
    uni.setBackgroundColor({ backgroundColor: nav[1] })
  } catch (err) {}
  return k
}

export { THEMES, DEFAULT, valid, nameOf, CANVAS, canvas }
