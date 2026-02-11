from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.care_team import CareTeamMember
from app.schemas.care_team import (
    CareTeamMemberCreate,
    CareTeamMemberResponse,
    CareTeamMemberUpdate,
)

router = APIRouter()


@router.post("/care-team", response_model=CareTeamMemberResponse)
def create_care_team_member(
    payload: CareTeamMemberCreate, db: Session = Depends(get_db)
):
    member = CareTeamMember(**payload.dict())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.get("/care-team", response_model=List[CareTeamMemberResponse])
def list_care_team_members(db: Session = Depends(get_db)):
    return db.query(CareTeamMember).order_by(CareTeamMember.created_at.desc()).all()


@router.patch("/care-team/{member_id}", response_model=CareTeamMemberResponse)
def update_care_team_member(
    member_id: str, payload: CareTeamMemberUpdate, db: Session = Depends(get_db)
):
    member = db.query(CareTeamMember).filter(CareTeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/care-team/{member_id}")
def delete_care_team_member(member_id: str, db: Session = Depends(get_db)):
    member = db.query(CareTeamMember).filter(CareTeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    db.delete(member)
    db.commit()
    return {"status": "deleted"}
