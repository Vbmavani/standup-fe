import { describe, expect, it } from 'vitest';
import type { Task, TaskColumns, TaskStatus } from '../api/types';
import { moveTask } from './board';

const t = (id: string, status: TaskStatus): Task => ({
  id,
  teamId: 'team',
  title: id,
  description: '',
  status,
  assigneeId: null,
  dueDate: null,
  createdBy: 'u',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  completedAt: status === 'done' ? '2026-10-02T00:00:00.000Z' : null,
});

const cols = (): TaskColumns => ({
  todo: [t('a', 'todo'), t('b', 'todo'), t('c', 'todo')],
  in_progress: [t('d', 'in_progress')],
  done: [t('e', 'done')],
});

const ids = (c: TaskColumns) => ({ todo: c.todo.map((x) => x.id), in_progress: c.in_progress.map((x) => x.id), done: c.done.map((x) => x.id) });

describe('moveTask', () => {
  it('reorders within a column using the post-move index', () => {
    expect(ids(moveTask(cols(), 'a', 'todo', 2)).todo).toEqual(['b', 'c', 'a']);
    expect(ids(moveTask(cols(), 'c', 'todo', 0)).todo).toEqual(['c', 'a', 'b']);
  });

  it('moves across columns and sets / clears completedAt', () => {
    const now = '2026-10-16T10:00:00.000Z';
    const toDone = moveTask(cols(), 'b', 'done', 0, now);
    expect(ids(toDone)).toEqual({ todo: ['a', 'c'], in_progress: ['d'], done: ['b', 'e'] });
    expect(toDone.done[0]).toMatchObject({ status: 'done', completedAt: now });

    const outOfDone = moveTask(cols(), 'e', 'in_progress', 5, now);
    expect(ids(outOfDone).in_progress).toEqual(['d', 'e']); // clamped
    expect(outOfDone.in_progress[1].completedAt).toBeNull();
  });

  it('does not mutate the input', () => {
    const input = cols();
    moveTask(input, 'a', 'done', 0);
    expect(ids(input).todo).toEqual(['a', 'b', 'c']);
  });
});
