import { useCallback, useEffect, useState } from "react";
import { createTask, deleteTask, fetchTasks, updateTask } from "../api.js";
import TaskFilterBar from "./TaskFilterBar.jsx";
import TaskForm from "./TaskForm.jsx";
import TaskItem from "./TaskItem.jsx";

const DEFAULT_FILTERS = { status: "all", priority: "", tag: null, q: "", sort: "" };

export default function TaskView({ selectedListId, lists, tags, onTasksChanged }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const loadTasks = useCallback(() => {
    const listId = selectedListId === "all" ? null : selectedListId;
    fetchTasks(listId, filters)
      .then((data) => {
        setTasks(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [selectedListId, filters]);

  useEffect(() => {
    loadTasks();
    // Re-fetch when the tag set changes so chips reflect a tag deletion
    // that happened elsewhere in the app.
  }, [loadTasks, tags]);

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

  function handleTagClick(tagId) {
    setFilters((prev) => ({ ...prev, tag: prev.tag === tagId ? null : tagId }));
  }

  const currentList = selectedListId === "all" ? null : lists.find((l) => l.id === selectedListId);
  const defaultListId = selectedListId === "all" ? lists[0]?.id : selectedListId;
  const filtersActive =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.tag !== DEFAULT_FILTERS.tag ||
    filters.q !== DEFAULT_FILTERS.q ||
    filters.sort !== DEFAULT_FILTERS.sort;

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
      <TaskFilterBar filters={filters} onFiltersChange={setFilters} tags={tags} />
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
        <p className="task-view-placeholder">
          {filtersActive ? "No tasks match your search and filters." : "No tasks yet."}
        </p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              lists={lists}
              tags={tags}
              onToggleDone={() => handleToggleDone(task)}
              onUpdate={(values) => handleUpdate(task.id, values)}
              onDelete={() => handleDelete(task.id)}
              onTagClick={handleTagClick}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
