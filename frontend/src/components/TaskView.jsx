import { useCallback, useEffect, useState } from "react";
import { createTask, deleteTask, fetchTasks, updateTask } from "../api.js";
import TaskForm from "./TaskForm.jsx";
import TaskItem from "./TaskItem.jsx";

export default function TaskView({ selectedListId, lists, onTasksChanged }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadTasks = useCallback(() => {
    const listId = selectedListId === "all" ? null : selectedListId;
    fetchTasks(listId)
      .then((data) => {
        setTasks(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [selectedListId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function notifyChanged() {
    loadTasks();
    onTasksChanged();
  }

  async function handleCreate(values) {
    await createTask(values);
    setShowCreateForm(false);
    notifyChanged();
  }

  async function handleUpdate(taskId, values) {
    await updateTask(taskId, values);
    notifyChanged();
  }

  async function handleDelete(taskId) {
    await deleteTask(taskId);
    notifyChanged();
  }

  async function handleToggleDone(task) {
    await updateTask(task.id, { done: !task.done });
    notifyChanged();
  }

  const currentList = selectedListId === "all" ? null : lists.find((l) => l.id === selectedListId);
  const defaultListId = selectedListId === "all" ? lists[0]?.id : selectedListId;

  return (
    <main className="task-view">
      <div className="task-view-header">
        <h2>{selectedListId === "all" ? "All Tasks" : currentList?.name ?? "Tasks"}</h2>
        {lists.length > 0 && (
          <button type="button" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? "Cancel" : "New task"}
          </button>
        )}
      </div>
      {error && <p className="task-view-error">{error}</p>}
      {showCreateForm && (
        <TaskForm
          lists={lists}
          initialListId={defaultListId}
          submitLabel="Create task"
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
      {tasks.length === 0 ? (
        <p className="task-view-placeholder">No tasks yet.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              lists={lists}
              onToggleDone={() => handleToggleDone(task)}
              onUpdate={(values) => handleUpdate(task.id, values)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
