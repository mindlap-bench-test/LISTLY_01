import { useState } from "react";

const PRIORITIES = ["low", "medium", "high"];

export default function TaskForm({ lists, initialValues, initialListId, submitLabel, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [dueDate, setDueDate] = useState(initialValues?.due_date ?? "");
  const [priority, setPriority] = useState(initialValues?.priority ?? "medium");
  const [listId, setListId] = useState(initialListId ?? "");
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (!listId) {
      setError("A list is required.");
      return;
    }
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() ? description.trim() : null,
        due_date: dueDate || null,
        priority,
        list_id: Number(listId),
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && <p className="task-form-error">{error}</p>}
      <input
        className="task-form-title"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="task-form-description"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="task-form-row">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={listId} onChange={(e) => setListId(e.target.value)}>
          <option value="" disabled>
            Select list
          </option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </div>
      <div className="task-form-actions">
        <button type="submit">{submitLabel}</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
