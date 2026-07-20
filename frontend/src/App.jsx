import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TaskView from "./components/TaskView.jsx";
import { fetchLists, fetchTags } from "./api.js";

export default function App() {
  const [selectedListId, setSelectedListId] = useState("all");
  const [lists, setLists] = useState([]);
  const [listsError, setListsError] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagsError, setTagsError] = useState(null);

  const refreshLists = useCallback(() => {
    fetchLists()
      .then((data) => {
        setLists(data);
        setListsError(null);
      })
      .catch((err) => setListsError(err.message));
  }, []);

  const refreshTags = useCallback(() => {
    fetchTags()
      .then((data) => {
        setTags(data);
        setTagsError(null);
      })
      .catch((err) => setTagsError(err.message));
  }, []);

  useEffect(() => {
    refreshLists();
    refreshTags();
  }, [refreshLists, refreshTags]);

  return (
    <div className="app-shell">
      <Sidebar
        lists={lists}
        error={listsError}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        onListsChanged={refreshLists}
        tags={tags}
        tagsError={tagsError}
        onTagsChanged={refreshTags}
      />
      <TaskView
        selectedListId={selectedListId}
        lists={lists}
        tags={tags}
        onTasksChanged={refreshLists}
      />
    </div>
  );
}
