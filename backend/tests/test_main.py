import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import database, main  # noqa: E402


@pytest.fixture
def db_path(tmp_path, monkeypatch):
    path = tmp_path / "listly_test.db"
    monkeypatch.setattr(database, "DB_PATH", path)
    database.init_db()
    return path


def _inbox_id():
    conn = database.get_connection()
    try:
        return conn.execute(
            "SELECT id FROM lists WHERE is_default = 1"
        ).fetchone()["id"]
    finally:
        conn.close()


def test_create_list_returns_zero_open_count(db_path):
    result = main.create_list(main.ListCreate(name="Work"))
    assert result["name"] == "Work"
    assert result["is_default"] == 0
    assert result["open_task_count"] == 0


def test_rename_list(db_path):
    created = main.create_list(main.ListCreate(name="Work"))
    updated = main.update_list(created["id"], main.ListUpdate(name="Work Renamed"))
    assert updated["name"] == "Work Renamed"


def test_rename_missing_list_raises_404(db_path):
    with pytest.raises(HTTPException) as exc_info:
        main.update_list(999, main.ListUpdate(name="Anything"))
    assert exc_info.value.status_code == 404


def test_rename_default_list_rejected(db_path):
    with pytest.raises(HTTPException) as exc_info:
        main.update_list(_inbox_id(), main.ListUpdate(name="Renamed"))
    assert exc_info.value.status_code == 400


def test_delete_default_list_rejected(db_path):
    with pytest.raises(HTTPException) as exc_info:
        main.delete_list(_inbox_id())
    assert exc_info.value.status_code == 400


def test_delete_list_cascades_tasks(db_path):
    created_list = main.create_list(main.ListCreate(name="Work"))
    task = main.create_task(
        main.TaskCreate(list_id=created_list["id"], title="Write report")
    )
    main.delete_list(created_list["id"])
    with pytest.raises(HTTPException) as exc_info:
        main.get_task(task["id"])
    assert exc_info.value.status_code == 404


def test_create_task_defaults(db_path):
    inbox_id = _inbox_id()
    task = main.create_task(main.TaskCreate(list_id=inbox_id, title="Buy milk"))
    assert task["priority"] == "medium"
    assert task["done"] == 0
    assert task["list_id"] == inbox_id


def test_create_task_missing_list_raises_404(db_path):
    with pytest.raises(HTTPException) as exc_info:
        main.create_task(main.TaskCreate(list_id=999, title="Buy milk"))
    assert exc_info.value.status_code == 404


def test_update_task_toggle_done(db_path):
    inbox_id = _inbox_id()
    task = main.create_task(main.TaskCreate(list_id=inbox_id, title="Buy milk"))
    updated = main.update_task(task["id"], main.TaskUpdate(done=True))
    assert updated["done"] == 1


def test_update_task_move_to_another_list(db_path):
    inbox_id = _inbox_id()
    other_list = main.create_list(main.ListCreate(name="Work"))
    task = main.create_task(main.TaskCreate(list_id=inbox_id, title="Buy milk"))
    updated = main.update_task(task["id"], main.TaskUpdate(list_id=other_list["id"]))
    assert updated["list_id"] == other_list["id"]


def test_update_task_move_to_missing_list_raises_404(db_path):
    inbox_id = _inbox_id()
    task = main.create_task(main.TaskCreate(list_id=inbox_id, title="Buy milk"))
    with pytest.raises(HTTPException) as exc_info:
        main.update_task(task["id"], main.TaskUpdate(list_id=999))
    assert exc_info.value.status_code == 404


def test_update_task_null_title_rejected(db_path):
    inbox_id = _inbox_id()
    task = main.create_task(main.TaskCreate(list_id=inbox_id, title="Buy milk"))
    with pytest.raises(HTTPException) as exc_info:
        main.update_task(task["id"], main.TaskUpdate(title=None))
    assert exc_info.value.status_code == 400


def test_update_missing_task_raises_404(db_path):
    with pytest.raises(HTTPException) as exc_info:
        main.update_task(999, main.TaskUpdate(done=True))
    assert exc_info.value.status_code == 404


def test_delete_task(db_path):
    inbox_id = _inbox_id()
    task = main.create_task(main.TaskCreate(list_id=inbox_id, title="Buy milk"))
    main.delete_task(task["id"])
    with pytest.raises(HTTPException) as exc_info:
        main.get_task(task["id"])
    assert exc_info.value.status_code == 404


def test_get_tasks_filtered_by_list_and_sorts_done_last(db_path):
    inbox_id = _inbox_id()
    other_list = main.create_list(main.ListCreate(name="Work"))
    t1 = main.create_task(main.TaskCreate(list_id=inbox_id, title="A"))
    t2 = main.create_task(main.TaskCreate(list_id=inbox_id, title="B"))
    main.create_task(main.TaskCreate(list_id=other_list["id"], title="C"))
    main.update_task(t1["id"], main.TaskUpdate(done=True))

    tasks = main.get_tasks(list_id=inbox_id)
    assert [t["id"] for t in tasks] == [t2["id"], t1["id"]]


def test_get_tasks_without_list_id_returns_all(db_path):
    inbox_id = _inbox_id()
    other_list = main.create_list(main.ListCreate(name="Work"))
    main.create_task(main.TaskCreate(list_id=inbox_id, title="A"))
    main.create_task(main.TaskCreate(list_id=other_list["id"], title="B"))

    tasks = main.get_tasks(list_id=None)
    assert len(tasks) == 2
