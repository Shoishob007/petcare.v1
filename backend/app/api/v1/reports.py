from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.reports import Report
from app.schemas.reports import ReportCreate, ReportResponse

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
