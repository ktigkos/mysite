const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const mysql   = require('mysql2');
const { URLSearchParams } = require('url');
const WebSocket = require('ws');

const PORT      = 3000;
const DIST_DIR  = path.join(__dirname, '..', 'frontend', 'dist', 'mysite', 'browser');

// ── MySQL: Contacts ──────────────────────────────────────────────────────────
const db = mysql.createConnection({
  host: 'localhost', port: 8889,
  user: 'root', password: 'root',
  database: 'contacts_db',
});
db.connect(err => {
  if (err) console.error('contacts_db connect error:', err);
  else {
    console.log('✓ Connected to contacts_db');
    db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name  VARCHAR(100) NOT NULL,
        phone      VARCHAR(50)  NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, err => { if (err) console.error('contacts table error:', err); });
  }
});

// ── MySQL: Notepad ───────────────────────────────────────────────────────────
const noteDb = mysql.createConnection({
  host: 'localhost', port: 8889,
  user: 'root', password: 'root',
  database: 'notepad',
});
noteDb.connect(err => {
  if (err) console.error('notepad connect error:', err);
  else {
    console.log('✓ Connected to notepad DB');
    noteDb.execute(`
      CREATE TABLE IF NOT EXISTS note (
        id         INT PRIMARY KEY,
        content    TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `, err => { if (err) console.error('note table error:', err); });
  }
});

// ── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',  '.js':   'application/javascript',
  '.mjs':  'application/javascript', '.css':  'text/css',
  '.json': 'application/json', '.png':  'image/png',
  '.jpg':  'image/jpeg', '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff',  '.ttf':  'font/ttf',
  '.map':  'application/json',
};

// ── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // ── API: Save Contact ──
  if (req.method === 'POST' && url === '/api/contacts') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
      const firstName = (data.first_name || '').trim();
      const lastName  = (data.last_name  || '').trim();
      const phone     = (data.phone      || '').trim();
      if (!firstName || !lastName || !phone) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'missing_fields' }));
      }
      db.execute(
        'INSERT INTO contacts (first_name, last_name, phone) VALUES (?, ?, ?)',
        [firstName, lastName, phone],
        (err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'db_error' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      );
    });
    return;
  }

  // ── API: Get Note ──
  if (req.method === 'GET' && url === '/api/note') {
    noteDb.execute('SELECT content FROM note WHERE id = 1', (err, rows) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: rows && rows[0] ? rows[0].content : '' }));
    });
    return;
  }

  // ── Static files (Angular dist) ──
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback — serve index.html for all Angular routes
      filePath = path.join(DIST_DIR, 'index.html');
    }
    fs.readFile(filePath, (err2, data) => {
      if (err2) { res.writeHead(404); return res.end('Not found'); }
      const ext  = path.extname(filePath);
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });
});

// ── WebSocket: Real-time Notepad ─────────────────────────────────────────────
const wss = new WebSocket.Server({ server });

let saveTimer = null;
function scheduleSave(content) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    noteDb.execute(
      'INSERT INTO note (id, content) VALUES (1, ?) ON DUPLICATE KEY UPDATE content = ?, updated_at = CURRENT_TIMESTAMP',
      [content, content],
      err => { if (err) console.error('Note save error:', err); }
    );
  }, 500);
}

wss.on('connection', ws => {
  console.log('WS client connected');
  noteDb.execute('SELECT content FROM note WHERE id = 1', (err, rows) => {
    const content = rows && rows[0] ? rows[0].content : '';
    ws.send(JSON.stringify({ type: 'init', content }));
  });

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'update') {
      scheduleSave(msg.content);
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update', content: msg.content }));
        }
      });
    }
    if (msg.type === 'clear') {
      scheduleSave('');
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update', content: '' }));
        }
      });
    }
  });

  ws.on('close', () => console.log('WS client disconnected'));
  ws.on('error', err => console.error('WS error:', err));
});

server.listen(PORT, () => console.log(`\n🚀 Server running at http://localhost:${PORT}\n`));
