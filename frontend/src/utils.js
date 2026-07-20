export function isOverdue(task) {
  if (task.done || !task.due_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.due_date < today;
}
