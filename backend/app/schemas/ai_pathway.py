from pydantic import BaseModel, Field


class AISicknessIngestRequest(BaseModel):
    pet_species: str | None = None
    pet_age_months: int | None = None
    symptoms: str = Field(min_length=3)
    additional_context: str | None = None
    source: str = "manual"

    model_config = {
        "json_schema_extra": {
            "example": {
                "pet_species": "dog",
                "pet_age_months": 24,
                "symptoms": "vomiting, low appetite, lethargy for 2 days",
                "additional_context": "No known toxin exposure. Drinking water normally.",
                "source": "manual",
            }
        }
    }


class AISicknessIngestResponse(BaseModel):
    case_id: int
    status: str
    urgency_level: str
    requires_vet_visit: bool
    suspected_condition: str | None = None
    note: str
