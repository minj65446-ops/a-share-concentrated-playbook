#!/usr/bin/env node
/* ============================================================
   校验工具：对比本地文件与 GitHub 远端是否一致
   ------------------------------------------------------------
   用法：
     TOKEN=<your_token> node tools/check.js [本地仓库根目录]

   原理：
     用 git blob 的 sha1 算法（sha1("blob " + len + "\0" + content)）
     计算本地文件摘要，与远端 tree API 返回的 blob sha 逐一比对。
     这样不需要 clone，也不需要 git 传输，就能判断内容是否一致。

   典型用途：
     上传后确认 Pages 部署的确实是最新版本；
     或长期没同步时，先看看有哪些文件已经分叉。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOKEN = process.env.TOKEN;
const OWNER = process.env.OWNER || 'minj65446-ops';
const REPO = process.env.REPO || 'a-share-concentrated-playbook';
const BRANCH = process.env.BRANCH || 'main';
const ROOT = process.argv[2] || '.';

function walk(dir, base, out) {
  let items;
  try { items = fs.readdirSync(dir); } catch (e) { return out; }
  for (const it of items) {
    if (it === '.git' || it === 'node_modules' || it === '.DS_Store') continue;
    const abs = path.join(dir, it);
    const rel = base ? base + '/' + it : it;
    try {
      if (fs.statSync(abs).isDirectory()) walk(abs, rel, out);
      else out.push(rel);
    } catch (e) { /* 忽略无法访问的文件 */ }
  }
  return out;
}

// git blob sha1：sha1("blob " + 字节数 + "\0" + 内容)
function blobSha(buf) {
  const h = crypto.createHash('sha1');
  h.update('blob ' + buf.length + '\0');
  h.update(buf);
  return h.digest('hex');
}

(async () => {
  if (!TOKEN) {
    console.log('缺少 TOKEN 环境变量。\n用法: TOKEN=<token> node tools/check.js .');
    process.exitCode = 1;
    return;
  }

  const r = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`,
    { headers: { Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'check-tool', Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) {
    console.log('取远端 tree 失败: ' + r.status + ' ' + (await r.text()).slice(0, 200));
    process.exitCode = 1;
    return;
  }
  const rem = {};
  (await r.json()).tree.forEach(t => { if (t.type === 'blob') rem[t.path] = t.sha; });

  const LOCAL = walk(ROOT, '', []).sort();
  const remPaths = Object.keys(rem);
  const changed = [], added = [], same = [];

  LOCAL.forEach(p => {
    let buf;
    try { buf = fs.readFileSync(path.join(ROOT, p)); } catch (e) { return; }
    const s = blobSha(buf);
    if (!(p in rem)) added.push(p);
    else if (rem[p] !== s) changed.push(p);
    else same.push(p);
  });
  const deleted = remPaths.filter(p => !LOCAL.includes(p));

  console.log('\n本地 ' + LOCAL.length + ' 个文件 / 远端 ' + remPaths.length + ' 个\n');
  if (added.length) console.log('本地新增 ' + added.length + '（远端没有）:\n  ' + added.join('\n  '));
  if (changed.length) console.log('内容变更 ' + changed.length + ':\n  ' + changed.join('\n  '));
  if (deleted.length) console.log('远端多出 ' + deleted.length + '（本地没有）:\n  ' + deleted.join('\n  '));
  console.log('\n一致 ' + same.length + ' 个');
  console.log(added.length || changed.length ? '\n>>> 有差异，建议运行 tools/upload.js 同步' : '\n>>> 本地与远端完全一致');
})();
