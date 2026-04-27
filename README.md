# mysite

A personal dashboard and portfolio site built with vanilla HTML/CSS/JS and a Node.js backend. Combines interactive games, real-time utilities, and data tools into a single dark-themed web application.

## Features

| Page | Description |
|------|-------------|
| **Home** | Dashboard with navigation cards to all features |
| **Contacts** | A simple contact manager backed by MySQL |
| **Notepad** | Real-time notepad synced across devices via WebSocket |
| **Weather** | Location-based weather with hourly/daily forecasts |
| **Gallery** | Unsplash-powered image search with lightbox viewer |
| **Snake** | Classic 2D snake game |
| **Snake 3D** | 3D snake game |


### External APIs

| Service | Used for |
|---------|----------|
| [Unsplash](https://unsplash.com/developers) | Photo search in Gallery |
| [Open-Meteo](https://open-meteo.com/) | Weather forecasts |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Location search |
| [OpenStreetMap Nominatim](https://nominatim.org/) | Reverse geocoding |

## Prerequisites

- Node.js (v18+)
- MySQL server running on `localhost:8889` (default MAMP port)

## Setup

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd mysite
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the databases**

   Create two MySQL databases:

   ```sql
   CREATE DATABASE contacts_db;
   CREATE DATABASE notepad;
   ```

   The server auto-creates the required tables (`contacts`, `note`) on first run.

4. **Configure credentials**

   The server reads MySQL credentials from hardcoded values in `server.js`. Edit the connection config at the top of that file to match your local MySQL setup:

   ```js
   host: 'localhost',
   port: 8889,
   user: 'root',
   password: 'root',
   ```

5. **Start the server**

   ```bash
   node server.js
   ```

   The app is served at `http://localhost:3000`.

## Project Structure

```
mysite/
├── index.html      # Main page (home, contacts, notepad — hash-routed)
├── weather.html    # Weather app
├── gallery.html    # Image gallery
├── snake.html      # 2D snake game
├── snake3d.html    # 3D snake game
├── server.js       # Node.js HTTP + WebSocket server
├── package.json
└── favicon.png
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/contacts` | List all contacts (paginated via `?page=&limit=`) |
| `POST` | `/contacts` | Create a contact |
| `PUT` | `/contacts/:id` | Update a contact |
| `DELETE` | `/contacts/:id` | Delete a contact |
| `GET` | `/note` | Get notepad content |
| `POST` | `/note` | Save notepad content |
| `WS` | `/` | WebSocket for real-time notepad sync |

## TODO

Add test plans and Playwright suite.