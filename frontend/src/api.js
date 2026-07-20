const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export function fetchLists() {
  return request("/lists");
}

export function createList(name) {
  return request("/lists", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });
}

export function renameList(listId, name) {
  return request(`/lists/${listId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });
}

export function deleteList(listId) {
  return request(`/lists/${listId}`, { method: "DELETE" });
}

export function fetchTasks(listId) {
  const query = listId != null ? `?list_id=${listId}` : "";
  return request(`/tasks${query}`);
}

export function createTask(values) {
  return request("/tasks", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(values),
  });
}

export function updateTask(taskId, values) {
  return request(`/tasks/${taskId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(values),
  });
}

export function deleteTask(taskId) {
  return request(`/tasks/${taskId}`, { method: "DELETE" });
}
