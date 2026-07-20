import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TaskView from "./components/TaskView.jsx";
import { fetchLists } from "./api.js";

export default function App() {
  const [selectedListId, setSelectedListId] = useState("all");
  const [lists, setLists] = useState([]);
  const [listsError, setListsError] = useState(null);

  const refreshLists = useCallback(() => {
    fetchLists()
      .then((data) => {
        setLists(data);
        setListsError(null);
      })
      .catch((err) => setListsError(err.message));
  }, []);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  return (
    <div className="app-shell">
      <Sidebar
        lists={lists}
        error={listsError}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        onListsChanged={refreshLists}
      />
      <TaskView
        selectedListId={selectedListId}
        lists={lists}
        onTasksChanged={refreshLists}
      />
    </div>
  );
}
