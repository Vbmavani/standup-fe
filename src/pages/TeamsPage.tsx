import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { qk } from '../api/queryKeys';
import { teamsApi } from '../api/teams';
import type { Team } from '../api/types';
import { PageHeader } from '../components/layout/AppShell';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, FormError, Input, Skeleton, useToast } from '../components/ui';
import { IconChevronRight, IconUsers } from '../components/ui/icons';
import { useTeams } from '../hooks/queries';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../lib/errors';

function TeamCard({ team, isOwner }: { team: Team; isOwner: boolean }) {
  return (
    <Link
      to={`/t/${team.id}/standup`}
      className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-base font-semibold text-white dark:bg-indigo-500">
        {team.name.trim().charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-100">{team.name}</h3>
          {isOwner && <Badge tone="indigo">Owner</Badge>}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          <IconUsers className="h-3.5 w-3.5" />
          {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>
      <IconChevronRight className="h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-zinc-600" />
    </Link>
  );
}

function CreateTeamForm() {
  const [name, setName] = useState('');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const create = useMutation({
    mutationFn: teamsApi.create,
    onSuccess: (team) => {
      qc.setQueryData<Team[]>(qk.teams, (old) =>
        old ? [...old.filter((t) => t.id !== team.id), team].sort((a, b) => a.name.localeCompare(b.name)) : old,
      );
      void qc.invalidateQueries({ queryKey: qk.teams });
      toast.success(`Created ${team.name}`);
      navigate(`/t/${team.id}/standup`);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(name.trim());
  };

  return (
    <Card>
      <CardHeader title="Create a team" description="You'll be the owner and can invite others." />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-3">
          <FormError>{create.isError ? errorMessage(create.error) : null}</FormError>
          <Input
            label="Team name"
            placeholder="e.g. Platform squad"
            value={name}
            maxLength={100}
            onChange={(e) => {
              setName(e.target.value);
              if (create.isError) create.reset();
            }}
          />
          <Button type="submit" className="w-full" loading={create.isPending} disabled={!name.trim()}>
            Create team
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function JoinTeamForm() {
  const [code, setCode] = useState('');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const join = useMutation({
    mutationFn: teamsApi.join,
    onSuccess: (team) => {
      void qc.invalidateQueries({ queryKey: qk.teams });
      toast.success(`Joined ${team.name}`);
      navigate(`/t/${team.id}/standup`);
    },
  });

  const normalized = code.replace(/\s+/g, '').toUpperCase();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!normalized) return;
    join.mutate(normalized);
  };

  return (
    <Card>
      <CardHeader title="Join a team" description="Ask a teammate for their 8-character invite code." />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-3">
          <FormError>{join.isError ? errorMessage(join.error) : null}</FormError>
          <Input
            label="Invite code"
            placeholder="ABCD1234"
            value={code}
            maxLength={16}
            autoCapitalize="characters"
            spellCheck={false}
            className="[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-widest"
            onChange={(e) => {
              setCode(e.target.value);
              if (join.isError) join.reset();
            }}
          />
          <Button type="submit" variant="secondary" className="w-full" loading={join.isPending} disabled={!normalized}>
            Join team
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export function TeamsPage() {
  const teams = useTeams();
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title={user ? `Hi, ${user.name.split(' ')[0]}` : 'Your teams'}
        description="Pick a team to see today's standup and the board."
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="my-teams">
          <h2 id="my-teams" className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            My teams
          </h2>
          {teams.isPending ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[74px] rounded-xl" />
              ))}
            </div>
          ) : teams.isError ? (
            <EmptyState
              title="Couldn't load your teams"
              description={errorMessage(teams.error)}
              action={
                <Button variant="secondary" onClick={() => void teams.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : teams.data.length === 0 ? (
            <EmptyState
              icon={<IconUsers className="h-5 w-5" />}
              title="You're not in any teams yet"
              description="Create a team for your group, or join an existing one with an invite code."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.data.map((t) => (
                <TeamCard key={t.id} team={t} isOwner={t.ownerId === user?.id} />
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-4">
          <CreateTeamForm />
          <JoinTeamForm />
        </aside>
      </div>
    </>
  );
}
