import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { qk } from '../api/queryKeys';
import { tasksApi } from '../api/tasks';
import { STATUS_LABELS, TASK_STATUSES, type Member, type Task, type TaskColumns, type TaskStatus } from '../api/types';
import { SortableTaskCard, TaskCardView } from '../components/board/TaskCard';
import { TaskModal, type TaskModalState } from '../components/board/TaskModal';
import { PageHeader } from '../components/layout/AppShell';
import { Button, EmptyState, Skeleton, useToast } from '../components/ui';
import { IconPlus } from '../components/ui/icons';
import { useTasks } from '../hooks/queries';
import { useTeamContext } from '../hooks/useTeamContext';
import { findTaskPosition, moveTask, toColumnIds, type ColumnIds } from '../lib/board';
import { errorMessage } from '../lib/errors';

const COLUMN_DOT: Record<TaskStatus, string> = {
  todo: 'bg-zinc-400',
  in_progress: 'bg-indigo-500',
  done: 'bg-emerald-500',
};

function isStatus(id: unknown): id is TaskStatus {
  return typeof id === 'string' && (TASK_STATUSES as string[]).includes(id);
}

function Column({
  status,
  taskIds,
  taskById,
  memberById,
  onOpen,
  onAdd,
}: {
  status: TaskStatus;
  taskIds: string[];
  taskById: Map<string, Task>;
  memberById: Map<string, Member>;
  onOpen: (t: Task) => void;
  onAdd: (s: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column' } });
  return (
    <section
      aria-label={STATUS_LABELS[status]}
      className="flex min-h-[200px] w-[85vw] max-w-[340px] shrink-0 snap-start flex-col rounded-xl border border-zinc-200 bg-zinc-100/60 md:w-auto md:max-w-none md:shrink dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={clsx('h-2 w-2 rounded-full', COLUMN_DOT[status])} />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{STATUS_LABELS[status]}</h2>
          <span className="rounded-full bg-white px-1.5 text-xs font-medium text-zinc-500 tabular-nums ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
            {taskIds.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Add task to ${STATUS_LABELS[status]}`}
          onClick={() => onAdd(status)}
        >
          <IconPlus className="h-4 w-4" />
        </Button>
      </header>
      <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={clsx(
            'flex flex-1 flex-col gap-2 rounded-b-xl px-2 pb-2 transition-colors',
            isOver && 'bg-indigo-50/70 dark:bg-indigo-500/5',
          )}
        >
          {taskIds.map((id) => {
            const task = taskById.get(id);
            if (!task) return null;
            return (
              <SortableTaskCard
                key={id}
                task={task}
                assignee={task.assigneeId ? memberById.get(task.assigneeId) : undefined}
                onOpen={onOpen}
              />
            );
          })}
          {taskIds.length === 0 && (
            <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
              Drop tasks here
            </li>
          )}
        </ul>
      </SortableContext>
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-white hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <IconPlus className="h-4 w-4" /> Add task
        </button>
      </div>
    </section>
  );
}

export function BoardPage() {
  const { teamId, members, memberById } = useTeamContext();
  const tasks = useTasks(teamId);
  const qc = useQueryClient();
  const toast = useToast();
  const [modal, setModal] = useState<TaskModalState>(null);
  const [dragIds, setDragIds] = useState<ColumnIds | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const taskById = useMemo(() => {
    const m = new Map<string, Task>();
    if (tasks.data) for (const s of TASK_STATUSES) for (const t of tasks.data[s]) m.set(t.id, t);
    return m;
  }, [tasks.data]);

  const ids: ColumnIds | null = dragIds ?? (tasks.data ? toColumnIds(tasks.data) : null);

  const move = useMutation({
    mutationFn: (v: { taskId: string; status: TaskStatus; index: number; previous?: TaskColumns }) =>
      tasksApi.move(teamId, v.taskId, { status: v.status, index: v.index }),
    onError: (err, v) => {
      if (v.previous) qc.setQueryData(qk.tasks(teamId), v.previous);
      toast.error(`Couldn't move the task: ${errorMessage(err)}`);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.tasks(teamId) });
      void qc.invalidateQueries({ queryKey: qk.activity(teamId) });
      void qc.invalidateQueries({ queryKey: qk.summary(teamId) });
    },
  });

  /** Optimistically apply the move to the ['tasks', teamId] cache, then persist it. */
  const commitMove = (taskId: string, status: TaskStatus, index: number) => {
    // Stop in-flight refetches (e.g. from a live event) from overwriting the optimistic state.
    void qc.cancelQueries({ queryKey: qk.tasks(teamId) }, { revert: false });
    const previous = qc.getQueryData<TaskColumns>(qk.tasks(teamId));
    if (previous) qc.setQueryData<TaskColumns>(qk.tasks(teamId), moveTask(previous, taskId, status, index));
    move.mutate({ taskId, status, index, previous });
  };

  const findContainer = (cols: ColumnIds, id: string): TaskStatus | null => {
    if (isStatus(id)) return id;
    return findTaskPosition(cols, id)?.status ?? null;
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    if (!tasks.data) return;
    setActiveId(String(active.id));
    setDragIds(toColumnIds(tasks.data));
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragIds((cols) => {
      if (!cols) return cols;
      const activeKey = String(active.id);
      const overKey = String(over.id);
      const from = findContainer(cols, activeKey);
      const to = findContainer(cols, overKey);
      if (!from || !to || from === to) return cols;
      const fromItems = cols[from].filter((id) => id !== activeKey);
      const toItems = [...cols[to]];
      let newIndex: number;
      if (isStatus(overKey)) {
        newIndex = toItems.length;
      } else {
        const overIndex = toItems.indexOf(overKey);
        const translated = active.rect.current.translated;
        const isBelow = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        newIndex = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toItems.length;
      }
      toItems.splice(newIndex, 0, activeKey);
      return { ...cols, [from]: fromItems, [to]: toItems };
    });
  };

  const reset = () => {
    setActiveId(null);
    setDragIds(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const cols = dragIds;
    const original = tasks.data;
    const taskId = String(active.id);
    if (!cols || !original || !over) return reset();

    const status = findContainer(cols, taskId);
    const overStatus = findContainer(cols, String(over.id));
    if (!status || !overStatus) return reset();

    let finalList = cols[status];
    if (status === overStatus && !isStatus(over.id)) {
      const from = finalList.indexOf(taskId);
      const to = finalList.indexOf(String(over.id));
      if (from !== to && to >= 0) finalList = arrayMove(finalList, from, to);
    }
    const index = finalList.indexOf(taskId);
    const before = findTaskPosition(original, taskId);
    if (before && index >= 0 && (before.status !== status || before.index !== index)) {
      commitMove(taskId, status, index);
    }
    reset();
  };

  const activeTask = activeId ? taskById.get(activeId) : undefined;
  const total = tasks.data ? TASK_STATUSES.reduce((n, s) => n + tasks.data[s].length, 0) : 0;

  return (
    <>
      <PageHeader
        title="Board"
        description={
          tasks.data
            ? `${total} ${total === 1 ? 'task' : 'tasks'} · drag cards to update their status`
            : 'Plan and track the team’s work'
        }
        actions={
          <Button onClick={() => setModal({ mode: 'create', status: 'todo' })}>
            <IconPlus className="h-4 w-4" /> New task
          </Button>
        }
      />
      {tasks.isError && !tasks.data ? (
        <EmptyState
          title="Couldn't load the board"
          description={errorMessage(tasks.error)}
          action={
            <Button variant="secondary" onClick={() => void tasks.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !ids ? (
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((s) => (
            <div key={s} className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={reset}
        >
          <div className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {TASK_STATUSES.map((s) => (
              <Column
                key={s}
                status={s}
                taskIds={ids[s]}
                taskById={taskById}
                memberById={memberById}
                onOpen={(t) => setModal({ mode: 'edit', task: t })}
                onAdd={(status) => setModal({ mode: 'create', status })}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <TaskCardView
                task={activeTask}
                overlay
                assignee={activeTask.assigneeId ? memberById.get(activeTask.assigneeId) : undefined}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      <TaskModal state={modal} onClose={() => setModal(null)} teamId={teamId} members={members} />
    </>
  );
}
