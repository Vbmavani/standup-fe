import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Member, Task } from '../../api/types';
import { formatDateShort, isOverdue, localToday } from '../../lib/dates';
import { Avatar } from '../ui';
import { IconCalendar } from '../ui/icons';

export function TaskCardView({
  task,
  assignee,
  dragging = false,
  overlay = false,
  onClick,
}: {
  task: Task;
  assignee?: Member;
  dragging?: boolean;
  overlay?: boolean;
  onClick?: () => void;
}) {
  const today = localToday();
  const overdue = task.status !== 'done' && isOverdue(task.dueDate, today);
  const dueToday = task.status !== 'done' && task.dueDate === today;
  const done = task.status === 'done';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group rounded-lg border bg-white p-3 text-left shadow-sm transition-[box-shadow,border-color,opacity] dark:bg-zinc-900',
        'border-zinc-200 hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:hover:border-zinc-700',
        dragging && 'opacity-40',
        overlay && 'cursor-grabbing border-indigo-300 shadow-xl ring-2 ring-indigo-500/20 dark:border-indigo-500/50',
        !overlay && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <p
        className={clsx(
          'break-words text-sm font-medium leading-snug',
          done ? 'text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600' : 'text-zinc-900 dark:text-zinc-100',
        )}
      >
        {task.title}
      </p>
      {task.description.trim() && (
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{task.description}</p>
      )}
      {(task.dueDate || assignee) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {task.dueDate ? (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
                overdue
                  ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                  : dueToday
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
              )}
              title={overdue ? 'Overdue' : 'Due date'}
            >
              <IconCalendar className="h-3 w-3" />
              {dueToday ? 'Today' : formatDateShort(task.dueDate, task.dueDate.slice(0, 4) !== today.slice(0, 4))}
            </span>
          ) : (
            <span />
          )}
          {assignee && <Avatar name={assignee.name} id={assignee.id} size="sm" />}
        </div>
      )}
    </div>
  );
}

export function SortableTaskCard({
  task,
  assignee,
  onOpen,
}: {
  task: Task;
  assignee?: Member;
  onOpen: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      {...attributes}
      {...listeners}
      aria-label={`${task.title}. Press space to pick up, Enter to open.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOpen(task);
          return;
        }
        listeners?.onKeyDown?.(e);
      }}
    >
      <TaskCardView task={task} assignee={assignee} dragging={isDragging} onClick={() => onOpen(task)} />
    </li>
  );
}
