export default function TaskView({ selectedListId }) {
  return (
    <main className="task-view">
      {selectedListId ? (
        <p className="task-view-placeholder">Task list coming soon.</p>
      ) : (
        <p className="task-view-placeholder">Select a list to see its tasks.</p>
      )}
    </main>
  );
}
