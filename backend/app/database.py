"""SQLite schema and connection helpers for Listly.

Schema matches PRD section 5 exactly (fields/types/FKs). The default Inbox
list's protection (cannot be renamed or deleted) is enforced with SQLite
triggers so that every current and future code path is bound by it, not
just the API layer.
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "listly.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (list_id) REFERENCES lists (id)
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS task_tags (
    task_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TRIGGER IF NOT EXISTS prevent_default_list_rename
BEFORE UPDATE OF name ON lists
WHEN OLD.is_default = 1 AND NEW.name != OLD.name
BEGIN
    SELECT RAISE(ABORT, 'The default Inbox list cannot be renamed');
END;

CREATE TRIGGER IF NOT EXISTS prevent_default_list_delete
BEFORE DELETE ON lists
WHEN OLD.is_default = 1
BEGIN
    SELECT RAISE(ABORT, 'The default Inbox list cannot be deleted');
END;
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create the schema if missing and seed the default Inbox list."""
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        _seed_inbox(conn)
        conn.commit()
    finally:
        conn.close()


def _seed_inbox(conn: sqlite3.Connection) -> None:
    existing = conn.execute("SELECT id FROM lists WHERE is_default = 1").fetchone()
    if existing is not None:
        return
    conn.execute(
        "INSERT INTO lists (name, is_default, created_at) VALUES (?, 1, ?)",
        ("Inbox", datetime.now(timezone.utc).isoformat()),
    )
