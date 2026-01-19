import type { CommitmentTask } from '../../models/types';

interface TaskListProps {
  tasks: CommitmentTask[];
  onToggle: (taskId: string) => void;
  disabled?: boolean;
}

export function TaskList({ tasks, onToggle, disabled = false }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-[var(--color-pixel-text-dim)] text-[10px] text-center py-4">
        No tasks defined
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`
            flex items-start gap-3 p-2
            bg-[var(--color-pixel-bg)] border border-[#444]
            ${disabled ? 'opacity-60' : ''}
          `}
        >
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => !disabled && onToggle(task.id)}
            disabled={disabled}
            className={`
              w-5 h-5 flex-shrink-0 border-2
              ${task.isCompleted
                ? 'bg-[var(--color-pixel-success)] border-[var(--color-pixel-success)]'
                : 'bg-transparent border-[#888] hover:border-[var(--color-pixel-accent)]'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              flex items-center justify-center text-[10px] text-white
            `}
            aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.isCompleted && 'X'}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <p
              className={`
                text-[11px]
                ${task.isCompleted
                  ? 'line-through text-[var(--color-pixel-text-dim)]'
                  : 'text-[var(--color-pixel-text)]'
                }
              `}
            >
              {task.description}
            </p>
            <p className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1">
              Reward: ${task.reward.toLocaleString()}
            </p>
          </div>

          {/* Completed timestamp */}
          {task.isCompleted && task.completedAt && (
            <span className="text-[8px] text-[var(--color-pixel-success)] flex-shrink-0">
              Done
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default TaskList;
