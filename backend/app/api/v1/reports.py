from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.uploads import delete_upload, save_upload
from app.db.session import get_db
from app.models.report_comments import ReportComment
from app.models.report_images import ReportImage
from app.models.report_reactions import ReportReaction
from app.models.reports import Report
from app.models.user import User
from app.schemas.comments import ReportCommentCreate, ReportCommentResponse
from app.schemas.reports import (
    ReportCreate,
    ReportImageResponse,
    ReportResponse,
    ReportUpdate,
)

router = APIRouter()


def display_name(user: User) -> str:
    name = " ".join(filter(None, [user.first_name, user.last_name])).strip()
    return name or user.username or user.email.split("@")[0]


def ensure_report_owner_or_admin(report: Report, user: User) -> None:
    if (user.role or "user").lower() == "admin":
        return
    if any(reporter.id == user.id for reporter in report.reporters):
        return
    raise HTTPException(status_code=403, detail="Not allowed to modify this report.")


@router.post("/reports", response_model=ReportResponse)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(**payload.dict())
    if not report.reporter_name:
        report.reporter_name = display_name(current_user)
    report.reporters.append(current_user)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.patch("/reports/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    ensure_report_owner_or_admin(report, current_user)

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(report, key, value)
    db.commit()
    db.refresh(report)
    return report


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    ensure_report_owner_or_admin(report, current_user)

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
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    ensure_report_owner_or_admin(report, current_user)

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
def react_to_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    existing = (
        db.query(ReportReaction)
        .filter(
            ReportReaction.report_id == report_id,
            ReportReaction.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        report.reaction_count = max(0, (report.reaction_count or 0) - 1)
    else:
        db.add(ReportReaction(report_id=report_id, user_id=current_user.id))
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
    report_id: str,
    payload: ReportCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    comment = ReportComment(
        report_id=report_id,
        user_id=current_user.id,
        author_name=display_name(current_user),
        body=payload.body,
        parent_id=payload.parent_id,
    )
    report.comment_count = (report.comment_count or 0) + 1
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
