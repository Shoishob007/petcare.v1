import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.home_page_content import HomePageContent
from app.models.user import User
from app.schemas.home_page_content import HomePageContentResponse, HomePageContentUpdate

router = APIRouter()


def get_home_content_or_404(db: Session) -> HomePageContent:
    record = db.query(HomePageContent).filter(HomePageContent.id == 1).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=(
                "Homepage content is not initialized in the database. "
                "Create row id=1 in table home_page_content before calling this endpoint."
            ),
        )
    return record


@router.get("/homepage-content", response_model=HomePageContentResponse)
def get_homepage_content(db: Session = Depends(get_db)):
    record = get_home_content_or_404(db)
    payload = json.loads(record.content_json)
    return HomePageContentResponse(**payload)


@router.patch("/homepage-content", response_model=HomePageContentResponse)
def update_homepage_content(
    patch: HomePageContentUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    record = get_home_content_or_404(db)
    existing_payload = json.loads(record.content_json)

    updates = patch.model_dump(exclude_unset=True)
    merged_payload = {**existing_payload, **updates}

    validated = HomePageContentResponse(**merged_payload)
    record.content_json = validated.model_dump_json()
    record.updated_by_user_id = admin_user.id
    db.commit()
    db.refresh(record)

    return validated
