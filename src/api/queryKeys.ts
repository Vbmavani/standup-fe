export const qk = {
  me: ['me'] as const,
  teams: ['teams'] as const,
  team: (id: string) => ['team', id] as const,
  tasks: (id: string) => ['tasks', id] as const,
  standups: (id: string, date?: string) =>
    (date ? (['standups', id, date] as const) : (['standups', id] as const)),
  activity: (id: string, limit?: number) =>
    (limit ? (['activity', id, limit] as const) : (['activity', id] as const)),
  summary: (id: string, weekStart?: string) =>
    (weekStart ? (['summary', id, weekStart] as const) : (['summary', id] as const)),
};
