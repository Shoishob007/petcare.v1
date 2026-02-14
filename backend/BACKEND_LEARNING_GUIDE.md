# PetCare Hub Backend — Learning Guide (PDF-ready)

## Who this is for

This document explains your backend as a **learning system**: how requests flow, why design choices were made, what tradeoffs exist, and what to learn next (in priority order).

---

## 1) Backend at a glance

### Tech stack in this project

- **Framework:** FastAPI
- **Server:** Uvicorn
- **ORM:** SQLAlchemy 2.x (classic declarative style)
- **Validation/serialization:** Pydantic v2
- **DB engine options:** SQLite (default) and PostgreSQL (configurable)
- **Uploads:** Local filesystem (`backend/uploads`) served as static files

### Main architecture style

Layered monolith:

1. **API layer** (`app/api/v1`) handles HTTP and request validation
2. **Schema layer** (`app/schemas`) defines request/response contracts
3. **Domain/data layer** (`app/models`) defines SQL tables + relationships
4. **Infrastructure layer** (`app/db`, `app/core`) handles DB engine/session, config, uploads, seeding

This is a strong beginner-friendly architecture because the responsibilities are separated clearly.

---

## 2) Request lifecycle (end-to-end flow)

A typical request path in your backend:

1. Client calls endpoint, e.g. `POST /api/v1/reports`
2. FastAPI router matches function in `api/v1/reports.py`
3. FastAPI parses JSON into Pydantic schema (`ReportCreate`)
4. `db: Session = Depends(get_db)` provides SQLAlchemy session
5. Route creates/queries SQLAlchemy models and commits transaction
6. Response model (`ReportResponse`) serializes ORM object back to JSON
7. Session closes automatically in `get_db()` `finally`

### Application startup flow

On startup in `app/main.py`:

1. Import all models
2. `Base.metadata.create_all(bind=engine)` creates missing tables
3. SQLite schema patch helpers run (`ensure_sqlite_*_schema`) to add new columns if needed
4. Upload directory is created
5. Routers are mounted
6. Seed runs once (`seed_data`) if no users exist

This gives very fast local setup for learning and demos.

---

## 3) Core configuration and environment design

### Settings (`app/core/config.py`)

`Settings` (Pydantic Settings) loads environment values from `.env` with defaults.

Important fields:

- `DB_ENGINE` supports `sqlite` (default), `postgresql`, and `mysql` URL generation
- SQLite path default: `petcare.db`
- Security placeholders exist (`SECRET_KEY`, JWT settings), but auth is not fully implemented yet
- Upload constraints exist in config, but route-level upload checks currently rely on `core/uploads.py`

### Database URL generation

`get_database_url()` picks connection string by engine type:

- SQLite: `sqlite:///.../petcare.db`
- PostgreSQL / MySQL: URL from env credentials

### DB session (`app/db/session.py`)

- SQLite engine uses `check_same_thread=False` and `StaticPool`
- `SessionLocal` is injected per request
- `get_db()` yields and closes session safely

---

## 4) Data model design (SQLAlchemy)

## Core entities

### User domain (`models/user.py`)

- `User` with profile, role flags (veterinarian/caregiver), social counters
- `Pet` (one user → many pets)
- `MedicalRecord` (one pet → many medical records)
- `Appointment` (one pet → many appointments)

### Report domain (`models/reports.py`)

- `Report` has content, location fields, classification, engagement counters
- `ReportImage` (one report → many images)
- `ReportComment` (one report → many comments)
- `user_reports` many-to-many association between users and reports

### Community domain (`models/community_posts.py`)

- `CommunityPost` with content + metadata + engagement
- `CommunityPostImage` (one post → many images)
- `CommunityPostComment` (one post → many comments)

### Sickness knowledge domain (`models/sicknesses.py`)

- `Sickness` contains disease/condition details (symptoms, remedies, prevention, medical metadata)
- `SicknessImage` (one sickness → many images)

### Care team domain (`models/care_team.py`)

