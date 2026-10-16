import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { qk } from '../api/queryKeys';
import { standupsApi } from '../api/standups';
import type { StandupDay, StandupEntry } from '../api/types';
import { PageHeader } from '../components/layout/AppShell';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  FormError,
  Skeleton,
  Textarea,
  fieldClass,
  useToast,
} from '../components/ui';
import { IconAlert, IconCheck, IconChevronLeft, IconChevronRight, IconMessage } from '../components/ui/icons';
import { useStandups } from '../hooks/queries';
import { useTeamContext } from '../hooks/useTeamContext';
import {
  addDays,
  formatDateLong,
  formatDateTime,
  isDateKey,
  localToday,
  relativeDayLabel,
  timeAgo,
} from '../lib/dates';
import { errorMessage } from '../lib/errors';

const MAX = 2000;

function DatePicker({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const today = localToday();
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" size="icon" aria-label="Previous day" onClick={() => onChange(addDays(date, -1))}>
        <IconChevronLeft className="h-4 w-4" />
      </Button>
      <input
        type="date"
        aria-label="Standup date"
        value={date}
        max={today}
        onChange={(e) => isDateKey(e.target.value) && onChange(e.target.value)}
        className={clsx(fieldClass, 'h-8 w-[10.5rem]')}
      />
      <Button
        variant="secondary"
        size="icon"
        aria-label="Next day"
        disabled={date >= today}
        onClick={() => onChange(addDays(date, 1))}
      >
        <IconChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" disabled={date === today} onClick={() => onChange(today)}>
        Today
      </Button>
    </div>
  );
}

type FormValues = { yesterday: string; today: string; blockers: string };
const toValues = (e?: StandupEntry): FormValues => ({
  yesterday: e?.yesterday ?? '',
  today: e?.today ?? '',
  blockers: e?.blockers ?? '',
});

