# LISTLY_01

Todo list app: FastAPI + SQLite backend, React frontend.

## Backend

```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Creates/opens `backend/listly.db` on startup and seeds the default Inbox list.

## Frontend

```
cd frontend
npm install
npm run dev
```
