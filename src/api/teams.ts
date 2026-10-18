import { api } from './client';
import type { Member, Team } from './types';

const t = (teamId: string) => `/teams/${encodeURIComponent(teamId)}`;

export const teamsApi = {
  list: () => api.get<{ teams: Team[] }>('/teams').then((r) => r.teams),
  create: (name: string) => api.post<{ team: Team }>('/teams', { name }).then((r) => r.team),
  join: (inviteCode: string) => api.post<{ team: Team }>('/teams/join', { inviteCode }).then((r) => r.team),
  get: (teamId: string) => api.get<{ team: Team; members: Member[] }>(t(teamId)),
  rename: (teamId: string, name: string) => api.patch<{ team: Team }>(t(teamId), { name }).then((r) => r.team),
  members: (teamId: string) => api.get<{ members: Member[] }>(`${t(teamId)}/members`).then((r) => r.members),
  regenerateInvite: (teamId: string) => api.post<{ team: Team }>(`${t(teamId)}/invite`).then((r) => r.team),
  leave: (teamId: string) => api.delete(`${t(teamId)}/members/me`),
};
