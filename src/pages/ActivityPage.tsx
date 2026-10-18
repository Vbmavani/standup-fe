import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { ActivityItem, ActivityType } from '../api/types';
import { PageHeader } from '../components/layout/AppShell';
import { Avatar, Button, Card, EmptyState, Skeleton } from '../components/ui';
import { IconActivity, IconColumns, IconMessage, IconSettings, IconTrash, IconUsers } from '../components/ui/icons';
import { useActivity } from '../hooks/queries';
import { useTeamContext } from '../hooks/useTeamContext';
import { formatActivity } from '../lib/activity';
import { formatDateLong, formatDateTime, localToday, relativeDayLabel, timeAgo, toDateKey } from '../lib/dates';
import { errorMessage } from '../lib/errors';

const PAGE = 50;
const MAX_LIMIT = 200;

function TypeIcon({ type }: { type: ActivityType }) {
  const cls = 'h-3 w-3';
  const icon = type.startsWith('task.') ? (
    type === 'task.deleted' ? (
      <IconTrash className={cls} />
    ) : (
      <IconColumns className={cls} />
    )
  ) : type.startsWith('member.') ? (
    <IconUsers className={cls} />
  ) : type.startsWith('team.') ? (
    <IconSettings className={cls} />
  ) : (
    <IconMessage className={cls} />
  );
  return (
    <span
      className={clsx(
        'absolute -right-1.5 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900',
        type === 'task.deleted'
          ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300'
          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
      )}
    >
      {icon}
    </span>
  );
}

/** Re-render periodically so relative times stay fresh. */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

function groupByDay(items: ActivityItem[]): { day: string; items: ActivityItem[] }[] {
  const groups: { day: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const day = toDateKey(new Date(item.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

export function ActivityPage() {
  const { teamId } = useTeamContext();
  const [limit, setLimit] = useState(PAGE);
  const q = useActivity(teamId, limit);
  const now = useNow();
  const today = localToday(now);

  const items = q.data ?? [];
  const canLoadMore = items.length >= limit && limit < MAX_LIMIT;
  const loadingMore = q.isFetching && q.isPlaceholderData;

  return (
    <>
      <PageHeader title="Activity" description="Everything that's happened on this team, newest first." />
      {q.isError && !q.data ? (
        <EmptyState
          title="Couldn't load activity"
          description={errorMessage(q.error)}
          action={
            <Button variant="secondary" onClick={() => void q.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !q.data ? (
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconActivity className="h-5 w-5" />}
          title="No activity yet"
          description="Post a standup or add a task, and it'll show up here."
        />
      ) : (
        <div className="space-y-6">
          {groupByDay(items).map((g) => (
            <section key={g.day} aria-label={formatDateLong(g.day)}>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {relativeDayLabel(g.day, today)}
              </h2>
              <Card>
                <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {g.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="relative mt-0.5">
                        <Avatar name={item.actorName} id={item.actorId} />
                        <TypeIcon type={item.type} />
                      </span>
                      <p className="min-w-0 flex-1 pt-1.5 text-sm break-words text-zinc-700 dark:text-zinc-300">
                        {formatActivity(item)}
                      </p>
                      <time
                        dateTime={item.createdAt}
                        title={formatDateTime(item.createdAt)}
                        className="shrink-0 pt-1.5 text-xs text-zinc-400 tabular-nums dark:text-zinc-500"
                      >
                        {timeAgo(item.createdAt, now)}
                      </time>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          ))}
          <div className="flex justify-center">
            {canLoadMore ? (
              <Button
                variant="secondary"
                loading={loadingMore}
                onClick={() => setLimit((l) => Math.min(l + PAGE, MAX_LIMIT))}
              >
                Load more
              </Button>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {limit >= MAX_LIMIT && items.length >= MAX_LIMIT
                  ? `Showing the latest ${MAX_LIMIT} events`
                  : "You've reached the beginning"}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
