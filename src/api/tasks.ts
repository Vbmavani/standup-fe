import { api } from './client';
import type { Task, TaskColumns, TaskStatus } from './types';

const base = (teamId: string) => `/teams/${encodeURIComponent(teamId)}/tasks`;

export type CreateTaskInput = {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  status?: TaskStatus;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export const tasksApi = {
  list: (teamId: string) => api.get<{ columns: TaskColumns }>(base(teamId)).then((r) => r.columns),
  create: (teamId: string, body: CreateTaskInput) =>
    api.post<{ task: Task }>(base(teamId), body).then((r) => r.task),
  update: (teamId: string, taskId: string, body: UpdateTaskInput) =>
    api.patch<{ task: Task }>(`${base(teamId)}/${encodeURIComponent(taskId)}`, body).then((r) => r.task),
  move: (teamId: string, taskId: string, body: { status: TaskStatus; index: number }) =>
    api.post<{ task: Task }>(`${base(teamId)}/${encodeURIComponent(taskId)}/move`, body).then((r) => r.task),
  remove: (teamId: string, taskId: string) => api.delete(`${base(teamId)}/${encodeURIComponent(taskId)}`),
};