function MyEntryForm({ teamId, date, entry }: { teamId: string; date: string; entry?: StandupEntry }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState<FormValues>(() => toValues(entry));
  const [submitted, setSubmitted] = useState(false);
  const baseline = useRef(toValues(entry));

  const dirty =
    values.yesterday !== baseline.current.yesterday ||
    values.today !== baseline.current.today ||
    values.blockers !== baseline.current.blockers;

  // If my entry changes elsewhere (another tab) and I haven't edited, follow it.
  useEffect(() => {
    if (!dirty) {
      const next = toValues(entry);
      baseline.current = next;
      setValues(next);
    }
    // Only re-sync when the saved entry changes, not on every local edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.updatedAt]);

  const save = useMutation({
    mutationFn: (v: FormValues) => standupsApi.upsertMine(teamId, { date, ...v }),
    onSuccess: (saved) => {
      baseline.current = toValues(saved);
      setValues(toValues(saved));
      qc.setQueryData<StandupDay>(qk.standups(teamId, date), (old) =>
        old
          ? {
              ...old,
              entries: [...old.entries.filter((e) => e.userId !== saved.userId), saved],
              missing: old.missing.filter((m) => m.id !== saved.userId),
            }
          : old,
      );
      void qc.invalidateQueries({ queryKey: qk.standups(teamId) });
      void qc.invalidateQueries({ queryKey: qk.activity(teamId) });
      void qc.invalidateQueries({ queryKey: qk.summary(teamId) });
      toast.success(entry ? 'Standup updated' : 'Standup posted');
    },
  });

  const todayError = submitted && !values.today.trim() ? 'Tell your team what you plan to work on.' : undefined;
  const tooLong = (s: string) => (s.length > MAX ? `Keep it under ${MAX} characters.` : undefined);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!values.today.trim() || [values.yesterday, values.today, values.blockers].some((s) => s.length > MAX)) return;
    save.mutate({ yesterday: values.yesterday.trim(), today: values.today.trim(), blockers: values.blockers.trim() });
  };

  const set = (k: keyof FormValues) => (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (save.isError) save.reset();
  };

  return (
    <Card>
      <CardHeader
        title="My update"
        description={
          entry ? (
            <span className="inline-flex items-center gap-1">
              <IconCheck className="h-3.5 w-3.5 text-emerald-600" /> Posted · last edited {timeAgo(entry.updatedAt)}
            </span>
          ) : (
            "You haven't posted for this day yet."
          )
        }
      />
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError>{save.isError ? errorMessage(save.error) : null}</FormError>
          <Textarea
            label="What did you do yesterday?"
            rows={3}
            value={values.yesterday}
            onChange={set('yesterday')}
            placeholder="Shipped the login fix, reviewed two PRs…"
            error={tooLong(values.yesterday)}
            hint={`${values.yesterday.length}/${MAX}`}
          />
          <Textarea
            label="What will you do today?"
            rows={3}
            value={values.today}
            onChange={set('today')}
            placeholder="Pair on the billing migration…"
            error={todayError ?? tooLong(values.today)}
            hint={`${values.today.length}/${MAX}`}
            required
          />
          <Textarea
            label="Any blockers?"
            rows={2}
            value={values.blockers}
            onChange={set('blockers')}
            placeholder="Waiting on API keys from ops…"
            error={tooLong(values.blockers)}
            hint={`${values.blockers.length}/${MAX}`}
          />
          <div className="flex items-center justify-end gap-2">
            {dirty && entry && (
              <Button
                variant="ghost"
                disabled={save.isPending}
                onClick={() => {
                  setValues(baseline.current);
                  setSubmitted(false);
                }}
              >
                Discard changes
              </Button>
            )}
            <Button type="submit" loading={save.isPending} disabled={!dirty && !!entry}>
              {entry ? 'Save update' : 'Post update'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div>
      <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">{label}</div>
      <p className="mt-1 text-sm break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{text}</p>
    </div>
  );
}

function EntryCard({ entry, isMe }: { entry: StandupEntry; isMe: boolean }) {
  const hasBlockers = !!entry.blockers.trim();
  return (
    <Card className={clsx('p-4', hasBlockers && 'border-amber-300 dark:border-amber-500/40')}>
      <div className="flex items-center gap-3">
        <Avatar name={entry.userName} id={entry.userId} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{entry.userName}</span>
            {isMe && <Badge>You</Badge>}
            {hasBlockers && (
              <Badge tone="amber">
                <IconAlert className="h-3 w-3" /> Blocked
              </Badge>
            )}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400" title={formatDateTime(entry.updatedAt)}>
            Updated {timeAgo(entry.updatedAt)}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Section label="Yesterday" text={entry.yesterday} />
        <Section label="Today" text={entry.today} />
        {hasBlockers && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
              <IconAlert className="h-3.5 w-3.5" /> Blockers
            </div>
            <p className="mt-1 text-sm break-words whitespace-pre-wrap text-amber-900 dark:text-amber-100">
              {entry.blockers}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function StandupPage() {
  const { teamId, me } = useTeamContext();
  const [params, setParams] = useSearchParams();
  const paramDate = params.get('date');
  const date = isDateKey(paramDate) ? paramDate : localToday();
  const q = useStandups(teamId, date);

  const setDate = (d: string) => {
    const next = new URLSearchParams(params);
    if (d === localToday()) next.delete('date');
    else next.set('date', d);
    setParams(next, { replace: true });
  };

  const ready = q.data && !q.isPlaceholderData;
  const myEntry = q.data?.entries.find((e) => e.userId === me.id);
  const entries = [...(q.data?.entries ?? [])].sort((a, b) =>
    a.userId === me.id ? -1 : b.userId === me.id ? 1 : b.updatedAt.localeCompare(a.updatedAt),
  );
  const missing = q.data?.missing ?? [];

  return (
    <>
      <PageHeader
        title="Daily standup"
        description={`${relativeDayLabel(date)} · ${formatDateLong(date)}`}
        actions={<DatePicker date={date} onChange={setDate} />}
      />
      {q.isError && !q.data ? (
        <EmptyState
          title="Couldn't load standups"
          description={errorMessage(q.error)}
          action={
            <Button variant="secondary" onClick={() => void q.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="team-updates">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="team-updates" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Team updates
                  {q.data && (
                    <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">{q.data.entries.length}</span>
                  )}
                </h2>
                {q.isFetching && q.data && <span className="text-xs text-zinc-400">Refreshing…</span>}
              </div>
              {!q.data ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-44 rounded-xl" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={<IconMessage className="h-5 w-5" />}
                  title="No updates yet"
                  description="Nobody has posted a standup for this day. Be the first!"
                />
              ) : (
                <div className={clsx('grid gap-4 md:grid-cols-2', q.isPlaceholderData && 'opacity-60')}>
                  {entries.map((e) => (
                    <EntryCard key={e.userId} entry={e} isMe={e.userId === me.id} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {ready ? (
              <MyEntryForm key={`${teamId}:${date}`} teamId={teamId} date={date} entry={myEntry} />
            ) : (
              <Skeleton className="h-96 rounded-xl" />
            )}
            <Card>
              <CardHeader
                title="Not posted yet"
                description={q.data ? `${missing.length} of ${missing.length + q.data.entries.length}` : undefined}
              />
              <CardBody>
                {!q.data ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ) : missing.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <IconCheck className="h-4 w-4" /> Everyone has posted.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {missing.map((m) => (
                      <li key={m.id} className="flex items-center gap-2.5">
                        <Avatar name={m.name} id={m.id} size="sm" />
                        <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">{m.name}</span>
                        {m.id === me.id && <Badge>You</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
