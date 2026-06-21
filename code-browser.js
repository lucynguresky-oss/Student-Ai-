const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = 4321;

// File extension → language map for syntax highlighting
const EXT_MAP = {
  '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
  '.json': 'json', '.css': 'css', '.scss': 'scss', '.html': 'html', '.md': 'markdown',
  '.prisma': 'sql', '.yaml': 'yaml', '.yml': 'yaml', '.env': 'bash', '.sh': 'bash',
  '.py': 'python', '.txt': 'plaintext', '.gitignore': 'bash', '.prettierrc': 'json',
};

// Folders/files to skip
const SKIP = new Set(['node_modules', '.next', '.turbo', 'dist', '.git', 'pnpm-lock.yaml', 'tsconfig.tsbuildinfo']);

function buildTree(dir, rel = '') {
  let result = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const relPath = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      result.push({ name: e.name, path: relPath, type: 'dir', children: buildTree(path.join(dir, e.name), relPath) });
    } else {
      result.push({ name: e.name, path: relPath, type: 'file' });
    }
  }
  return result;
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Learnix Code Browser</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --teal:#18D6C8;--blue:#3B82F6;--purple:#7C3AED;--pink:#EC4899;
  --bg:#000;--bg2:#0A0A0A;--bg3:#111;--surface:#1A1A1A;--surface2:#222;
  --border:rgba(255,255,255,0.08);--text:#fff;--text2:#A0A0A0;--text3:#505050;
  --grad:linear-gradient(135deg,#18D6C8 0%,#3B82F6 50%,#7C3AED 100%);
  --sidebar:280px;
}
html{font-size:15px;-webkit-font-smoothing:antialiased;}
body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);height:100dvh;display:flex;flex-direction:column;overflow:hidden;}

/* ── TOP BAR ── */
.topbar{
  display:flex;align-items:center;gap:14px;
  padding:0 20px;height:54px;flex-shrink:0;
  background:rgba(0,0,0,0.97);
  border-bottom:1px solid var(--border);
  backdrop-filter:blur(20px);
}
.logo{
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:17px;
  background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  letter-spacing:-0.02em;white-space:nowrap;
}
.breadcrumb{
  display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text3);
  flex:1;overflow:hidden;white-space:nowrap;
}
.breadcrumb span{color:var(--text2);font-weight:500;}
.breadcrumb .sep{color:var(--text3);}
.badge{
  font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;
  background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#60a5fa;
  white-space:nowrap;
}

/* ── LAYOUT ── */
.layout{display:flex;flex:1;overflow:hidden;}

/* ── SIDEBAR ── */
.sidebar{
  width:var(--sidebar);flex-shrink:0;
  background:var(--bg2);border-right:1px solid var(--border);
  overflow-y:auto;display:flex;flex-direction:column;
}
.sidebar::-webkit-scrollbar{width:4px;}
.sidebar::-webkit-scrollbar-track{background:transparent;}
.sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
.sidebar-header{
  padding:14px 16px 10px;font-size:10px;font-weight:700;letter-spacing:0.12em;
  color:var(--text3);text-transform:uppercase;border-bottom:1px solid var(--border);
  flex-shrink:0;
}
.tree{padding:6px 0;flex:1;}

/* ── TREE NODES ── */
.tree-item{
  display:flex;align-items:center;gap:7px;
  padding:5px 16px;cursor:pointer;
  font-size:13px;color:var(--text2);font-weight:500;
  transition:background 0.15s,color 0.15s;
  white-space:nowrap;overflow:hidden;border-left:2px solid transparent;
  user-select:none;
}
.tree-item:hover{background:rgba(255,255,255,0.04);color:var(--text);}
.tree-item.active{
  background:rgba(59,130,246,0.1);color:#fff;
  border-left-color:var(--blue);
}
.tree-item.dir{color:var(--text);}
.tree-item .icon{font-size:14px;flex-shrink:0;opacity:0.8;}
.tree-item .name{overflow:hidden;text-overflow:ellipsis;flex:1;}
.tree-item .arrow{font-size:10px;color:var(--text3);flex-shrink:0;transition:transform 0.2s;}
.tree-item.open .arrow{transform:rotate(90deg);}
.tree-children{display:none;padding-left:14px;}
.tree-children.visible{display:block;}

