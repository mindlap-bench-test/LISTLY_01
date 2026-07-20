const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchLists() {
  const response = await fetch(`${API_BASE_URL}/lists`);
  if (!response.ok) {
    throw new Error(`Failed to fetch lists: ${response.status}`);
  }
  return response.json();
}
