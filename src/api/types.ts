// Shared types copied from docs/PLAN.md. Keep in sync with the API contract.

export type User = { id: string; name: string; email: string; createdAt: string };

export type Team = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
};

export type Member = { id: string; name: string; email: string; isOwner: boolean };

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  teamId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null; // YYYY-MM-DD
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type StandupEntry = {
  userId: string;
  userName: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  updatedAt: string;
};

export type ActivityType =
  | 'team.created'
  | 'team.renamed'
  | 'member.joined'
  | 'member.left'
  | 'task.created'
  | 'task.updated'
  | 'task.moved'
  | 'task.deleted'
  | 'standup.submitted';

export type ActivityItem = {
  id: string; // stream entry id
  type: ActivityType;
  actorId: string;
  actorName: string;
  createdAt: string;
  data: Record<string, unknown>; // e.g. { taskId, title, from, to } or { date } or { name }
};

export type EventType = 'tasks' | 'standups' | 'activity' | 'team' | 'members';

export type ApiErrorBody = { error: { code: string; message: string } };

export type ErrorCode = 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL';

// Response shapes
export type TaskColumns = { todo: Task[]; in_progress: Task[]; done: Task[] };

export type StandupDay = { date: string; entries: StandupEntry[]; missing: Member[] };

export type WeeklySummary = {
  weekStart: string;
  weekEnd: string; // weekEnd = weekStart + 6 days
  totals: { tasksCreated: number; tasksCompleted: number; standupsSubmitted: number; blockers: number };
  members: { userId: string; name: string; standupsSubmitted: number; tasksCreated: number; tasksCompleted: number }[];
  blockers: { userId: string; name: string; date: string; text: string }[]; // non-empty blockers, by date
};

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};
