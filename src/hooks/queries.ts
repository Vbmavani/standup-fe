import { useQuery } from '@tanstack/react-query';
import { activityApi, summaryApi } from '../api/activity';
import { qk } from '../api/queryKeys';
import { standupsApi } from '../api/standups';
import { tasksApi } from '../api/tasks';
import { teamsApi } from '../api/teams';
import type { ActivityItem, StandupDay, WeeklySummary } from '../api/types';

/** Keep showing the previous page's data while a new key loads, but only within the same team. */
function sameTeamPlaceholder<T>(teamId: string) {
  return (prev: T | undefined, prevQuery: { queryKey: readonly unknown[] } | undefined) =>
    prevQuery?.queryKey[1] === teamId ? prev : undefined;
}

export function useTeams() {
  return useQuery({ queryKey: qk.teams, queryFn: teamsApi.list });
}

export function useTeam(teamId: string) {
  return useQuery({ queryKey: qk.team(teamId), queryFn: () => teamsApi.get(teamId) });
}

export function useTasks(teamId: string) {
  return useQuery({ queryKey: qk.tasks(teamId), queryFn: () => tasksApi.list(teamId) });
}

export function useStandups(teamId: string, date: string) {
  return useQuery({
    queryKey: qk.standups(teamId, date),
    queryFn: () => standupsApi.get(teamId, date),
    placeholderData: sameTeamPlaceholder<StandupDay>(teamId),
  });
}

export function useActivity(teamId: string, limit: number) {
  return useQuery({
    queryKey: qk.activity(teamId, limit),
    queryFn: () => activityApi.list(teamId, limit),
    placeholderData: sameTeamPlaceholder<ActivityItem[]>(teamId),
  });
}

export function useSummary(teamId: string, weekStart: string) {
  return useQuery({
    queryKey: qk.summary(teamId, weekStart),
    queryFn: () => summaryApi.get(teamId, weekStart),
    placeholderData: sameTeamPlaceholder<WeeklySummary>(teamId),
  });
}
