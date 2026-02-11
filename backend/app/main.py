from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.auth import router as auth_router
from app.api.v1.care_team import router as care_team_router
from app.api.v1.community_posts import router as community_posts_router
from app.api.v1.feed import router as feed_router
from app.api.v1.reports import router as reports_router
from app.api.v1.sicknesses import router as sicknesses_router
from app.core.config import UPLOAD_DIR
from app.db.seed import seed_data
from app.db.session import Base, engine, ensure_sqlite_reports_schema, ensure_sqlite_community_posts_schema, ensure_sqlite_sicknesses_schema

Base.metadata.create_all(bind=engine)
ensure_sqlite_reports_schema()
ensure_sqlite_community_posts_schema()
ensure_sqlite_sicknesses_schema()

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PetCare Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(community_posts_router, prefix="/api/v1")
app.include_router(care_team_router, prefix="/api/v1")
app.include_router(sicknesses_router, prefix="/api/v1")
app.include_router(feed_router, prefix="/api/v1")


@app.on_event("startup")
def load_seed_data() -> None:
    seed_data()


@app.get("/")
def root():
    return {"status": "Backend running successfully!"}
