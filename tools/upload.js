#!/usr/bin/env node
/* ============================================================
   同步工具：把本地文件推送到 GitHub 仓库
   ------------------------------------------------------------
   为什么不用 git push：
     某些网络环境（公司代理 / 出口防火墙）下 git 的 HTTPS 传输会持续失败
     （schannel: server closed abruptly / CONNECT tunnel failed 502），
     但 HTTPS 的 REST API 正常。本脚本改用 contents API 逐文件提交，绕过 git 传输。

   用法：
     TOKEN=<your_token> node tools/upload.js [本地仓库根目录] [commit message]

     例：TOKEN=ghp_xxx node tools/upload.js . "v4: 更新题库"

   说明：
     - 已存在的文件会带上 sha 更新，不存在的新建
     - 需要 token 具备 repo 写权限（fine-grained PAT 勾 Contents: Read and write）
     - 只上传 FILES 列表内的文件；不在列表里的本地文件不会同步
   ============================================================ */
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN;
const OWNER = process.env.OWNER || 'minj65446-ops';
const REPO = process.env.REPO || 'a-share-concentrated-playbook';
const BRANCH = process.env.BRANCH || 'main';
const ROOT = process.argv[2] || '.';
const MSG = process.argv[3] || process.env.MSG || 'update';

const FILES = [
  'index.html',
  'app.css',
  'app.js',
  'teachers.js',
  'basics.js',
  'rank.js',
  'quiz.js',
  'deaths.js',
  'playbook.html',
  'README.md',
  'docs/DESIGN.md',
  'miniprogram-uni/App.vue',
  'miniprogram-uni/main.js',
  'miniprogram-uni/manifest.json',
  'miniprogram-uni/pages.json',
  'miniprogram-uni/uni.scss',
  'miniprogram-uni/common/courses.js',
  'miniprogram-uni/common/cases.js',
  'miniprogram-uni/common/teachers.js',
  'miniprogram-uni/common/basics.js',
  'miniprogram-uni/common/rank.js',
  'miniprogram-uni/common/quiz.js',
  'miniprogram-uni/common/deaths.js',
  'miniprogram-uni/pages/learn/learn.vue',
  'miniprogram-uni/pages/train/train.vue',
  'miniprogram-uni/pages/map/map.vue',
  'miniprogram-uni/pages/teacher/teacher.vue',
  'miniprogram-uni/pages/me/me.vue',
  'tools/upload.js',
  'tools/check.js',
  'tools/gen-uni.js',
  'tools/gen-cases.js'
];

const H = {
  Authorization: 'Bearer ' + TOKEN,
  'User-Agent': 'upload-tool',
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json'
};

async function putFile(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { rel, ok: false, note: '本地文件不存在' };
  const content = fs.readFileSync(abs).toString('base64');
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURI(rel)}`;

  let sha = null;
  const g = await fetch(url + '?ref=' + BRANCH, { headers: H });
  if (g.status === 200) {
    sha = (await g.json()).sha;
  } else if (g.status !== 404) {
    return { rel, ok: false, note: 'GET ' + g.status };
  }

  const body = { message: MSG, content, branch: BRANCH };
  if (sha) body.sha = sha;

  const r = await fetch(url, { method: 'PUT', headers: H, body: JSON.stringify(body) });
  const d = await r.json();
  if (r.status < 300) return { rel, ok: true, note: (sha ? 'updated ' : 'created ') + d.commit.sha.slice(0, 7) };
  return { rel, ok: false, note: r.status + ' ' + (d.message || '') };
}

(async () => {
  if (!TOKEN) {
    console.log('缺少 TOKEN 环境变量。\n用法: TOKEN=<token> node tools/upload.js . "<commit message>"');
    process.exitCode = 1;
    return;
  }
  console.log('目标: ' + OWNER + '/' + REPO + '@' + BRANCH + '  |  ' + MSG + '\n');

  const results = [];
  for (const f of FILES) {
    try {
      const r = await putFile(f);
      results.push(r);
      console.log((r.ok ? 'OK   ' : 'FAIL ') + f + '  ' + r.note);
    } catch (e) {
      results.push({ rel: f, ok: false, note: e.message });
      console.log('ERR  ' + f + '  ' + e.message);
    }
  }
  const bad = results.filter(r => !r.ok);
  console.log('\nsummary: ' + (results.length - bad.length) + '/' + results.length + ' ok');
  if (bad.length) process.exitCode = 1;
})();
