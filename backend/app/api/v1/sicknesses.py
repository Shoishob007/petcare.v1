from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.core.uploads import delete_upload, save_upload
from app.db.session import get_db
from app.models.sickness_images import SicknessImage
from app.models.sicknesses import Sickness
from app.models.user import User
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
    current_user: User = Depends(get_current_user),
):
    is_admin = (current_user.role or "user").lower() == "admin"
    sickness = Sickness(
        **payload.dict(),
        reported_by_id=current_user.id,
        is_verified=is_admin,
        verified_by=(current_user.username or current_user.email) if is_admin else None,
    )
    db.add(sickness)
    db.commit()
    db.refresh(sickness)
    return sickness


@router.get("/sicknesses", response_model=List[SicknessResponse])
def list_sicknesses(db: Session = Depends(get_db)):
    return (
        db.query(Sickness)
        .filter(or_(Sickness.is_verified == True, Sickness.is_verified.is_(None)))
        .order_by(Sickness.created_at.desc())
        .all()
    )


@router.get("/sicknesses/pending", response_model=List[SicknessResponse])
def list_pending_sicknesses(
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    return (
        db.query(Sickness)
        .filter(Sickness.is_verified == False)
        .order_by(Sickness.created_at.desc())
        .all()
    )


@router.post("/sicknesses/{sickness_id}/approve", response_model=SicknessResponse)
def approve_sickness(
    sickness_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    sickness.is_verified = True
    sickness.verified_by = admin_user.username or admin_user.email
    db.commit()
    db.refresh(sickness)
    return sickness


@router.delete("/sicknesses/{sickness_id}/reject")
def reject_sickness(
    sickness_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    for image in sickness.images:
        delete_upload(image.file_name)

    db.delete(sickness)
    db.commit()
    return {"status": "rejected"}


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
        delete_upload(image.file_name)

    db.delete(sickness)
    db.commit()
    return {"status": "deleted"}


@router.post("/sicknesses/{sickness_id}/images", response_model=List[SicknessImageResponse])
def upload_sickness_images(
    sickness_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    is_admin = (current_user.role or "user").lower() == "admin"
    can_upload_pending = (
        not sickness.is_verified and sickness.reported_by_id == current_user.id
    )
    if not (is_admin or can_upload_pending):
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

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


@router.delete("/sicknesses/{sickness_id}/images/{image_id}")
def delete_sickness_image(
    sickness_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sickness = db.query(Sickness).filter(Sickness.id == sickness_id).first()
    if not sickness:
        raise HTTPException(status_code=404, detail="Sickness not found.")

    is_admin = (current_user.role or "user").lower() == "admin"
    can_manage_pending = (
        not sickness.is_verified and sickness.reported_by_id == current_user.id
    )
    if not (is_admin or can_manage_pending):
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    image = (
        db.query(SicknessImage)
        .filter(
            SicknessImage.id == image_id,
            SicknessImage.sickness_id == sickness_id,
        )
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")

    delete_upload(image.file_name)
    db.delete(image)
    db.commit()
    return {"status": "deleted"}
