const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const mysql   = require('mysql2');
const { URLSearchParams } = require('url');
const WebSocket = require('ws');

const PORT     = 3000;
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.mjs':  'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png',
  '.jpg':  'image/jpeg', '.ico': 'image/x-icon',
  '.svg':  'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.map':  'application/json',
};

// ── Contacts DB ──────────────────────────────────────────────────────────────
const db = mysql.createConnection({
  host: '127.0.0.1', port: 3306,
  user: 'root', password: 'root', database: 'contacts_db',
});
db.connect(err => {
  if (err) console.error('contacts_db error:', err);
  else {
    console.log('✓ contacts_db connected');
    db.execute(`CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name  VARCHAR(100) NOT NULL,
      phone      VARCHAR(50)  NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, err => { if (err) console.error(err); });
  }
});

// ── Notepad DB ───────────────────────────────────────────────────────────────
const noteDb = mysql.createConnection({
  host: '127.0.0.1', port: 3306,
  user: 'root', password: 'root', database: 'notepad',
});
noteDb.connect(err => {
  if (err) console.error('notepad error:', err);
  else {
    console.log('✓ notepad connected');
    noteDb.execute(`CREATE TABLE IF NOT EXISTS note (
      id INT PRIMARY KEY, content TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`, err => { if (err) console.error(err); });
  }
});

// ── HTTP ─────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // CORS for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // GET /api/contacts
  if (req.method === 'GET' && url === '/api/contacts') {
    db.execute('SELECT id, first_name, last_name, phone FROM contacts ORDER BY id DESC', (err, rows) => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(err ? { error: 'db_error' } : rows));
    });
    return;
  }

  // DELETE /api/contacts  (clear all)
  if (req.method === 'DELETE' && url === '/api/contacts') {
    db.execute('DELETE FROM contacts', err => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(err ? { error: 'db_error' } : { ok: true }));
    });
    return;
  }

  // DELETE /api/contacts/:id
  if (req.method === 'DELETE' && url.startsWith('/api/contacts/')) {
    const id = parseInt(url.split('/')[3], 10);
    if (isNaN(id)) { res.writeHead(400); return res.end('Bad id'); }
    db.execute('DELETE FROM contacts WHERE id = ?', [id], err => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(err ? { error: 'db_error' } : { ok: true }));
    });
    return;
  }

  // POST /api/contacts
  if (req.method === 'POST' && url === '/api/contacts') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
      const fn = (data.first_name || '').trim();
      const ln = (data.last_name  || '').trim();
      const ph = (data.phone      || '').trim();
      if (!fn || !ln || !ph) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'missing_fields' }));
      }
      db.execute('INSERT INTO contacts (first_name,last_name,phone) VALUES (?,?,?)',
        [fn, ln, ph], err => {
          res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(err ? { error: 'db_error' } : { success: true }));
        });
    });
    return;
  }

  // GET /api/note
  if (req.method === 'GET' && url === '/api/note') {
    noteDb.execute('SELECT content FROM note WHERE id = 1', (err, rows) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: rows?.[0]?.content || '' }));
    });
    return;
  }

  // Static files + SPA fallback
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) filePath = path.join(DIST_DIR, 'index.html');
    fs.readFile(filePath, (err2, data) => {
      if (err2) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });
let saveTimer = null;

wss.on('connection', ws => {
  console.log('WS connected');
  noteDb.execute('SELECT content FROM note WHERE id = 1', (err, rows) => {
    ws.send(JSON.stringify({ type: 'init', content: rows?.[0]?.content || '' }));
  });
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'update') {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        noteDb.execute(
          'INSERT INTO note (id,content) VALUES (1,?) ON DUPLICATE KEY UPDATE content=?,updated_at=CURRENT_TIMESTAMP',
          [msg.content, msg.content], err => { if (err) console.error(err); }
        );
      }, 500);
      wss.clients.forEach(c => {
        if (c !== ws && c.readyState === WebSocket.OPEN)
          c.send(JSON.stringify({ type: 'update', content: msg.content }));
      });
    }
  });
  ws.on('close', () => console.log('WS disconnected'));
});

server.listen(PORT, '0.0.0.0', () => console.log(`\n🚀  http://localhost:${PORT}\n`));
