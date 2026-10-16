import type { ActivityItem, TaskStatus } from '../api/types';
import { STATUS_LABELS } from '../api/types';
import { formatDateShort, isDateKey } from './dates';

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

export function statusLabel(v: unknown): string {
  if (typeof v === 'string' && v in STATUS_LABELS) return STATUS_LABELS[v as TaskStatus];
  return typeof v === 'string' ? v : 'unknown';
}

const FIELD_LABELS: Record<string, string> = {
  title: 'title',
  description: 'description',
  assigneeId: 'assignee',
  dueDate: 'due date',
};

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

/** Render an activity item as a readable sentence, e.g. "Alice moved 'Fix login' from To do to Done". */
export function formatActivity(item: Pick<ActivityItem, 'type' | 'actorName' | 'data'>): string {
  const who = item.actorName || 'Someone';
  const d = item.data ?? {};
  const title = str(d.title);
  const quoted = title ? `'${title}'` : 'a task';

  switch (item.type) {
    case 'team.created':
      return str(d.name) ? `${who} created the team '${d.name}'` : `${who} created the team`;
    case 'team.renamed': {
      const to = str(d.name) ?? str(d.to);
      const from = str(d.from) ?? str(d.oldName) ?? str(d.previousName);
      if (from && to) return `${who} renamed the team from '${from}' to '${to}'`;
      return to ? `${who} renamed the team to '${to}'` : `${who} renamed the team`;
    }
    case 'member.joined':
      return `${who} joined the team`;
    case 'member.left':
      return `${who} left the team`;
    case 'task.created': {
      const status = str(d.status);
      return status && status !== 'todo'
        ? `${who} created ${quoted} in ${statusLabel(status)}`
        : `${who} created ${quoted}`;
    }
    case 'task.updated': {
      const fields = Array.isArray(d.fields)
        ? (d.fields as unknown[]).filter((f): f is string => typeof f === 'string').map((f) => FIELD_LABELS[f] ?? f)
        : [];
      return fields.length
        ? `${who} updated the ${joinList(fields)} of ${quoted}`
        : `${who} updated ${quoted}`;
    }
    case 'task.moved': {
      const from = str(d.from);
      const to = str(d.to);
      if (from && to && from !== to) return `${who} moved ${quoted} from ${statusLabel(from)} to ${statusLabel(to)}`;
      if (to && from === to) return `${who} reordered ${quoted} in ${statusLabel(to)}`;
      if (to) return `${who} moved ${quoted} to ${statusLabel(to)}`;
      return `${who} moved ${quoted}`;
    }
    case 'task.deleted':
      return `${who} deleted ${quoted}`;
    case 'standup.submitted': {
      const date = str(d.date);
      return date && isDateKey(date)
        ? `${who} posted their standup for ${formatDateShort(date)}`
        : `${who} posted their standup`;
    }
    default:
      return `${who} did something`;
  }
}
