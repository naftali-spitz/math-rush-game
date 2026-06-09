import express from 'express';
import { createPlayer, getHistory, getLeaderboard, getPlayer, getPlayers, initSchema, saveRushResult, updatePlayer } from './db.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

initSchema();
app.use(express.json({ limit: '1mb' }));

function appPayload() {
  return { players: getPlayers(), leaderboard: getLeaderboard() };
}

function playerPayload(playerId: string) {
  const player = getPlayer(playerId);
  if (!player) throw new Error('Player not found.');
  return { player, players: getPlayers(), leaderboard: getLeaderboard() };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'math-rush-api' });
});

app.get('/api/app', (_req, res) => {
  res.json(appPayload());
});

app.post('/api/players', (req, res, next) => {
  try {
    const player = createPlayer(req.body ?? {});
    res.status(201).json({ player, ...appPayload() });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/players/:id', (req, res, next) => {
  try {
    updatePlayer(req.params.id, req.body ?? {});
    res.json(playerPayload(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.get('/api/players/:id/history', (req, res, next) => {
  try {
    if (!getPlayer(req.params.id)) return res.status(404).json({ error: 'Player not found.' });
    res.json(getHistory(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.get('/api/leaderboard', (_req, res) => {
  res.json(getLeaderboard());
});

app.post('/api/rush-results', (req, res, next) => {
  try {
    const player = saveRushResult(req.body ?? {});
    res.status(201).json({ player, players: getPlayers(), leaderboard: getLeaderboard(), history: getHistory(player.id) });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown server error.';
  const status = message.includes('not found') ? 404 : 400;
  res.status(status).json({ error: message });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Math Rush API listening on http://127.0.0.1:${port}`);
});
