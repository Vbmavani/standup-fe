import { api } from './client';
import type { ActivityItem, WeeklySummary } from './types';

export const activityApi = {
  list: (teamId: string, limit: number) =>
    api
      .get<{ items: ActivityItem[] }>(`/teams/${encodeURIComponent(teamId)}/activity`, { query: { limit } })
      .then((r) => r.items),
};

export const summaryApi = {
  get: (teamId: string, weekStart: string) =>
    api.get<WeeklySummary>(`/teams/${encodeURIComponent(teamId)}/summary`, { query: { weekStart } }),
};
