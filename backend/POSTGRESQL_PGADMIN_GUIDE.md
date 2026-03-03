# PostgreSQL + pgAdmin Setup Guide

## 1) Install required Python dependencies

From `backend/`:

```bash
pip install -r requirements.txt
```

This project uses:

- `SQLAlchemy` (ORM)
- `psycopg2-binary` (PostgreSQL driver)

## 2) Configure backend environment

Create/update `backend/.env`:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=petcare_db
```

## 3) Create PostgreSQL database

Option A (psql):

```sql
CREATE DATABASE petcare_db;
```

Option B (pgAdmin):

1. Open pgAdmin.
2. Right-click **Databases** > **Create** > **Database...**
3. Name: `petcare_db`
4. Save.

## 4) Start backend and auto-create tables

From `backend/`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

At startup, SQLAlchemy runs `Base.metadata.create_all(...)`, which creates all tables if they do not already exist.

## 5) Visualize tables/data in pgAdmin

1. Connect/Register server in pgAdmin:
   - Host: `localhost`
   - Port: `5432`
   - Username: from `.env` (`DB_USER`)
   - Password: from `.env` (`DB_PASSWORD`)
2. Expand:
   - `Servers`
   - your server
   - `Databases`
   - `petcare_db`
   - `Schemas`
   - `public`
   - `Tables`
3. Open data:
   - Right-click table (e.g., `users`) > **View/Edit Data** > **All Rows**
4. Run SQL:
   - Right-click `petcare_db` > **Query Tool**
   - Example:

```sql
SELECT * FROM users;
SELECT * FROM reports;
SELECT * FROM community_posts;
```

Quick place to start in pgAdmin:

- `Servers > <your-server> > Databases > petcare_db > Schemas > public > Tables`
- Then right-click any table and use **View/Edit Data**.

## 6) Quick verification checklist

- Backend starts without DB connection errors
- Tables appear under `public > Tables`
- `users` table contains seeded admin record (`admin@petcarehub.local`)
- API docs open at `http://localhost:8000/docs`

## 7) Notes

- Keep `backend/.env.example` as your template for team onboarding.
- If credentials change, restart backend after updating `.env`.
