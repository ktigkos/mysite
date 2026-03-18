const http = require('http');
const mysql = require('mysql2');
const { URLSearchParams } = require('url');

const PORT = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  port: 8889,
  user: 'root',
  password: 'root',
  database: 'contacts_db',
});

db.connect((err) => {
  if (err) console.error('DB connection failed:', err);
  else console.log('Connected to MySQL');
});

const server = http.createServer((req, res) => {
  // Serve index.html
  if (req.method === 'GET' && req.url === '/') {
    const fs = require('fs');
    fs.readFile('index.html', (err, data) => {
      if (err) { res.writeHead(500); res.end('Error loading page'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Handle contact form submission
  if (req.method === 'POST' && req.url === '/submit') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const firstName = (params.get('first_name') || '').trim();
      const lastName  = (params.get('last_name')  || '').trim();
      const phone     = (params.get('phone')       || '').trim();

      if (!firstName || !lastName || !phone) {
        res.writeHead(302, { Location: '/index.html?status=missing' });
        res.end();
        return;
      }

      db.execute(
        'INSERT INTO contacts (first_name, last_name, phone) VALUES (?, ?, ?)',
        [firstName, lastName, phone],
        (err) => {
          if (err) {
            console.error(err);
            res.writeHead(302, { Location: '/index.html?status=error' });
          } else {
            res.writeHead(302, { Location: '/index.html?status=success' });
          }
          res.end();
        }
      );
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

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));