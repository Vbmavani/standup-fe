import { api } from './client';
import type { StandupDay, StandupEntry } from './types';

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/standups`;

export const standupsApi = {
  get: (teamId: string, date: string) => api.get<StandupDay>(base(teamId), { query: { date } }),
  upsertMine: (
    teamId: string,
    body: { date: string; yesterday: string; today: string; blockers: string },
  ) => api.put<{ entry: StandupEntry }>(`${base(teamId)}/me`, body).then((r) => r.entry),
};
