from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.ai_sickness_case import AISicknessCase
from app.models.user import User
from app.schemas.ai_pathway import AISicknessIngestRequest, AISicknessIngestResponse

router = APIRouter()


def infer_urgency(symptoms: str) -> tuple[str, bool, str | None]:
    text = symptoms.lower()
    critical_keywords = ["seizure", "unconscious", "bleeding", "can not breathe", "can't breathe"]
    high_keywords = ["vomit", "diarrhea", "fever", "not eating", "lethargy"]

    if any(keyword in text for keyword in critical_keywords):
        return "critical", True, "Immediate veterinary evaluation required"
    if any(keyword in text for keyword in high_keywords):
        return "high", True, "Potential acute gastrointestinal or systemic issue"
    return "medium", True, None


@router.post("/ai/sickness-assist/ingest", response_model=AISicknessIngestResponse)
def ingest_sickness_case(
    payload: AISicknessIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    urgency_level, requires_vet_visit, suspected_condition = infer_urgency(payload.symptoms)

    case = AISicknessCase(
        user_id=current_user.id,
        pet_species=payload.pet_species,
        pet_age_months=payload.pet_age_months,
        symptoms=payload.symptoms,
        additional_context=payload.additional_context,
        suspected_condition=suspected_condition,
        urgency_level=urgency_level,
        requires_vet_visit=requires_vet_visit,
        status="queued",
        source=payload.source,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    return AISicknessIngestResponse(
        case_id=case.id,
        status=case.status,
        urgency_level=case.urgency_level,
        requires_vet_visit=case.requires_vet_visit,
        suspected_condition=case.suspected_condition,
        note=(
            "This is an assistive triage pathway for future AI integration. "
            "Use veterinarian consultation for diagnosis and medication decisions."
        ),
    )
