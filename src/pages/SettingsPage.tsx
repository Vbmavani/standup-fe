import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { qk } from '../api/queryKeys';
import { teamsApi } from '../api/teams';
import type { Member, Team } from '../api/types';
import { PageHeader } from '../components/layout/AppShell';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  FormError,
  Input,
  useToast,
} from '../components/ui';
import { IconCheck, IconCopy, IconLogOut, IconRefresh } from '../components/ui/icons';
import { useTeamContext } from '../hooks/useTeamContext';
import { errorMessage } from '../lib/errors';

function useSetTeam(teamId: string) {
  const qc = useQueryClient();
  return (team: Team) => {
    qc.setQueryData<{ team: Team; members: Member[] }>(qk.team(teamId), (old) => (old ? { ...old, team } : old));
    qc.setQueryData<Team[]>(qk.teams, (old) => old?.map((t) => (t.id === team.id ? team : t)));
    void qc.invalidateQueries({ queryKey: qk.team(teamId) });
    void qc.invalidateQueries({ queryKey: qk.teams });
  };
}

function TeamNameCard() {
  const { teamId, team, isOwner } = useTeamContext();
  const [name, setName] = useState(team.name);
  const setTeam = useSetTeam(teamId);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => setName(team.name), [team.name]);

  const rename = useMutation({
    mutationFn: (n: string) => teamsApi.rename(teamId, n),
    onSuccess: (t) => {
      setTeam(t);
      void qc.invalidateQueries({ queryKey: qk.activity(teamId) });
      toast.success('Team renamed');
    },
  });

  const trimmed = name.trim();
  const dirty = trimmed !== team.name;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed || !dirty) return;
    rename.mutate(trimmed);
  };

  return (
    <Card>
      <CardHeader
        title="Team name"
        description={isOwner ? 'Visible to everyone on the team.' : 'Only the team owner can rename the team.'}
      />
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              aria-label="Team name"
              value={name}
              maxLength={100}
              disabled={!isOwner}
              onChange={(e) => {
                setName(e.target.value);
                if (rename.isError) rename.reset();
              }}
            />
            {rename.isError && (
              <div className="mt-2">
                <FormError>{errorMessage(rename.error)}</FormError>
              </div>
            )}
          </div>
          {isOwner && (
            <Button type="submit" loading={rename.isPending} disabled={!dirty || !trimmed}>
              Save
            </Button>
          )}
        </form>
      </CardBody>
    </Card>
  );
}

function InviteCard() {
  const { teamId, team, isOwner } = useTeamContext();
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const setTeam = useSetTeam(teamId);
  const toast = useToast();

  const regenerate = useMutation({
    mutationFn: () => teamsApi.regenerateInvite(teamId),
    onSuccess: (t) => {
      setTeam(t);
      setConfirm(false);
      toast.success('New invite code generated');
    },
  });

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy automatically — select the code and copy it.");
    }
  };

  return (
    <Card>
      <CardHeader title="Invite code" description="Teammates can join from their Teams page with this code." />
      <CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code
            className="flex-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-2.5 text-center font-mono text-lg font-semibold tracking-[0.3em] text-zinc-900 select-all dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            aria-label="Invite code"
          >
            {team.inviteCode}
          </code>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void copy()} className="flex-1 sm:flex-none">
              {copied ? <IconCheck className="h-4 w-4 text-emerald-600" /> : <IconCopy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            {isOwner && (
              <Button variant="secondary" onClick={() => setConfirm(true)} className="flex-1 sm:flex-none">
                <IconRefresh className="h-4 w-4" /> Regenerate
              </Button>
            )}
          </div>
        </div>
      </CardBody>
      <ConfirmModal
        open={confirm}
        onClose={() => {
          regenerate.reset();
          setConfirm(false);
        }}
        onConfirm={() => regenerate.mutate()}
        title="Regenerate invite code?"
        description="The current code will stop working immediately. Existing members are not affected."
        confirmLabel="Regenerate"
        loading={regenerate.isPending}
        error={regenerate.isError ? errorMessage(regenerate.error) : null}
      />
    </Card>
  );
}

function MembersCard() {
  const { members, me } = useTeamContext();
  const sorted = [...members].sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || a.name.localeCompare(b.name));
  return (
    <Card>
      <CardHeader title="Members" description={`${members.length} ${members.length === 1 ? 'person' : 'people'}`} />
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {sorted.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar name={m.name} id={m.id} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{m.name}</span>
                {m.id === me.id && <span className="text-xs text-zinc-400">(you)</span>}
              </div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{m.email}</div>
            </div>
            {m.isOwner && <Badge tone="indigo">Owner</Badge>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LeaveCard() {
  const { teamId, team, isOwner, members } = useTeamContext();
  const [confirm, setConfirm] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const lastMember = members.length <= 1;

  const leave = useMutation({
    mutationFn: () => teamsApi.leave(teamId),
    onSuccess: () => {
      setConfirm(false);
      navigate('/teams', { replace: true });
      qc.setQueryData<Team[]>(qk.teams, (old) => old?.filter((t) => t.id !== teamId));
      // Drop this team's cached data once the team layout has unmounted.
      window.setTimeout(() => {
        for (const k of ['team', 'tasks', 'standups', 'activity', 'summary']) {
          qc.removeQueries({ queryKey: [k, teamId] });
        }
      }, 0);
      void qc.invalidateQueries({ queryKey: qk.teams });
      toast.success(`You left ${team.name}`);
    },
  });

  return (
    <Card className="border-red-200 dark:border-red-500/30">
      <CardHeader
        title="Leave team"
        description={
          isOwner && !lastMember
            ? "As the owner, you can't leave while other members remain."
            : lastMember
              ? "You're the last member — leaving will delete this team and all of its data."
              : "You'll lose access to this team's standups and board."
        }
      />
      <CardBody className="flex justify-end">
        <Button variant="danger" onClick={() => setConfirm(true)}>
          <IconLogOut className="h-4 w-4" /> Leave team
        </Button>
      </CardBody>
      <ConfirmModal
        open={confirm}
        onClose={() => {
          leave.reset();
          setConfirm(false);
        }}
        onConfirm={() => leave.mutate()}
        title={`Leave ${team.name}?`}
        description={
          lastMember
            ? 'You are the only member. The team, its tasks, standups and activity will be permanently deleted.'
            : 'You can rejoin later with an invite code.'
        }
        confirmLabel={lastMember ? 'Delete and leave' : 'Leave team'}
        danger
        loading={leave.isPending}
        error={leave.isError ? errorMessage(leave.error) : null}
      />
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Manage your team's name, invites and members." />
      <div className="space-y-6">
        <TeamNameCard />
        <InviteCard />
        <MembersCard />
        <LeaveCard />
      </div>
    </div>
  );
}
