import { describe, expect, it } from 'vitest';
import type { ActivityItem } from '../api/types';
import { formatActivity } from './activity';

const item = (type: ActivityItem['type'], data: Record<string, unknown> = {}, actorName = 'Alice') => ({
  type,
  actorName,
  data,
});

describe('formatActivity', () => {
  it('describes moves between columns with readable labels', () => {
    expect(formatActivity(item('task.moved', { taskId: '1', title: 'Fix login', from: 'todo', to: 'done' }))).toBe(
      "Alice moved 'Fix login' from To do to Done",
    );
    expect(formatActivity(item('task.moved', { title: 'Fix login', from: 'in_progress', to: 'in_progress' }))).toBe(
      "Alice reordered 'Fix login' in In progress",
    );
  });

  it('describes task lifecycle events', () => {
    expect(formatActivity(item('task.created', { title: 'Write docs' }))).toBe("Alice created 'Write docs'");
    expect(formatActivity(item('task.created', { title: 'Write docs', status: 'in_progress' }))).toBe(
      "Alice created 'Write docs' in In progress",
    );
    expect(formatActivity(item('task.updated', { title: 'Write docs' }))).toBe("Alice updated 'Write docs'");
    expect(formatActivity(item('task.updated', { title: 'Write docs', fields: ['assigneeId', 'dueDate'] }))).toBe(
      "Alice updated the assignee and due date of 'Write docs'",
    );
    expect(formatActivity(item('task.deleted', { title: 'Old task' }))).toBe("Alice deleted 'Old task'");
    expect(formatActivity(item('task.deleted'))).toBe('Alice deleted a task');
  });

  it('describes team and member events', () => {
    expect(formatActivity(item('team.created', { name: 'Core' }))).toBe("Alice created the team 'Core'");
    expect(formatActivity(item('team.renamed', { name: 'Platform' }))).toBe("Alice renamed the team to 'Platform'");
    expect(formatActivity(item('team.renamed', { from: 'Core', to: 'Platform' }))).toBe(
      "Alice renamed the team from 'Core' to 'Platform'",
    );
    expect(formatActivity(item('member.joined', {}, 'Bob'))).toBe('Bob joined the team');
    expect(formatActivity(item('member.left', {}, 'Bob'))).toBe('Bob left the team');
  });

  it('describes standups', () => {
    expect(formatActivity(item('standup.submitted', { date: 'not-a-date' }))).toBe('Alice posted their standup');
    expect(formatActivity(item('standup.submitted', { date: '2026-10-16' }))).toMatch(/^Alice posted their standup for /);
  });

  it('falls back gracefully on missing data', () => {
    expect(formatActivity(item('task.moved', { title: 'X', to: 'done' }))).toBe("Alice moved 'X' to Done");
    expect(formatActivity(item('member.joined', {}, ''))).toBe('Someone joined the team');
  });
});
