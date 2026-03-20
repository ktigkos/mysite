# my.site — Angular + Node.js

Cyberpunk personal site with Angular 17 frontend and Node.js/WebSocket backend.

---

## Prerequisites

Install these once on your machine if you don't have them:

- **Node.js** v18+ → https://nodejs.org
- **Angular CLI** → `npm install -g @angular/cli`
- **MySQL** running locally (MAMP, MAMP PRO, or standalone MySQL)

---

## MySQL Setup

Make sure MySQL is running (port **8889** for MAMP, or change in `backend/server.js`).

Create the two databases — the server auto-creates the tables on first run:

```sql
CREATE DATABASE IF NOT EXISTS contacts_db;
CREATE DATABASE IF NOT EXISTS notepad;
```

If your MySQL credentials differ from `root / root`, update them in `backend/server.js`.

---

## Project Structure

```
angular-mysite/
├── backend/
│   ├── server.js          ← Node.js + WebSocket server
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/           ← Angular components & services
    │   ├── index.html
    │   ├── main.ts
    │   └── styles.scss
    ├── angular.json
    └── package.json
```

---

## Setup & Run

### Step 1 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 2 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

### Step 3 — Build the Angular app

```bash
# Still inside frontend/
npm run build
```

This compiles Angular into `frontend/dist/mysite/browser/`.

### Step 4 — Start the backend server

```bash
cd ../backend
node server.js
```

### Step 5 — Open the site

Go to **http://localhost:3000** in your browser. Done.

---

## Development Mode (live reload)

For active development, run both in parallel:

**Terminal 1 — Backend:**
```bash
cd backend && node server.js
```

**Terminal 2 — Angular dev server (with proxy to backend):**
```bash
cd frontend && npm start
```

Then open **http://localhost:4200** — Angular will hot-reload on changes,
and API + WebSocket calls proxy automatically to port 3000.

---

## Rebuild after frontend changes

Whenever you edit Angular files:

```bash
cd frontend
npm run build
```

Then refresh the browser at http://localhost:3000. No server restart needed.

Or use watch mode for continuous rebuild:

```bash
npm run watch
```

---

## Ports

| Service         | Port |
|----------------|------|
| Node.js server  | 3000 |
| Angular dev server | 4200 |
| MySQL (MAMP)    | 8889 |

cd angular-mysite/backend
npm install        # first time only

cd ../frontend
npm install        # first time only
npm run build      # compiles Angular → dist/

cd ../backend
node server.js     # start the site
