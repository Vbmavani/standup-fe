import type { Task, TaskColumns, TaskStatus } from '../api/types';
import { TASK_STATUSES } from '../api/types';

export type ColumnIds = Record<TaskStatus, string[]>;

export function toColumnIds(columns: TaskColumns): ColumnIds {
  return {
    todo: columns.todo.map((t) => t.id),
    in_progress: columns.in_progress.map((t) => t.id),
    done: columns.done.map((t) => t.id),
  };
}

export function findTaskPosition(columns: TaskColumns | ColumnIds, taskId: string): { status: TaskStatus; index: number } | null {
  for (const status of TASK_STATUSES) {
    const list = columns[status] as (Task | string)[];
    const index = list.findIndex((t) => (typeof t === 'string' ? t : t.id) === taskId);
    if (index >= 0) return { status, index };
  }
  return null;
}

/**
 * Move a task to `toStatus` at `toIndex` (0-based position after the move, clamped),
 * mirroring the server's move semantics. Returns new column arrays; inputs are not mutated.
 */
export function moveTask(
  columns: TaskColumns,
  taskId: string,
  toStatus: TaskStatus,
  toIndex: number,
  now: string = new Date().toISOString(),
): TaskColumns {
  const from = findTaskPosition(columns, taskId);
  if (!from) return columns;
  const task = columns[from.status][from.index];
  const next: TaskColumns = {
    todo: [...columns.todo],
    in_progress: [...columns.in_progress],
    done: [...columns.done],
  };
  next[from.status].splice(from.index, 1);
  const target = next[toStatus];
  const index = Math.max(0, Math.min(toIndex, target.length));
  let completedAt = task.completedAt;
  if (toStatus === 'done' && from.status !== 'done') completedAt = now;
  if (toStatus !== 'done') completedAt = null;
  target.splice(index, 0, { ...task, status: toStatus, completedAt, updatedAt: from.status !== toStatus ? now : task.updatedAt });
  return next;
}

export function replaceTask(columns: TaskColumns, task: Task): TaskColumns {
  const pos = findTaskPosition(columns, task.id);
  if (!pos) return { ...columns, [task.status]: [...columns[task.status], task] };
  if (pos.status !== task.status) {
    return moveTask({ ...columns, [pos.status]: columns[pos.status].map((t) => (t.id === task.id ? task : t)) }, task.id, task.status, Infinity);
  }
  return { ...columns, [pos.status]: columns[pos.status].map((t) => (t.id === task.id ? task : t)) };
}

export function removeTask(columns: TaskColumns, taskId: string): TaskColumns {
  return {
    todo: columns.todo.filter((t) => t.id !== taskId),
    in_progress: columns.in_progress.filter((t) => t.id !== taskId),
    done: columns.done.filter((t) => t.id !== taskId),
  };
}
