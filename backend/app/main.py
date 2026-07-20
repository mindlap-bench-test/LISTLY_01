"""FastAPI app shell for Listly.

Only the read endpoint the app-shell sidebar needs (GET /lists) exists here.
Full Lists/Tasks/Tags CRUD is out of scope for this story.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
