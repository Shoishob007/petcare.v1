import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import UPLOAD_DIR

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def save_upload(file: UploadFile) -> str:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = CONTENT_TYPE_EXTENSIONS.get(file.content_type, ".jpg")

    file_name = f"{uuid.uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / file_name
    with destination.open("wb") as buffer:
        buffer.write(file.file.read())
    return file_name


def delete_upload(file_name: str) -> None:
    if not file_name:
        return
    file_path = UPLOAD_DIR / file_name
    if file_path.exists():
        file_path.unlink()
