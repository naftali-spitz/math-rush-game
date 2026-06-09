import type { AppData, AppSettings, CreatePlayerInput, LeaderboardEntry, PlayerData, RushHistoryRecord, SaveRushResultInput } from '../types/game';

type ApiAppResponse = AppData;
type PlayerResponse = { player: PlayerData; players: PlayerData[]; leaderboard: LeaderboardEntry[] };
type RushResponse = PlayerResponse & { history: RushHistoryRecord[] };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getAppData() {
  return request<ApiAppResponse>('/app');
}

export function createPlayer(input: CreatePlayerInput) {
  return request<PlayerResponse>('/players', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePlayer(playerId: string, input: Partial<Pick<PlayerData, 'name' | 'avatarIcon' | 'avatarColor' | 'soundEnabled' | 'musicEnabled'>>) {
  return request<PlayerResponse>(`/players/${playerId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updatePlayerSettings(playerId: string, settings: AppSettings) {
  return updatePlayer(playerId, settings);
}

export function getPlayerHistory(playerId: string) {
  return request<RushHistoryRecord[]>(`/players/${playerId}/history`);
}

export function saveRushResult(input: SaveRushResultInput) {
  return request<RushResponse>('/rush-results', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
