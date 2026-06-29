# my.site — React + Vite + Node.js

Neo-Tokyo cyberpunk personal site with React 18 frontend and Node.js/WebSocket backend.

---

## Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **MySQL** running locally (MAMP or standalone)

No global installs needed — everything runs via `npx` or `npm run`.

---

## MySQL Setup

Make sure MySQL is running. The server auto-creates tables on first run.

```sql
CREATE DATABASE IF NOT EXISTS contacts_db;
CREATE DATABASE IF NOT EXISTS notepad;
```

If your MySQL credentials differ from `root / root` or port differs from `3306`,
update them at the top of `backend/server.js`.

---

## Project Structure

```
react-mysite/
├── backend/
│   ├── server.js          ← Node.js + WebSocket + REST API
│   └── package.json
└── frontend/
    ├── public/            ← snake.html, snake3d.html, favicon.png
    ├── src/
    │   ├── components/    ← Shell, RainCanvas, GlitchText, MusicPlayer
    │   ├── pages/         ← Home, Contact, Notepad
    │   ├── hooks/         ← useMusic, useNotepad
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup & Run (one terminal)

```bash
# Step 1 — backend
cd backend
npm install

# Step 2 — frontend
cd ../frontend
npm install
npm run build

# Step 3 — start
cd ../backend
node server.js
```

Open **http://localhost:3000** ✓

---

## Development (two terminals, live reload)

**Terminal 1:**
```bash
cd backend && node server.js
```

**Terminal 2:**
```bash
cd frontend && npm run dev
```

Open **http://localhost:4200**

Changes to React files hot-reload instantly. No rebuild needed.

---

## Ports

| Service              | Port |
|---------------------|------|
| Node.js server       | 3000 |
| Vite dev server      | 4200 |
| MySQL | 3306 |
