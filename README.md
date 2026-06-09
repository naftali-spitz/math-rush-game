# Math Rush Game

Math Rush is a local browser-based 90-second math rush game for kids. It is built with Vite, React, TypeScript, plain CSS, and IndexedDB for local browser storage.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## V1 scope

- Local browser game
- Multiple local player profiles
- Keyboard-first 90-second rush rounds
- Scoring, streaks, XP, levels, and best score per player
- Saved skill stats per player
- Rush history saved locally
- Gentle post-rush adaptive difficulty
- Sound effects and placeholder browser music toggle
- Neon arcade/speed visual style

## Local storage model

The app uses the browser's built-in IndexedDB with these stores:

- players
- settings
- rushResults

The first run attempts to migrate the old localStorage save into the first local player profile.

No backend, Supabase, Electron, Godot, login, or multiplayer is used.
