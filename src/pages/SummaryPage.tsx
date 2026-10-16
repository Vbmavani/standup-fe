import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WeeklySummary } from '../api/types';
import { PageHeader } from '../components/layout/AppShell';
import { Avatar, Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from '../components/ui';
import { IconAlert, IconChart, IconCheck, IconChevronLeft, IconChevronRight, IconMessage, IconPlus } from '../components/ui/icons';
import { useSummary } from '../hooks/queries';
import { useTeamContext } from '../hooks/useTeamContext';
import { addDays, formatDateLong, formatWeekRange, isDateKey, localToday, weekStart } from '../lib/dates';
import { errorMessage } from '../lib/errors';

function WeekPicker({ start, onChange }: { start: string; onChange: (s: string) => void }) {
  const thisWeek = weekStart(localToday());
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" size="icon" aria-label="Previous week" onClick={() => onChange(addDays(start, -7))}>
        <IconChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[11rem] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-center text-sm font-medium tabular-nums text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {formatWeekRange(start)}
      </span>
      <Button
        variant="secondary"
        size="icon"
        aria-label="Next week"
        disabled={start >= thisWeek}
        onClick={() => onChange(addDays(start, 7))}
      >
        <IconChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" disabled={start === thisWeek} onClick={() => onChange(thisWeek)}>
        This week
      </Button>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number | undefined; icon: ReactNode; tone: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={clsx('flex h-7 w-7 items-center justify-center rounded-lg', tone)}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
        {value === undefined ? <Skeleton className="h-8 w-12" /> : value}
      </div>
    </Card>
  );
}

function groupBlockers(blockers: WeeklySummary['blockers']) {
  const map = new Map<string, WeeklySummary['blockers']>();
  for (const b of [...blockers].sort((a, b) => a.date.localeCompare(b.date))) {
    const list = map.get(b.date) ?? [];
    list.push(b);
    map.set(b.date, list);
  }
  return [...map.entries()];
}

export function SummaryPage() {
  const { teamId } = useTeamContext();
  const [params, setParams] = useSearchParams();
  const raw = params.get('week');
  const start = isDateKey(raw) ? weekStart(raw) : weekStart(localToday());
  const q = useSummary(teamId, start);
  const data = q.data; // previous week stays visible (dimmed) while the next one loads
  const stale = q.isPlaceholderData;

  const setWeek = (s: string) => {
    const next = new URLSearchParams(params);
    if (s === weekStart(localToday())) next.delete('week');
    else next.set('week', s);
    setParams(next, { replace: true });
  };

  const totals = stale ? undefined : data?.totals;
  const members = [...(data?.members ?? [])].sort(
    (a, b) => b.standupsSubmitted + b.tasksCompleted - (a.standupsSubmitted + a.tasksCompleted) || a.name.localeCompare(b.name),
  );
  const hasActivity =
    !!data && (data.totals.tasksCreated + data.totals.tasksCompleted + data.totals.standupsSubmitted + data.totals.blockers > 0);

  return (
    <>
      <PageHeader title="Weekly summary" description="What the team got done, Monday to Sunday." actions={<WeekPicker start={start} onChange={setWeek} />} />
      {q.isError && !q.data ? (
        <EmptyState
          title="Couldn't load the summary"
          description={errorMessage(q.error)}
          action={<Button variant="secondary" onClick={() => void q.refetch()}>Try again</Button>}
        />
      ) : (
        <div className={clsx('space-y-6 transition-opacity', stale && 'opacity-60')}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Tasks created" value={totals?.tasksCreated} icon={<IconPlus className="h-4 w-4" />} tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300" />
            <StatCard label="Tasks completed" value={totals?.tasksCompleted} icon={<IconCheck className="h-4 w-4" />} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" />
            <StatCard label="Standups posted" value={totals?.standupsSubmitted} icon={<IconMessage className="h-4 w-4" />} tone="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" />
            <StatCard label="Blockers" value={totals?.blockers} icon={<IconAlert className="h-4 w-4" />} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" />
          </div>

          {data && !hasActivity && !stale ? (
            <EmptyState
              icon={<IconChart className="h-5 w-5" />}
              title="A quiet week"
              description="No tasks, standups or blockers were recorded for this week."
            />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card className="overflow-hidden">
                <CardHeader title="By member" />
                {!data ? (
                  <CardBody className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </CardBody>
                ) : members.length === 0 ? (
                  <CardBody>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No members.</p>
                  </CardBody>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                          <th scope="col" className="px-5 py-2.5 font-medium">Member</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Standups</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Created</th>
                          <th scope="col" className="px-5 py-2.5 text-right font-medium">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {members.map((m) => (
                          <tr key={m.userId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={m.name} id={m.userId} size="sm" />
                                <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                              {m.standupsSubmitted}
                              <span className="text-zinc-400">/7</span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{m.tasksCreated}</td>
                            <td className="px-5 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{m.tasksCompleted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader title="Blockers" description={data ? `${data.blockers.length} reported` : undefined} />
                <CardBody>
                  {!data ? (
                    <Skeleton className="h-16 w-full" />
                  ) : data.blockers.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                      <IconCheck className="h-4 w-4" /> No blockers reported this week.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {groupBlockers(data.blockers).map(([date, list]) => (
                        <div key={date}>
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {formatDateLong(date)}
                          </h3>
                          <ul className="space-y-2">
                            {list.map((b, i) => (
                              <li
                                key={`${b.userId}-${i}`}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar name={b.name} id={b.userId} size="xs" />
                                  <span className="text-xs font-medium text-amber-900 dark:text-amber-200">{b.name}</span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-amber-900 dark:text-amber-100">{b.text}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
