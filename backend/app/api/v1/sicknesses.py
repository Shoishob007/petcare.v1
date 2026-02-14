from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.core.uploads import save_upload
from app.db.session import get_db
from app.models.sickness_images import SicknessImage
from app.models.sicknesses import Sickness
from app.schemas.sicknesses import (
    SicknessCreate,
    SicknessImageResponse,
    SicknessResponse,
    SicknessUpdate,
)

router = APIRouter()


@router.post("/sicknesses", response_model=SicknessResponse)
def create_sickness(
    payload: SicknessCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    sickness = Sickness(**payload.dict())
    db.add(sickness)
    db.commit()
    db.refresh(sickness)
    return sickness


@router.get("/sicknesses", response_model=List[SicknessResponse])
def list_sicknesses(db: Session = Depends(get_db)):
    return db.query(Sickness).order_by(Sickness.created_at.desc()).all()


@router.patch("/sicknesses/{sickness_id}", response_model=SicknessResponse)
def update_sickness(
    sickness_id: str,
    payload: SicknessUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(sickness, key, value)
    db.commit()
    db.refresh(sickness)
    return sickness


@router.delete("/sicknesses/{sickness_id}")
def delete_sickness(
    sickness_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    for image in sickness.images:
        from app.core.uploads import delete_upload

        delete_upload(image.file_name)

    db.delete(sickness)
    db.commit()
    return {"status": "deleted"}


@router.post("/sicknesses/{sickness_id}/images", response_model=List[SicknessImageResponse])
def upload_sickness_images(
    sickness_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    images: List[SicknessImage] = []
    for file in files:
        file_name = save_upload(file)
        image = SicknessImage(sickness_id=sickness_id, file_name=file_name)
        images.append(image)
        db.add(image)

    db.commit()
    for image in images:
        db.refresh(image)
    return images
