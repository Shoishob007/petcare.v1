from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.auth import router as auth_router
from app.api.v1.ai_pathway import router as ai_pathway_router
from app.api.v1.care_team import router as care_team_router
from app.api.v1.chat import router as chat_router
from app.api.v1.community_posts import router as community_posts_router
from app.api.v1.feed import router as feed_router
from app.api.v1.home_page_content import router as home_page_content_router
from app.api.v1.reports import router as reports_router
from app.api.v1.sicknesses import router as sicknesses_router
from app.api.v1.updates import router as updates_router
from app.core.config import UPLOAD_DIR
import app.models
from app.db.seed import seed_data
from app.db.session import (
    Base,
    engine,
)

Base.metadata.create_all(bind=engine)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PetCare Hub API")

LOCAL_ORIGINS = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=LOCAL_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(ai_pathway_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(community_posts_router, prefix="/api/v1")
app.include_router(care_team_router, prefix="/api/v1")
app.include_router(sicknesses_router, prefix="/api/v1")
app.include_router(feed_router, prefix="/api/v1")
app.include_router(updates_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(home_page_content_router, prefix="/api/v1")


@app.on_event("startup")
def load_seed_data() -> None:
    seed_data()


@app.get("/")
def root():
    return {"status": "Backend running successfully!"}
