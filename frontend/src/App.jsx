import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TaskView from "./components/TaskView.jsx";

export default function App() {
  const [selectedListId, setSelectedListId] = useState(null);

  return (
    <div className="app-shell">
      <Sidebar selectedListId={selectedListId} onSelectList={setSelectedListId} />
      <TaskView selectedListId={selectedListId} />
    </div>
  );
}
