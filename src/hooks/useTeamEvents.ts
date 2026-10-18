import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { EventType } from '../api/types';

/** Query keys (prefixes) to invalidate for each live event type, per docs/PLAN.md. */
export function keysForEvent(type: EventType, teamId: string): (readonly unknown[])[] {
  switch (type) {
    case 'tasks':
      return [['tasks', teamId]];
    case 'standups':
      return [['standups', teamId]];
    case 'activity':
      return [
        ['activity', teamId],
        ['summary', teamId],
      ];
    case 'team':
      return [['team', teamId], ['teams']];
    case 'members':
      return [['team', teamId], ['teams'], ['standups', teamId]];
    default:
      return [];
  }
}

export function handleEventMessage(qc: QueryClient, teamId: string, raw: string): void {
  let type: unknown;
  try {
    type = (JSON.parse(raw) as { type?: unknown })?.type;
  } catch {
    return;
  }
  if (typeof type !== 'string') return;
  for (const queryKey of keysForEvent(type as EventType, teamId)) {
    void qc.invalidateQueries({ queryKey });
  }
}

/** Subscribe to the team's SSE stream and refetch affected queries on each event. */
export function useTeamEvents(teamId: string | undefined, enabled = true): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!teamId || !enabled || typeof EventSource === 'undefined') return;
    const es = new EventSource(`/api/teams/${encodeURIComponent(teamId)}/events`, { withCredentials: true });
    let hadError = false;

    es.onmessage = (ev: MessageEvent<string>) => handleEventMessage(qc, teamId, ev.data);
    es.onopen = () => {
      // After a reconnect, catch up on anything missed while disconnected.
      if (hadError) {
        hadError = false;
        for (const key of ['tasks', 'standups', 'activity', 'summary', 'team']) {
          void qc.invalidateQueries({ queryKey: [key, teamId] });
        }
      }
    };
    es.onerror = () => {
      // EventSource reconnects automatically unless the server answered with a hard error.
      hadError = true;
    };

    return () => es.close();
  }, [qc, teamId, enabled]);
}
