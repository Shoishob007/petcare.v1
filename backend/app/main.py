from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.auth import router as auth_router
from app.api.v1.reports import router as reports_router
from app.db.session import Base, engine

Base.metadata.create_all(bind=engine)

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

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(reports_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"status": "Backend running successfully!"}
