from pydantic import BaseModel, Field


class HomeStat(BaseModel):
    label: str = Field(min_length=1)
    value: str = Field(min_length=1)


class HomeFeature(BaseModel):
    icon: str = Field(min_length=1)
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)


class HomeAIPathway(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    disclaimer: str = Field(min_length=1)


class HomePageContentResponse(BaseModel):
    badge: str
    title_prefix: str
    title_highlight: str
    description: str
    primary_cta_label: str
    primary_cta_href: str
    secondary_cta_label: str
    secondary_cta_href: str
    stats: list[HomeStat]
    features: list[HomeFeature]
    ai_pathway: HomeAIPathway


class HomePageContentUpdate(BaseModel):
    badge: str | None = None
    title_prefix: str | None = None
    title_highlight: str | None = None
    description: str | None = None
    primary_cta_label: str | None = None
    primary_cta_href: str | None = None
    secondary_cta_label: str | None = None
    secondary_cta_href: str | None = None
    stats: list[HomeStat] | None = None
    features: list[HomeFeature] | None = None
    ai_pathway: HomeAIPathway | None = None
