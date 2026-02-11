from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.community_posts import CommunityPost
from app.models.reports import Report
from app.schemas.feed import FeedItem

router = APIRouter()


@router.get("/feed", response_model=List[FeedItem])
def get_feed(limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    fetch_size = max(limit + offset, limit)
    report_items = (
        db.query(Report)
        .order_by(Report.created_at.desc())
        .limit(fetch_size)
        .all()
    )
    community_items = (
        db.query(CommunityPost)
        .order_by(CommunityPost.created_at.desc())
        .limit(fetch_size)
        .all()
    )

    items: List[FeedItem] = []
    for report in report_items:
        items.append(
            FeedItem(
                item_type="report",
                id=report.id,
                title=report.title,
                summary=report.description,
                category=report.category,
                location=report.location,
                created_at=report.created_at,
                images=report.images,
                reaction_count=report.reaction_count or 0,
            )
        )

    for post in community_items:
        items.append(
            FeedItem(
                item_type="community",
                id=post.id,
                title=post.title,
                summary=post.body,
                category=post.category,
                location=None,
                created_at=post.created_at,
                images=post.images,
                image_url=post.image_url,
                reaction_count=post.reaction_count or 0,
            )
        )

    items.sort(key=lambda item: item.created_at, reverse=True)
    return items[offset : offset + limit]
