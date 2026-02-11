from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.uploads import delete_upload, save_upload
from app.db.session import get_db
from app.models.report_comments import ReportComment
from app.models.report_images import ReportImage
from app.models.reports import Report
from app.schemas.comments import ReportCommentCreate, ReportCommentResponse
from app.schemas.reports import (
    ReportCreate,
    ReportImageResponse,
    ReportResponse,
    ReportUpdate,
)

router = APIRouter()


@router.post("/reports", response_model=ReportResponse)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    report = Report(**payload.dict())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.patch("/reports/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str, payload: ReportUpdate, db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(report, key, value)
    db.commit()
    db.refresh(report)
    return report


@router.delete("/reports/{report_id}")
def delete_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    for image in report.images:
        delete_upload(image.file_name)

    db.delete(report)
    db.commit()
    return {"status": "deleted"}


@router.post("/reports/{report_id}/images", response_model=List[ReportImageResponse])
def upload_report_images(
    report_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    images: List[ReportImage] = []
    for file in files:
        file_name = save_upload(file)
        image = ReportImage(report_id=report_id, file_name=file_name)
        images.append(image)
        db.add(image)

    db.commit()
    for image in images:
        db.refresh(image)
    return images


@router.post("/reports/{report_id}/reactions", response_model=ReportResponse)
def react_to_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    report.reaction_count = (report.reaction_count or 0) + 1
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports/{report_id}/comments", response_model=List[ReportCommentResponse])
def list_report_comments(report_id: str, db: Session = Depends(get_db)):
    return (
        db.query(ReportComment)
        .filter(ReportComment.report_id == report_id)
        .order_by(ReportComment.created_at.asc())
        .all()
    )


@router.post("/reports/{report_id}/comments", response_model=ReportCommentResponse)
def create_report_comment(
    report_id: str, payload: ReportCommentCreate, db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    comment = ReportComment(report_id=report_id, **payload.dict())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
