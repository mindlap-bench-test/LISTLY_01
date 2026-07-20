"""FastAPI app for Listly.

Full Lists and Tasks CRUD, plus Tag CRUD and task/tag attachment, per PRD
section 6. Search/filter/sort are out of scope for this story.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database import get_connection, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Listly API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ListCreate(BaseModel):
    name: str = Field(..., min_length=1)


class ListUpdate(BaseModel):
    name: str = Field(..., min_length=1)


class TaskCreate(BaseModel):
    list_id: int
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Literal["low", "medium", "high"] = "medium"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    done: Optional[bool] = None
    list_id: Optional[int] = None
    tags: Optional[List[int]] = None


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1)


# Fields on Task that are NOT NULL in the schema; explicitly clearing them
# to null is rejected rather than left to fail as a raw sqlite3 error.
_REQUIRED_TASK_FIELDS = {"title", "priority", "list_id"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_list_or_404(conn, list_id: int):
    row = conn.execute(
        "SELECT id, name, is_default FROM lists WHERE id = ?", (list_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="List not found")
    return row


def _list_with_count(conn, list_id: int):
    return conn.execute(
        """
        SELECT l.id, l.name, l.is_default,
               COUNT(t.id) FILTER (WHERE t.done = 0) AS open_task_count
        FROM lists l
        LEFT JOIN tasks t ON t.list_id = l.id
        WHERE l.id = ?
        GROUP BY l.id
        """,
        (list_id,),
    ).fetchone()


def _get_task_or_404(conn, task_id: int):
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return row


def _get_tag_or_404(conn, tag_id: int):
    row = conn.execute("SELECT id, name FROM tags WHERE id = ?", (tag_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return row


def _tags_for_task(conn, task_id: int):
    rows = conn.execute(
        """
        SELECT t.id, t.name
        FROM tags t
        JOIN task_tags tt ON tt.tag_id = t.id
        WHERE tt.task_id = ?
        ORDER BY t.name ASC
        """,
        (task_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def _serialize_task(conn, row) -> dict:
    task = dict(row)
    task["tags"] = _tags_for_task(conn, task["id"])
    return task


@app.get("/lists")
def get_lists():
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT l.id, l.name, l.is_default,
                   COUNT(t.id) FILTER (WHERE t.done = 0) AS open_task_count
            FROM lists l
            LEFT JOIN tasks t ON t.list_id = l.id
            GROUP BY l.id
            ORDER BY l.is_default DESC, l.id ASC
            """
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


@app.post("/lists", status_code=201)
def create_list(payload: ListCreate):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO lists (name, is_default, created_at) VALUES (?, 0, ?)",
            (payload.name, _now()),
        )
        conn.commit()
        return dict(_list_with_count(conn, cursor.lastrowid))
    finally:
        conn.close()


@app.patch("/lists/{list_id}")
def update_list(list_id: int, payload: ListUpdate):
    conn = get_connection()
    try:
        row = _get_list_or_404(conn, list_id)
        if row["is_default"]:
            raise HTTPException(
                status_code=400, detail="The default Inbox list cannot be renamed"
            )
        conn.execute("UPDATE lists SET name = ? WHERE id = ?", (payload.name, list_id))
        conn.commit()
        return dict(_list_with_count(conn, list_id))
    finally:
        conn.close()


@app.delete("/lists/{list_id}", status_code=204)
def delete_list(list_id: int):
    conn = get_connection()
    try:
        row = _get_list_or_404(conn, list_id)
        if row["is_default"]:
            raise HTTPException(
                status_code=400, detail="The default Inbox list cannot be deleted"
            )
        conn.execute(
            "DELETE FROM task_tags WHERE task_id IN (SELECT id FROM tasks WHERE list_id = ?)",
            (list_id,),
        )
        conn.execute("DELETE FROM tasks WHERE list_id = ?", (list_id,))
        conn.execute("DELETE FROM lists WHERE id = ?", (list_id,))
        conn.commit()
    finally:
        conn.close()
    return None


