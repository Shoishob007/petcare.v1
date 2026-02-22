import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import UPLOAD_DIR

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_FILE_TYPES = {
    *ALLOWED_IMAGE_TYPES,
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
}
CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
}


def save_upload(file: UploadFile, allow_non_image: bool = False) -> str:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    content_type = (file.content_type or "").lower()

    if not allow_non_image and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")
    if allow_non_image and content_type and content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type.",
        )

    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = CONTENT_TYPE_EXTENSIONS.get(content_type, ".bin")

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
