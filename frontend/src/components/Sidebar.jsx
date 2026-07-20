import { useState } from "react";
import { createList, deleteList, renameList } from "../api.js";

export default function Sidebar({ lists, error, selectedListId, onSelectList, onListsChanged }) {
  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [actionError, setActionError] = useState(null);

  async function handleCreateList(event) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    try {
      const created = await createList(name);
      setNewListName("");
      setActionError(null);
      onListsChanged();
      onSelectList(created.id);
    } catch (err) {
      setActionError(err.message);
    }
  }

  function startRename(list) {
    setEditingListId(list.id);
    setEditingName(list.name);
  }

  async function handleRenameSubmit(event, listId) {
    event.preventDefault();
    const name = editingName.trim();
    if (!name) return;
    try {
      await renameList(listId, name);
      setEditingListId(null);
      setActionError(null);
      onListsChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(list) {
    if (!window.confirm(`Delete "${list.name}" and all of its tasks? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteList(list.id);
      setActionError(null);
      if (selectedListId === list.id) {
        onSelectList("all");
      }
      onListsChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Lists</h2>
      {error && <p className="sidebar-error">{error}</p>}
      {actionError && <p className="sidebar-error">{actionError}</p>}
      <ul className="sidebar-list">
        <li
          className={`sidebar-item${selectedListId === "all" ? " selected" : ""}`}
          onClick={() => onSelectList("all")}
        >
          <span className="sidebar-item-name">All Tasks</span>
        </li>
        {lists.map((list) => (
          <li
            key={list.id}
            className={`sidebar-item${list.id === selectedListId ? " selected" : ""}`}
            onClick={() => {
              if (editingListId !== list.id) onSelectList(list.id);
            }}
          >
            {editingListId === list.id ? (
              <form
                className="sidebar-rename-form"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => handleRenameSubmit(e, list.id)}
              >
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingListId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="sidebar-item-name">{list.name}</span>
                <span className="sidebar-item-count">{list.open_task_count}</span>
                {!list.is_default && (
                  <span className="sidebar-item-actions">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(list);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(list);
                      }}
                    >
                      Delete
                    </button>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <form className="sidebar-create-form" onSubmit={handleCreateList}>
        <input
          placeholder="New list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <button type="submit">Add list</button>
      </form>
    </aside>
  );
}