@app.get("/tasks")
def get_tasks(list_id: Optional[int] = None):
    conn = get_connection()
    try:
        if list_id is not None:
            rows = conn.execute(
                "SELECT * FROM tasks WHERE list_id = ? "
                "ORDER BY done ASC, created_at ASC, id ASC",
                (list_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM tasks ORDER BY done ASC, created_at ASC, id ASC"
            ).fetchall()
        return [_serialize_task(conn, row) for row in rows]
    finally:
        conn.close()


@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    conn = get_connection()
    try:
        return _serialize_task(conn, _get_task_or_404(conn, task_id))
    finally:
        conn.close()


@app.post("/tasks", status_code=201)
def create_task(payload: TaskCreate):
    conn = get_connection()
    try:
        _get_list_or_404(conn, payload.list_id)
        now = _now()
        cursor = conn.execute(
            """
            INSERT INTO tasks
                (list_id, title, description, due_date, priority, done, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (
                payload.list_id,
                payload.title,
                payload.description,
                payload.due_date,
                payload.priority,
                now,
                now,
            ),
        )
        conn.commit()
        return _serialize_task(conn, _get_task_or_404(conn, cursor.lastrowid))
    finally:
        conn.close()


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate):
    conn = get_connection()
    try:
        _get_task_or_404(conn, task_id)
        updates = payload.model_dump(exclude_unset=True)

        tags_provided = "tags" in updates
        tag_ids = updates.pop("tags", None) or [] if tags_provided else None

        for field in _REQUIRED_TASK_FIELDS:
            if field in updates and updates[field] is None:
                raise HTTPException(status_code=400, detail=f"{field} cannot be null")

        if not updates and not tags_provided:
            return _serialize_task(conn, _get_task_or_404(conn, task_id))

        if updates:
            if "list_id" in updates:
                _get_list_or_404(conn, updates["list_id"])

            if "done" in updates:
                updates["done"] = int(updates["done"])

            set_clause = ", ".join(f"{field} = ?" for field in updates)
            params = [*updates.values(), _now(), task_id]
            conn.execute(
                f"UPDATE tasks SET {set_clause}, updated_at = ? WHERE id = ?", params
            )

        if tags_provided:
            for tag_id in tag_ids:
                _get_tag_or_404(conn, tag_id)
            conn.execute("DELETE FROM task_tags WHERE task_id = ?", (task_id,))
            conn.executemany(
                "INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)",
                [(task_id, tag_id) for tag_id in set(tag_ids)],
            )

        conn.commit()
        return _serialize_task(conn, _get_task_or_404(conn, task_id))
    finally:
        conn.close()


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    conn = get_connection()
    try:
        _get_task_or_404(conn, task_id)
        conn.execute("DELETE FROM task_tags WHERE task_id = ?", (task_id,))
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
    finally:
        conn.close()
    return None


@app.get("/tags")
def get_tags():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT id, name FROM tags ORDER BY name ASC").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


@app.post("/tags", status_code=201)
def create_tag(payload: TagCreate):
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM tags WHERE name = ?", (payload.name,)
        ).fetchone()
        if existing is not None:
            raise HTTPException(
                status_code=409, detail="A tag with this name already exists"
            )
        cursor = conn.execute("INSERT INTO tags (name) VALUES (?)", (payload.name,))
        conn.commit()
        return dict(_get_tag_or_404(conn, cursor.lastrowid))
    finally:
        conn.close()


@app.delete("/tags/{tag_id}", status_code=204)
def delete_tag(tag_id: int):
    conn = get_connection()
    try:
        _get_tag_or_404(conn, tag_id)
        conn.execute("DELETE FROM task_tags WHERE tag_id = ?", (tag_id,))
        conn.execute("DELETE FROM tags WHERE id = ?", (tag_id,))
        conn.commit()
    finally:
        conn.close()
    return None
