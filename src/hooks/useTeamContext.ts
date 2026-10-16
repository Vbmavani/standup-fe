import { createContext, useContext } from 'react';
import type { Member, Team, User } from '../api/types';

export type TeamContextValue = {
  teamId: string;
  team: Team;
  members: Member[];
  me: User;
  isOwner: boolean;
  memberById: Map<string, Member>;
};

export const TeamContext = createContext<TeamContextValue | null>(null);

export function useTeamContext(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeamContext must be used inside <TeamLayout>');
  return ctx;
}