/* ── VIEWER ── */
.viewer{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}
.viewer-header{
  display:flex;align-items:center;gap:10px;
  padding:10px 20px;border-bottom:1px solid var(--border);
  background:var(--bg2);flex-shrink:0;
}
.file-icon{font-size:18px;}
.file-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;}
.file-lang{
  font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;
  background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:#a78bfa;
  margin-left:auto;
}
.file-lines{font-size:11px;color:var(--text3);font-weight:500;}
.viewer-body{flex:1;overflow:auto;position:relative;}
.viewer-body::-webkit-scrollbar{width:6px;height:6px;}
.viewer-body::-webkit-scrollbar-track{background:transparent;}
.viewer-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
.viewer-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2);}

/* ── CODE BLOCK ── */
pre{
  margin:0;padding:0;font-family:'JetBrains Mono',monospace;font-size:13px;
  line-height:1.7;background:transparent!important;min-height:100%;
}
pre code{background:transparent!important;padding:0!important;font-size:13px!important;}
.code-wrapper{display:flex;min-height:100%;}
.line-numbers{
  flex-shrink:0;width:52px;padding:20px 0;
  text-align:right;user-select:none;
  font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;
  color:var(--text3);background:var(--bg2);
  border-right:1px solid var(--border);
}
.line-numbers span{display:block;padding-right:14px;}
.code-content{flex:1;padding:20px 24px;overflow:auto;}

