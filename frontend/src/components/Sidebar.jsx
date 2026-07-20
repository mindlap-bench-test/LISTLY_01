import { useEffect, useState } from "react";
import { fetchLists } from "../api.js";

export default function Sidebar({ selectedListId, onSelectList }) {
  const [lists, setLists] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLists()
      .then(setLists)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Lists</h2>
      {error && <p className="sidebar-error">{error}</p>}
      <ul className="sidebar-list">
        {lists.map((list) => (
          <li
            key={list.id}
            className={`sidebar-item${list.id === selectedListId ? " selected" : ""}`}
            onClick={() => onSelectList(list.id)}
          >
            <span className="sidebar-item-name">{list.name}</span>
            <span className="sidebar-item-count">{list.open_task_count}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
