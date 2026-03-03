import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.home_page_content import HomePageContent
from app.models.user import User
from app.schemas.home_page_content import HomePageContentResponse, HomePageContentUpdate

router = APIRouter()


def default_home_content() -> dict:
    return {
        "badge": "✨ Neighborhood Pet Safety",
        "title_prefix": "Your Pet Community,",
        "title_highlight": "Connected & Safe",
        "description": (
            "Report sightings instantly. Connect with veterinarians and pet professionals. "
            "Keep your pets safe and your community informed—all in one platform designed for pet lovers."
        ),
        "primary_cta_label": "Create Your First Post",
        "primary_cta_href": "/feed#updates-board",
        "secondary_cta_label": "Explore Community Feed",
        "secondary_cta_href": "/feed",
        "stats": [
            {"label": "Active Users", "value": "2,847+"},
            {"label": "Pets Helped", "value": "1,234+"},
            {"label": "Reports Posted", "value": "5,678+"},
            {"label": "Communities", "value": "12+"},
        ],
        "features": [
            {
                "icon": "Shield",
                "title": "Lost & Found Reports",
                "description": "Create detailed reports with photos, location, and pet details to help bring pets home safely.",
            },
            {
                "icon": "Heart",
                "title": "Health & Wellness",
                "description": "Share health concerns, get professional vet advice, and track your pet's medical history.",
            },
            {
                "icon": "Users",
                "title": "Care Community",
                "description": "Connect with local pet professionals, groomers, trainers, and fellow pet enthusiasts.",
            },
            {
                "icon": "MessageSquare",
                "title": "Real-time Feed",
                "description": "Comment, react, and get instant notifications when there's activity on your posts.",
            },
            {
                "icon": "Zap",
                "title": "Smart Alerts",
                "description": "Set location-based alerts to stay informed about pet incidents in your neighborhood.",
            },
            {
                "icon": "Users",
                "title": "Professional Network",
                "description": "Find verified veterinarians, groomers, trainers, and pet sitters in your area.",
            },
        ],
        "ai_pathway": {
            "title": "AI Readiness for Sickness Insights",
            "description": "We prepare structured symptom and case data so future AI models can assist triage and condition detection at scale.",
            "disclaimer": "AI suggestions are assistive only and do not replace a licensed veterinarian diagnosis.",
        },
    }


def get_or_create_home_content(db: Session) -> HomePageContent:
    record = db.query(HomePageContent).filter(HomePageContent.id == 1).first()
    if record:
        return record

    record = HomePageContent(id=1, content_json=json.dumps(default_home_content()))
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/homepage-content", response_model=HomePageContentResponse)
def get_homepage_content(db: Session = Depends(get_db)):
    record = get_or_create_home_content(db)
    payload = json.loads(record.content_json)
    return HomePageContentResponse(**payload)


@router.patch("/homepage-content", response_model=HomePageContentResponse)
def update_homepage_content(
    patch: HomePageContentUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    record = get_or_create_home_content(db)
    existing_payload = json.loads(record.content_json)

    updates = patch.model_dump(exclude_unset=True)
    merged_payload = {**existing_payload, **updates}

    validated = HomePageContentResponse(**merged_payload)
    record.content_json = validated.model_dump_json()
    record.updated_by_user_id = admin_user.id
    db.commit()
    db.refresh(record)

    return validated