/* ── EMPTY / WELCOME STATE ── */
.welcome{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:16px;color:var(--text3);text-align:center;padding:40px;
}
.welcome-icon{font-size:52px;margin-bottom:4px;}
.welcome h2{
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:20px;
  background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.welcome p{font-size:14px;color:var(--text3);max-width:280px;line-height:1.6;}

/* ── LOADING ── */
.loading{
  flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;
}
.spinner{
  width:32px;height:32px;border:2px solid var(--border);
  border-top-color:var(--teal);border-radius:50%;
  animation:spin 0.8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fade-up{animation:fadeUp 0.3s ease-out both;}

/* ── FILE TYPE COLORS ── */
.ext-ts,.ext-tsx{color:#3B82F6 !important;}
.ext-js,.ext-jsx{color:#F59E0B !important;}
.ext-css,.ext-scss{color:#EC4899 !important;}
.ext-json{color:#22C55E !important;}
.ext-md{color:#a78bfa !important;}
.ext-prisma{color:#18D6C8 !important;}

/* ── HIGHLIGHT.JS OVERRIDE ── */
.hljs{background:transparent!important;}

/* ── COPY BUTTON ── */
.copy-btn{
  position:absolute;top:12px;right:12px;
  padding:5px 12px;font-size:11px;font-weight:700;
  background:rgba(255,255,255,0.08);border:1px solid var(--border);
  color:var(--text2);border-radius:6px;cursor:pointer;
  transition:background 0.2s,color 0.2s;letter-spacing:0.04em;
}
.copy-btn:hover{background:rgba(255,255,255,0.14);color:#fff;}
.copy-btn.copied{background:rgba(24,214,200,0.15);border-color:var(--teal);color:var(--teal);}

/* ── RESIZE HANDLE ── */
.resize-handle{
  width:4px;background:transparent;cursor:col-resize;flex-shrink:0;
  transition:background 0.2s;position:relative;
}
.resize-handle:hover,.resize-handle.dragging{background:rgba(59,130,246,0.4);}
</style>
</head>
<body>

<div class="topbar">
  <div class="logo">⚡ Learnix Code Browser</div>
  <div class="breadcrumb" id="breadcrumb">
    <span>Select a file to view</span>
  </div>
  <div class="badge" id="stats">Loading…</div>
</div>

<div class="layout">
  <!-- Sidebar -->
  <div class="sidebar" id="sidebar">
    <div class="sidebar-header">📁 Project Files</div>
    <div class="tree" id="tree">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  </div>

  <!-- Resize Handle -->
  <div class="resize-handle" id="resizeHandle"></div>

  <!-- Viewer -->
  <div class="viewer" id="viewer">
    <div class="welcome">
      <div class="welcome-icon">✦</div>
      <h2>Learnix Code Browser</h2>
      <p>Click any file in the sidebar to view its contents with full syntax highlighting.</p>
    </div>
  </div>
</div>

<script>
let tree = [];
let fileCount = 0, dirCount = 0;

// ── Fetch tree from server
async function loadTree() {
  const res = await fetch('/api/tree');
  tree = await res.json();
  countItems(tree);
  document.getElementById('stats').textContent = dirCount + ' dirs · ' + fileCount + ' files';
  renderTree(tree, document.getElementById('tree'));
}

function countItems(nodes) {
  for (const n of nodes) {
    if (n.type === 'dir') { dirCount++; countItems(n.children || []); }
    else fileCount++;
  }
}

// ── Icon helpers
function fileIcon(name) {
  const ext = name.includes('.') ? '.' + name.split('.').pop().toLowerCase() : '';
  const icons = {
    '.ts':'🔷','.tsx':'⚛️','.js':'🟡','.jsx':'⚛️','.json':'📋','.css':'🎨',
    '.scss':'🎨','.html':'🌐','.md':'📝','.prisma':'🗄️','.yaml':'⚙️',
    '.yml':'⚙️','.env':'🔐','.sh':'🖥️','.py':'🐍','.gitignore':'🙈',
    '.prettierrc':'💅','.lock':'🔒',
  };
  return icons[ext] || '📄';
}
function extClass(name) {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  return 'ext-' + ext;
}
function langLabel(name) {
  const ext = name.includes('.') ? '.' + name.split('.').pop().toLowerCase() : '';
  const map = {
    '.ts':'TypeScript','.tsx':'TSX','.js':'JavaScript','.jsx':'JSX',
    '.json':'JSON','.css':'CSS','.scss':'SCSS','.html':'HTML',
    '.md':'Markdown','.prisma':'Prisma','.yaml':'YAML','.yml':'YAML',
    '.env':'Env','.sh':'Shell','.py':'Python','.txt':'Text',
    '.gitignore':'Gitignore','.prettierrc':'JSON','.lock':'Lock',
  };
  return map[ext] || ext.slice(1).toUpperCase() || 'File';
}

// ── Render tree nodes
function renderTree(nodes, container) {
  container.innerHTML = '';
  for (const node of nodes) renderNode(node, container);
}

function renderNode(node, container) {
  const item = document.createElement('div');
  item.className = 'tree-item ' + (node.type === 'dir' ? 'dir' : '');
  item.dataset.path = node.path;
  item.dataset.type = node.type;

  if (node.type === 'dir') {
    item.innerHTML = \`<span class="arrow">▶</span><span class="icon">📁</span><span class="name">\${node.name}</span>\`;
    item.addEventListener('click', e => { e.stopPropagation(); toggleDir(item, node); });
  } else {
    const icon = fileIcon(node.name);
    const cls = extClass(node.name);
    item.innerHTML = \`<span class="icon \${cls}">\${icon}</span><span class="name \${cls}">\${node.name}</span>\`;
    item.addEventListener('click', e => { e.stopPropagation(); openFile(node, item); });
  }

  container.appendChild(item);

  if (node.type === 'dir') {
    const childBox = document.createElement('div');
    childBox.className = 'tree-children';
    childBox.dataset.forPath = node.path;
    container.appendChild(childBox);
  }
}

function toggleDir(item, node) {
  const childBox = item.parentElement.querySelector(\`[data-for-path="\${node.path}"]\`);
  if (!childBox) return;
  const isOpen = item.classList.contains('open');
  if (isOpen) {
    item.classList.remove('open');
    childBox.classList.remove('visible');
    item.querySelector('.icon').textContent = '📁';
  } else {
    item.classList.add('open');
    childBox.classList.add('visible');
    item.querySelector('.icon').textContent = '📂';
    if (!childBox.dataset.rendered) {
      childBox.dataset.rendered = '1';
      for (const child of (node.children || [])) renderNode(child, childBox);
    }
  }
}

// ── Open file
let activeItem = null;
async function openFile(node, item) {
  if (activeItem) activeItem.classList.remove('active');
  item.classList.add('active');
  activeItem = item;

  // Update breadcrumb
  const parts = node.path.split('/');
  document.getElementById('breadcrumb').innerHTML =
    parts.map((p, i) => i === parts.length - 1
      ? \`<span>\${p}</span>\`
      : \`<span style="color:var(--text3)">\${p}</span><span class="sep">/</span>\`
    ).join('');

  // Show loading
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = \`<div class="loading"><div class="spinner"></div><span style="color:var(--text3);font-size:13px">Loading \${node.name}…</span></div>\`;

  try {
    const res = await fetch('/api/file?path=' + encodeURIComponent(node.path));
    if (!res.ok) throw new Error('Could not read file');
    const data = await res.json();
    renderFile(node, data.content, viewer);
  } catch (e) {
    viewer.innerHTML = \`<div class="welcome"><div class="welcome-icon">⚠️</div><h2 style="-webkit-text-fill-color:#EF4444;background:none">Error</h2><p>\${e.message}</p></div>\`;
  }
}

function renderFile(node, content, viewer) {
  const lines = content.split('\\n');
  const lang = langLabel(node.name);

  // Header
  const header = document.createElement('div');
  header.className = 'viewer-header fade-up';
  header.innerHTML = \`
    <span class="file-icon \${extClass(node.name)}">\${fileIcon(node.name)}</span>
    <span class="file-name">\${node.name}</span>
    <span class="file-lang">\${lang}</span>
    <span class="file-lines">\${lines.length} lines</span>
  \`;

  // Body
  const body = document.createElement('div');
  body.className = 'viewer-body';

  const wrapper = document.createElement('div');
  wrapper.className = 'code-wrapper fade-up';

  // Line numbers
  const nums = document.createElement('div');
  nums.className = 'line-numbers';
  nums.innerHTML = lines.map((_, i) => \`<span>\${i + 1}</span>\`).join('');

  // Highlighted code
  const codeContent = document.createElement('div');
  codeContent.className = 'code-content';

  const pre = document.createElement('pre');
  const code = document.createElement('code');

  // Determine language for hljs
  const extMap = {
    '.ts':'typescript','.tsx':'typescript','.js':'javascript','.jsx':'javascript',
    '.json':'json','.css':'css','.scss':'scss','.html':'xml','.md':'markdown',
    '.prisma':'sql','.yaml':'yaml','.yml':'yaml','.env':'bash','.sh':'bash','.py':'python',
  };
  const ext = node.name.includes('.') ? '.' + node.name.split('.').pop().toLowerCase() : '';
  const hljsLang = extMap[ext] || 'plaintext';

  code.textContent = content;
  try {
    const result = hljs.highlight(content, { language: hljsLang, ignoreIllegals: true });
    code.innerHTML = result.value;
  } catch { code.textContent = content; }

  pre.appendChild(code);
  codeContent.appendChild(pre);
  wrapper.appendChild(nums);
  wrapper.appendChild(codeContent);
  body.appendChild(wrapper);

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = 'COPY';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(content).then(() => {
      copyBtn.textContent = '✓ COPIED';
      copyBtn.classList.add('copied');
      setTimeout(() => { copyBtn.textContent = 'COPY'; copyBtn.classList.remove('copied'); }, 2000);
    });
  };
  body.style.position = 'relative';
  body.appendChild(copyBtn);

  viewer.innerHTML = '';
  viewer.appendChild(header);
  viewer.appendChild(body);
}

// ── Resize handle
const handle = document.getElementById('resizeHandle');
const sidebar = document.getElementById('sidebar');
let isResizing = false;
handle.addEventListener('mousedown', e => {
  isResizing = true;
  handle.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', e => {
  if (!isResizing) return;
  const newW = Math.max(160, Math.min(500, e.clientX));
  sidebar.style.width = newW + 'px';
  document.documentElement.style.setProperty('--sidebar', newW + 'px');
});
document.addEventListener('mouseup', () => {
  isResizing = false;
  handle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});

// ── Boot
loadTree();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  // API: file tree
  if (pathname === '/api/tree') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(buildTree(ROOT)));
    return;
  }

  // API: file content
  if (pathname === '/api/file') {
    const filePath = parsed.query.path;
    if (!filePath) { res.writeHead(400); res.end('Missing path'); return; }
    const abs = path.resolve(ROOT, filePath);
    if (!abs.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    try {
      const content = fs.readFileSync(abs, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ content }));
    } catch (e) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'File not found or unreadable' }));
    }
    return;
  }

  // Serve the HTML UI
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(HTML);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n');
  console.log('  ✦  Learnix Code Browser is running!');
  console.log('');
  console.log('  👉  Open this link in your browser:');
  console.log('');
  console.log('       http://localhost:' + PORT);
  console.log('');
  console.log('  Press Ctrl+C to stop the server.\n');
});
