import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { qk } from '../../api/queryKeys';
import { tasksApi, type CreateTaskInput, type UpdateTaskInput } from '../../api/tasks';
import { STATUS_LABELS, type Member, type Task, type TaskColumns, type TaskStatus } from '../../api/types';
import { removeTask, replaceTask } from '../../lib/board';
import { formatDateTime } from '../../lib/dates';
import { errorMessage } from '../../lib/errors';
import { Button, ConfirmModal, FormError, Input, Modal, Select, Textarea, useToast } from '../ui';
import { IconTrash } from '../ui/icons';

export type TaskModalState = { mode: 'create'; status: TaskStatus } | { mode: 'edit'; task: Task } | null;

export function TaskModal({
  state,
  onClose,
  teamId,
  members,
}: {
  state: TaskModalState;
  onClose: () => void;
  teamId: string;
  members: Member[];
}) {
  if (!state) return null;
  // Remount the form whenever a different task / mode is opened.
  const key = state.mode === 'edit' ? state.task.id : `new-${state.status}`;
  return <TaskForm key={key} state={state} onClose={onClose} teamId={teamId} members={members} />;
}

function TaskForm({
  state,
  onClose,
  teamId,
  members,
}: {
  state: NonNullable<TaskModalState>;
  onClose: () => void;
  teamId: string;
  members: Member[];
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const editing = state.mode === 'edit' ? state.task : null;
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [assigneeId, setAssigneeId] = useState(editing?.assigneeId ?? '');
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const afterChange = () => {
    void qc.invalidateQueries({ queryKey: qk.tasks(teamId) });
    void qc.invalidateQueries({ queryKey: qk.activity(teamId) });
    void qc.invalidateQueries({ queryKey: qk.summary(teamId) });
  };

  const create = useMutation({
    mutationFn: (body: CreateTaskInput) => tasksApi.create(teamId, body),
    onSuccess: (task) => {
      qc.setQueryData<TaskColumns>(qk.tasks(teamId), (old) => (old ? replaceTask(old, task) : old));
      afterChange();
      toast.success('Task created');
      onClose();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskInput }) => tasksApi.update(teamId, id, body),
    onSuccess: (task) => {
      qc.setQueryData<TaskColumns>(qk.tasks(teamId), (old) => (old ? replaceTask(old, task) : old));
      afterChange();
      toast.success('Task saved');
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => tasksApi.remove(teamId, id),
    onSuccess: (_v, id) => {
      qc.setQueryData<TaskColumns>(qk.tasks(teamId), (old) => (old ? removeTask(old, id) : old));
      afterChange();
      toast.success('Task deleted');
      setConfirmDelete(false);
      onClose();
    },
  });

  const saving = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const titleError =
    submitted && !title.trim()
      ? 'Give the task a title.'
      : title.length > 200
        ? 'Keep the title under 200 characters.'
        : undefined;
  const descError = description.length > 5000 ? 'Keep the description under 5000 characters.' : undefined;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const t = title.trim();
    if (!t || t.length > 200 || description.length > 5000) return;

    if (!editing) {
      const body: CreateTaskInput = { title: t, status: state.mode === 'create' ? state.status : undefined };
      if (description.trim()) body.description = description.trim();
      if (assigneeId) body.assigneeId = assigneeId;
      if (dueDate) body.dueDate = dueDate;
      create.mutate(body);
      return;
    }

    const body: UpdateTaskInput = {};
    if (t !== editing.title) body.title = t;
    if (description.trim() !== editing.description) body.description = description.trim();
    if ((assigneeId || null) !== editing.assigneeId) body.assigneeId = assigneeId || null;
    if ((dueDate || null) !== editing.dueDate) body.dueDate = dueDate || null;
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }
    update.mutate({ id: editing.id, body });
  };

  const formId = 'task-form';
  const creator = editing ? members.find((m) => m.id === editing.createdBy) : undefined;
  const assigneeMissing = editing?.assigneeId && !members.some((m) => m.id === editing.assigneeId);

  return (
    <>
      <Modal
        open={!confirmDelete}
        onClose={saving ? () => undefined : onClose}
        title={editing ? 'Edit task' : `New task in ${STATUS_LABELS[state.mode === 'create' ? state.status : 'todo']}`}
        description={
          editing
            ? `${STATUS_LABELS[editing.status]} · created ${formatDateTime(editing.createdAt)}${creator ? ` by ${creator.name}` : ''}`
            : undefined
        }
        footer={
          <>
            {editing && (
              <Button
                variant="danger-ghost"
                className="mr-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                <IconTrash className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={saving}>
              {editing ? 'Save changes' : 'Create task'}
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="space-y-4">
          <FormError>{error ? errorMessage(error) : null}</FormError>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            error={titleError}
            maxLength={200}
            data-autofocus
          />
          <Textarea
            label="Description"
            hint="Optional"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail…"
            error={descError}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {assigneeMissing && <option value={editing!.assigneeId!}>Former member</option>}
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <div>
              <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="mt-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Clear due date
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        open={confirmDelete}
        onClose={() => {
          remove.reset();
          setConfirmDelete(false);
        }}
        onConfirm={() => editing && remove.mutate(editing.id)}
        title="Delete this task?"
        description={
          <>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">'{editing?.title}'</span> will be removed for
            everyone. This can't be undone.
          </>
        }
        confirmLabel="Delete task"
        danger
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
      />
    </>
  );
}
