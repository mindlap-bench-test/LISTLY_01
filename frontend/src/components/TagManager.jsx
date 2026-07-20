import { useState } from "react";
import { createTag, deleteTag } from "../api.js";

export default function TagManager({ tags, error, onTagsChanged }) {
  const [newTagName, setNewTagName] = useState("");
  const [actionError, setActionError] = useState(null);

  async function handleCreateTag(event) {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name) return;
    try {
      await createTag(name);
      setNewTagName("");
      setActionError(null);
      onTagsChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(tag) {
    if (!window.confirm(`Delete tag "${tag.name}"? It will be removed from every task.`)) {
      return;
    }
    try {
      await deleteTag(tag.id);
      setActionError(null);
      onTagsChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="tag-manager">
      <h2 className="sidebar-title">Tags</h2>
      {error && <p className="sidebar-error">{error}</p>}
      {actionError && <p className="sidebar-error">{actionError}</p>}
      <ul className="tag-manager-list">
        {tags.map((tag) => (
          <li key={tag.id} className="tag-manager-item">
            <span className="tag-chip">{tag.name}</span>
            <button type="button" onClick={() => handleDelete(tag)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form className="sidebar-create-form" onSubmit={handleCreateTag}>
        <input
          placeholder="New tag name"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
        />
        <button type="submit">Add tag</button>
      </form>
    </div>
  );
}