- `CareTeamMember` for provider-like profile records

---

## 5) API surface and behavior

All APIs are mounted under `/api/v1` (except auth router has `/api/v1/auth`).

## Auth

- `POST /api/v1/auth/login`
- Currently stub only (`{"message": "login works"}`), not real JWT auth

## Reports (`api/v1/reports.py`)

- CRUD:
  - `POST /reports`
  - `GET /reports`
  - `PATCH /reports/{report_id}`
  - `DELETE /reports/{report_id}`
- Media:
  - `POST /reports/{report_id}/images` (multi-upload)
- Engagement:
  - `POST /reports/{report_id}/reactions` (increment counter)
- Comments:
  - `GET /reports/{report_id}/comments`
  - `POST /reports/{report_id}/comments`

## Community posts (`api/v1/community_posts.py`)

- CRUD:
  - `POST /community-posts`
  - `GET /community-posts`
  - `PATCH /community-posts/{post_id}`
  - `DELETE /community-posts/{post_id}`
- Media:
  - `POST /community-posts/{post_id}/image` (single featured image)
  - `POST /community-posts/{post_id}/images` (gallery)
- Engagement/comments similar to reports

## Sicknesses (`api/v1/sicknesses.py`)

- CRUD-style endpoints + image upload
- Content behaves like a knowledge base + user-submitted entries

## Care team (`api/v1/care_team.py`)

- Simple CRUD for `CareTeamMember`

## Feed (`api/v1/feed.py`)

- `GET /feed?limit=&offset=`
- Combines recent reports + community posts, normalizes them into a common response schema, sorts by `created_at`

## Updates (`api/v1/updates.py`)

- Unified abstraction over reports + community posts
- `item_type` can be `report` or `community`
- Includes unified endpoints for list/create/update/delete/reactions/comments/images
- Useful when front-end wants one API model for multiple entity types

---

## 6) Schemas and serialization strategy (Pydantic)

Patterns used:

- `Create` schemas for input
- `Update` schemas with optional fields (`exclude_unset=True` patch pattern)
- `Response` schemas with `model_config = {"from_attributes": True}` for ORM serialization

Why this is good for learning:

- Clear separation between DB models and API contract
- Better control over what client can send/receive
- Easy to evolve API without tightly coupling to table columns

---

## 7) File uploads and static serving

### Upload flow

- Endpoints accept `UploadFile`
- `save_upload()` validates MIME type, generates UUID filename, writes to disk
- Stored under `backend/uploads`
- Database stores filenames in image tables

### Static files

- `app.mount("/uploads", StaticFiles(...))`
- Images become accessible as `/uploads/<filename>`

Tradeoff:

- Great for local/dev simplicity
- Not ideal for production scaling (prefer S3/Blob + CDN later)

---

## 8) Middleware and dependencies

### Middleware

Current middleware in `main.py`:

- **CORS middleware** configured for localhost origins and regex localhost ports

### Dependency injection

FastAPI DI is used consistently for DB session:

- `db: Session = Depends(get_db)`

What is _not_ present yet (important for learning roadmap):

- Auth dependency (`get_current_user`)
- RBAC/permission middleware
- Request logging middleware
- Global exception middleware/handlers
- Rate limiting middleware

---

## 9) SQLite design and migration strategy in this project

### Current strategy

You use two mechanisms:

1. `Base.metadata.create_all()` for missing table creation
2. Manual `ensure_sqlite_*_schema()` functions that `ALTER TABLE` to add missing columns

This is pragmatic for fast iteration, especially for learning.

### Tradeoffs

Pros:

- Very fast to evolve in local development
- Avoids migration setup complexity early

Cons:

- Schema drift risk over time
- Harder to reason about exact DB state across environments
- Not ideal for team collaboration and production releases

### Recommended next step

Move to **Alembic migrations** as your first serious backend upgrade.

---

## 10) Design strengths vs current gaps

## Strengths

