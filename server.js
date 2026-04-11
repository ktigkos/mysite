const http = require('http');
const mysql = require('mysql2');
const { URLSearchParams } = require('url');
const WebSocket = require('ws');

const PORT = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  port: 8889,
  user: 'root',
  password: 'root',
  database: 'contacts_db',
});

db.connect((err) => {
  if (err) console.error('Contacts DB connection failed:', err);
  else console.log('Connected to contacts_db');
});

const noteDb = mysql.createConnection({
  host: 'localhost',
  port: 8889,
  user: 'root',
  password: 'root',
  database: 'notepad',
});

noteDb.connect((err) => {
  if (err) console.error('Notepad DB connection failed:', err);
  else {
    console.log('Connected to notepad DB');
    noteDb.execute(`
      CREATE TABLE IF NOT EXISTS note (
        id INT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Failed to create note table:', err);
      else console.log('Note table ready');
    });
  }
});

// ─── HTTP Server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // Serve index.html
  if (req.method === 'GET' && req.url === '/') {
    const fs = require('fs');
    fs.readFile('index.html', (err, data) => {
      if (err) { res.writeHead(500); res.end('Error loading page'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Add new contact
  if (req.method === 'POST' && req.url === '/contacts') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      const firstName = (data.first_name || '').trim();
      const lastName  = (data.last_name  || '').trim();
      const phone     = (data.phone      || '').trim();

      if (!firstName || !lastName || !phone) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing fields' }));
        return;
      }

      db.execute(
        'INSERT INTO contacts (first_name, last_name, phone) VALUES (?, ?, ?)',
        [firstName, lastName, phone],
        (err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'DB error' }));
          } else {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          }
        }
      );
    });
    return;
  }

  // Delete all contacts
  if (req.method === 'DELETE' && req.url === '/contacts') {
    db.execute('DELETE FROM contacts', (err) => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(err ? { error: 'DB error' } : { ok: true }));
    });
    return;
  }

  // Delete single contact by id
  if (req.method === 'DELETE' && req.url.startsWith('/contacts/')) {
    const id = parseInt(req.url.split('/')[2], 10);
    if (isNaN(id)) { res.writeHead(400); res.end('Bad id'); return; }
    db.execute('DELETE FROM contacts WHERE id = ?', [id], (err) => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(err ? { error: 'DB error' } : { ok: true }));
    });
    return;
  }

  // List all contacts
  if (req.method === 'GET' && req.url === '/contacts') {
    db.execute('SELECT id, first_name, last_name, phone FROM contacts ORDER BY id DESC', (err, rows) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DB error' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    });
    return;
  }

  // Load note via HTTP GET
  if (req.method === 'GET' && req.url === '/note') {
    noteDb.execute('SELECT content FROM note WHERE id = 1', (err, rows) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: (rows && rows[0]) ? rows[0].content : '' }));
    });
    return;
  }

  // Serve static files (index.html, etc.)
  if (req.method === 'GET') {
    const fs = require('fs');
    const path = require('path');
    const safePath = path.join(__dirname, req.url.split('?')[0]);
    fs.readFile(safePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200);
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ─── WebSocket Server (real-time notepad) ──────────────────────────────────────

const wss = new WebSocket.Server({ server });

// Debounce MySQL saves so we don't write on every keystroke
let saveTimer = null;
function scheduleSave(content) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    noteDb.execute(
      'INSERT INTO note (id, content) VALUES (1, ?) ON DUPLICATE KEY UPDATE content = ?, updated_at = CURRENT_TIMESTAMP',
      [content, content],
      (err) => { if (err) console.error('Note save error:', err); }
    );
  }, 500);
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  // Send current note to the newly connected client
  noteDb.execute('SELECT content FROM note WHERE id = 1', (err, rows) => {
    const content = (rows && rows[0]) ? rows[0].content : '';
    ws.send(JSON.stringify({ type: 'init', content }));
  });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'update') {
      const content = msg.content;

      // Persist to MySQL (debounced)
      scheduleSave(content);

      // Broadcast to all OTHER connected clients for real-time sync
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update', content }));
        }
      });
    }
  });

  ws.on('close', () => console.log('WebSocket client disconnected'));
  ws.on('error', (err) => console.error('WebSocket error:', err));
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));