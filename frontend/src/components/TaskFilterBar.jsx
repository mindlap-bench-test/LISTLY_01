const STATUSES = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const PRIORITIES = [
  { value: "", label: "Any priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const SORTS = [
  { value: "", label: "Default order" },
  { value: "due_date", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "created_date", label: "Created date" },
];

export default function TaskFilterBar({ filters, onFiltersChange, tags }) {
  function update(patch) {
    onFiltersChange({ ...filters, ...patch });
  }

  return (
    <div className="task-filter-bar">
      <input
        className="task-filter-search"
        type="search"
        placeholder="Search tasks"
        value={filters.q}
        onChange={(e) => update({ q: e.target.value })}
      />
      <select value={filters.status} onChange={(e) => update({ status: e.target.value })}>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select value={filters.priority} onChange={(e) => update({ priority: e.target.value })}>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        value={filters.tag ?? ""}
        onChange={(e) => update({ tag: e.target.value ? Number(e.target.value) : null })}
      >
        <option value="">Any tag</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
      <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