- Clean separation of models/schemas/routes
- Good FastAPI dependency usage
- Strong domain coverage (reports, community, sickness, care-team)
- Unified APIs (`updates`, `feed`) show thoughtful API design
- Seed data is rich and realistic for demos/learning

## Gaps (learning opportunities)

- Auth is placeholder only
- Password hashing/JWT deps exist but not wired fully
- No tests yet for API behavior
- No migration-first schema workflow
- Limited observability/logging
- Business logic is route-heavy (service layer not extracted)

---

## 11) Learning roadmap: sequence and priority

If your goal is to become strong in backend engineering, use this order:

## Phase 1 — Foundation (highest priority)

1. **HTTP + REST fundamentals** (status codes, idempotency, pagination)
2. **FastAPI basics** (routing, DI, validation)
3. **Pydantic v2 deeply** (field validation, model transformation)
4. **SQL + relational modeling** (keys, indexes, normalization)
5. **SQLAlchemy session/transactions** (unit of work behavior)

Why first: this builds permanent backend intuition independent of framework trends.

## Phase 2 — Production correctness

1. **Authentication**: JWT access/refresh tokens, password hashing with bcrypt
2. **Authorization**: user roles and ownership checks
3. **Migrations**: Alembic versioned schema changes
4. **Error handling**: standard error responses and exception mapping
5. **Testing**: pytest + FastAPI TestClient for route/service tests

Why second: this turns demo backend into reliable software.

## Phase 3 — Scalability and architecture

1. Introduce **service layer** (move business logic from routers)
2. Add **repository/query patterns** where complexity grows
3. Use **async tasks** for heavy operations (emails, image processing)
4. Externalize files to object storage
5. Add caching for expensive reads

## Phase 4 — Ops maturity

1. Structured logging and request tracing
2. CI checks (lint, tests, migration checks)
3. Deployment hardening (gunicorn workers, env management)
4. Monitoring and alerts

---

## 12) Practical tradeoffs: SQLite vs PostgreSQL for your learning path

### SQLite first (recommended now)

Use SQLite while learning API and modeling.

- - Simple, zero setup, fast iteration
- - Concurrency and advanced SQL features are limited

### PostgreSQL next (recommended after auth + tests)

Switch to Postgres once your API stabilizes.

- - Real production behavior, better constraints/indexing/performance tuning
- - More setup and migration discipline needed

### Suggested transition point

Move to Postgres when:

- You have Alembic migrations in place
- You’ve added integration tests
- You’re introducing auth and ownership logic

---

## 13) Suggested immediate backend upgrades for this repository

Priority order for your next commits:

1. Implement real auth (`/auth/login`, register, token creation/verification)
2. Add `get_current_user` dependency and protect mutating endpoints
3. Add Alembic baseline migration and remove ad-hoc schema patch helpers
4. Add test suite for reports/community/updates critical paths
5. Add consistent API error response schema
6. Introduce a thin service layer for reports and community modules

---

## 14) How to convert this to PDF

Option A (VS Code):

- Use a Markdown PDF extension and export this file directly.

Option B (Pandoc):

```bash
pandoc backend/BACKEND_LEARNING_GUIDE.md -o backend/BACKEND_LEARNING_GUIDE.pdf
```

---

## 15) FastAPI concepts covered in this codebase (for revision)

- App initialization and router inclusion
- Dependency injection with `Depends`
- Request body parsing via Pydantic models
- Response modeling with ORM serialization
- File uploads with `UploadFile`
- Serving static directories
- Startup events
- Middleware (CORS)
- Query params (`limit`, `offset`, filters)

Use this checklist to self-test your understanding while reading each module.

---

## 16) Final learning advice

Your backend is already a strong **learning sandbox**. The biggest growth now comes from:

- adding **auth + authorization**,
- adopting **migrations + tests**, and
- gradually refactoring route-heavy logic into **services**.

If you master those three upgrades in this project, you’ll move from “can build APIs” to “can engineer reliable backends.”
