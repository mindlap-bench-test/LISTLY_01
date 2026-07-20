import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import database  # noqa: E402


@pytest.fixture
def db_path(tmp_path, monkeypatch):
    path = tmp_path / "listly_test.db"
    monkeypatch.setattr(database, "DB_PATH", path)
    return path


def test_init_db_creates_all_four_tables(db_path):
    database.init_db()
    conn = sqlite3.connect(db_path)
    tables = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table'"
        ).fetchall()
    }
    conn.close()
    assert {"lists", "tasks", "tags", "task_tags"} <= tables


def test_inbox_seeded_on_init(db_path):
    database.init_db()
    conn = sqlite3.connect(db_path)
    row = conn.execute(
        "SELECT name, is_default FROM lists WHERE is_default = 1"
    ).fetchone()
    conn.close()
    assert row == ("Inbox", 1)


def test_init_db_does_not_duplicate_inbox_on_repeat_calls(db_path):
    database.init_db()
    database.init_db()
    conn = sqlite3.connect(db_path)
    count = conn.execute(
        "SELECT COUNT(*) FROM lists WHERE is_default = 1"
    ).fetchone()[0]
    conn.close()
    assert count == 1


def test_inbox_cannot_be_deleted(db_path):
    database.init_db()
    conn = sqlite3.connect(db_path)
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("DELETE FROM lists WHERE is_default = 1")
    conn.close()


def test_inbox_cannot_be_renamed(db_path):
    database.init_db()
    conn = sqlite3.connect(db_path)
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("UPDATE lists SET name = 'Renamed' WHERE is_default = 1")
    conn.close()


def test_non_default_list_can_be_renamed_and_deleted(db_path):
    database.init_db()
    conn = sqlite3.connect(db_path)
    conn.execute(
        "INSERT INTO lists (name, is_default, created_at) VALUES "
        "('Work', 0, '2026-01-01T00:00:00+00:00')"
    )
    conn.commit()
    conn.execute("UPDATE lists SET name = 'Work Renamed' WHERE name = 'Work'")
    conn.execute("DELETE FROM lists WHERE name = 'Work Renamed'")
    conn.close()
