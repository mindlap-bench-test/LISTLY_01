import { useState } from "react";
import TaskForm from "./TaskForm.jsx";
import { isOverdue } from "../utils.js";

export default function TaskItem({
  task,
  lists,
  tags,
  onToggleDone,
  onUpdate,
  onDelete,
  onTagClick,
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="task-item task-item-editing">
        <TaskForm
          lists={lists}
          tags={tags}
          initialValues={task}
          initialListId={task.list_id}
          submitLabel="Save"
          onSubmit={async (values) => {
            await onUpdate(values);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  const overdue = isOverdue(task);

  return (
    <li className={`task-item${task.done ? " task-item-done" : ""}${overdue ? " task-item-overdue" : ""}`}>
      <input type="checkbox" checked={!!task.done} onChange={onToggleDone} />
      <div className="task-item-body">
        <span className="task-item-title">{task.title}</span>
        {task.due_date && (
          <span className="task-item-due">
            {task.due_date}
            {overdue && <span className="task-item-overdue-badge">Overdue</span>}
          </span>
        )}
        <span className={`task-item-priority task-item-priority-${task.priority}`}>
          {task.priority}
        </span>
        {task.tags?.length > 0 && (
          <span className="task-item-tags">
            {task.tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="tag-chip tag-chip-clickable"
                onClick={() => onTagClick?.(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </span>
        )}
      </div>
      <div className="task-item-actions">
        <button type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}
