# Math Rush Game

Math Rush is a fast family math game for kids. It is built with Vite, React, TypeScript, plain CSS, and a small Node/Express + SQLite API so every device on the home network can share the same players, XP, history, and leaderboard.

## Current stage

V2.0 shared-family-server foundation:

- React frontend served by Nginx
- Express API on the home server
- SQLite database under `server/data/math-rush.db`
- Choose-player flow on every load
- Shared players, XP, best score, skill stats, rush history, and leaderboard
- Per-player sound/music settings
- 30s / 60s / 90s rush length options
- Home network only, no public internet auth yet

## Run locally

Terminal 1:

```bash
npm install
npm run dev
```

Terminal 2:

```bash
cd server
npm install
npm run dev
```

Then open the Vite URL. The frontend proxies `/api` to `http://127.0.0.1:3001` during development.

## Build frontend

```bash
npm run build
```

## Build API

```bash
cd server
npm install
npm run build
npm run start
```

## Home server deployment notes

Frontend files are served from:

```bash
/var/www/math-rush-game
```

API runs locally on:

```bash
127.0.0.1:3001
```

Nginx should serve the static frontend and proxy `/api/` to the API. A sample config is in:

```bash
deploy/nginx-math-rush-game.conf
```

A sample systemd service template is in:

```bash
deploy/math-rush-api.service.example
```

## Important data note

The shared family data is in SQLite:

```bash
server/data/math-rush.db
```

Back up this file if the family starts using the game seriously. Do not commit the database file to GitHub.
