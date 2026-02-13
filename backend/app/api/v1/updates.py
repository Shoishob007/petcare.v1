from typing import List, Optional, Union

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.uploads import delete_upload, save_upload
from app.db.session import get_db
from app.models.community_post_comments import CommunityPostComment
from app.models.community_post_images import CommunityPostImage
from app.models.community_posts import CommunityPost
from app.models.report_comments import ReportComment
from app.models.report_images import ReportImage
from app.models.reports import Report
from app.schemas.updates import (
    UpdateCommentCreate,
    UpdateCommentResponse,
    UpdateCreate,
    UpdateImageResponse,
    UpdateResponse,
    UpdateUpdate,
)

router = APIRouter()

ALLOWED_ITEM_TYPES = {"report", "community"}


def require_item_type(item_type: str) -> str:
    if item_type not in ALLOWED_ITEM_TYPES:
        raise HTTPException(status_code=400, detail="Invalid item type.")
    return item_type


def resolve_content(
    item_type: str, payload: Union[UpdateCreate, UpdateUpdate]
) -> Optional[str]:
    if item_type == "report":
        if payload.description is not None:
            return payload.description
        if payload.content is not None:
            return payload.content
        if payload.body is not None:
            return payload.body
        return None
    if payload.body is not None:
        return payload.body
    if payload.content is not None:
        return payload.content
    if payload.description is not None:
        return payload.description
    return None


def report_to_response(report: Report) -> UpdateResponse:
    return UpdateResponse(
        id=report.id,
        item_type="report",
        title=report.title,
        content=report.description,
        category=report.category,
        location=report.location,
        status=report.status,
        species=report.species,
        urgency=report.urgency,
        reporter_name=report.reporter_name,
        reaction_count=report.reaction_count or 0,
        created_at=report.created_at,
        images=report.images,
    )


def post_to_response(post: CommunityPost) -> UpdateResponse:
    return UpdateResponse(
        id=post.id,
        item_type="community",
        title=post.title,
        content=post.body,
        category=post.category,
        location=post.location,
        author_name=post.author_name,
        tags=post.tags,
        image_url=post.image_url,
        reaction_count=post.reaction_count or 0,
        created_at=post.created_at,
        images=post.images,
    )


def report_comment_to_response(comment: ReportComment) -> UpdateCommentResponse:
    return UpdateCommentResponse(
        id=comment.id,
        item_id=comment.report_id,
        body=comment.body,
        author_name=comment.author_name,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
    )


def post_comment_to_response(comment: CommunityPostComment) -> UpdateCommentResponse:
    return UpdateCommentResponse(
        id=comment.id,
        item_id=comment.post_id,
        body=comment.body,
        author_name=comment.author_name,
        parent_id=comment.parent_id,
        created_at=comment.created_at,
    )


@router.get("/updates", response_model=List[UpdateResponse])
def list_updates(
    item_type: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    if limit <= 0:
        raise HTTPException(status_code=400, detail="Limit must be positive.")
    if offset < 0:
        raise HTTPException(status_code=400, detail="Offset must be non-negative.")

    if item_type:
        require_item_type(item_type)
        fetch_size = max(limit + offset, limit)
        if item_type == "report":
            reports = (
                db.query(Report)
                .order_by(Report.created_at.desc())
                .limit(fetch_size)
                .all()
            )
            items = [report_to_response(report) for report in reports]
        else:
            posts = (
                db.query(CommunityPost)
                .order_by(CommunityPost.created_at.desc())
                .limit(fetch_size)
                .all()
            )
            items = [post_to_response(post) for post in posts]
        return items[offset : offset + limit]

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

    items: List[UpdateResponse] = [
        report_to_response(report) for report in report_items
    ] + [post_to_response(post) for post in community_items]
    items.sort(key=lambda item: item.created_at, reverse=True)
    return items[offset : offset + limit]


@router.post("/updates", response_model=UpdateResponse)
def create_update(payload: UpdateCreate, db: Session = Depends(get_db)):
    item_type = require_item_type(payload.item_type)
    content = resolve_content(item_type, payload)

    if item_type == "community" and not (content and content.strip()):
        raise HTTPException(status_code=400, detail="Community posts need content.")

    if item_type == "report":
        report = Report(
            title=payload.title,
            description=content,
            location=payload.location,
            category=payload.category,
            status=payload.status or "open",
            species=payload.species,
            urgency=payload.urgency,
            reporter_name=payload.reporter_name,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report_to_response(report)

    post = CommunityPost(
        title=payload.title,
        body=content or "",
        category=payload.category,
        author_name=payload.author_name,
        tags=payload.tags,
        image_url=payload.image_url,
        location=payload.location,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_response(post)


@router.patch("/updates/{item_type}/{item_id}", response_model=UpdateResponse)
def update_update(
    item_type: str, item_id: str, payload: UpdateUpdate, db: Session = Depends(get_db)
):
    item_type = require_item_type(item_type)
    content = resolve_content(item_type, payload)

    if item_type == "report":
        report = db.query(Report).filter(Report.id == item_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        update_data = payload.dict(exclude_unset=True)
        if (
            "content" in update_data
            or "description" in update_data
            or "body" in update_data
        ):
            update_data["description"] = content
        for key in ("content", "description", "body"):
            update_data.pop(key, None)
        allowed = {
            "title",
            "description",
            "location",
            "category",
            "status",
            "species",
            "urgency",
            "reporter_name",
        }
        for key, value in update_data.items():
            if key in allowed:
                setattr(report, key, value)
        db.commit()
        db.refresh(report)
        return report_to_response(report)

    post = db.query(CommunityPost).filter(CommunityPost.id == item_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    update_data = payload.dict(exclude_unset=True)
    if (
        "content" in update_data
        or "description" in update_data
        or "body" in update_data
    ):
        update_data["body"] = content
    for key in ("content", "description", "body"):
        update_data.pop(key, None)

    if "image_url" in update_data:
        if (
            post.image_url
            and post.image_url.startswith("/uploads/")
            and update_data["image_url"] != post.image_url
        ):
            delete_upload(post.image_url.replace("/uploads/", ""))

    allowed = {"title", "body", "category", "author_name", "tags", "image_url", "location"}
    for key, value in update_data.items():
        if key in allowed:
            setattr(post, key, value)
    db.commit()
    db.refresh(post)
    return post_to_response(post)


@router.delete("/updates/{item_type}/{item_id}")
def delete_update(item_type: str, item_id: str, db: Session = Depends(get_db)):
    item_type = require_item_type(item_type)

    if item_type == "report":
        report = db.query(Report).filter(Report.id == item_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        for image in report.images:
            delete_upload(image.file_name)
        db.delete(report)
        db.commit()
        return {"status": "deleted"}

    post = db.query(CommunityPost).filter(CommunityPost.id == item_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    if post.image_url and post.image_url.startswith("/uploads/"):
        delete_upload(post.image_url.replace("/uploads/", ""))
    for image in post.images:
        delete_upload(image.file_name)
    db.delete(post)
    db.commit()
    return {"status": "deleted"}


@router.post(
    "/updates/{item_type}/{item_id}/images", response_model=List[UpdateImageResponse]
)
def upload_update_images(
    item_type: str,
    item_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    item_type = require_item_type(item_type)
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    if item_type == "report":
        report = db.query(Report).filter(Report.id == item_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        images: List[ReportImage] = []
        for file in files:
            file_name = save_upload(file)
            image = ReportImage(report_id=item_id, file_name=file_name)
            images.append(image)
            db.add(image)
        db.commit()
        for image in images:
            db.refresh(image)
        return images

    post = db.query(CommunityPost).filter(CommunityPost.id == item_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    images: List[CommunityPostImage] = []
    for file in files:
        file_name = save_upload(file)
        image = CommunityPostImage(post_id=item_id, file_name=file_name)
        images.append(image)
        db.add(image)
    db.commit()
    for image in images:
        db.refresh(image)
    return images


@router.post("/updates/{item_type}/{item_id}/reactions", response_model=UpdateResponse)
def react_to_update(item_type: str, item_id: str, db: Session = Depends(get_db)):
    item_type = require_item_type(item_type)

    if item_type == "report":
        report = db.query(Report).filter(Report.id == item_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        report.reaction_count = (report.reaction_count or 0) + 1
        db.commit()
        db.refresh(report)
        return report_to_response(report)

    post = db.query(CommunityPost).filter(CommunityPost.id == item_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.reaction_count = (post.reaction_count or 0) + 1
    db.commit()
    db.refresh(post)
    return post_to_response(post)


@router.get(
    "/updates/{item_type}/{item_id}/comments",
    response_model=List[UpdateCommentResponse],
)
def list_update_comments(
    item_type: str, item_id: str, db: Session = Depends(get_db)
):
    item_type = require_item_type(item_type)

    if item_type == "report":
        comments = (
            db.query(ReportComment)
            .filter(ReportComment.report_id == item_id)
            .order_by(ReportComment.created_at.asc())
            .all()
        )
        return [report_comment_to_response(comment) for comment in comments]

    comments = (
        db.query(CommunityPostComment)
        .filter(CommunityPostComment.post_id == item_id)
        .order_by(CommunityPostComment.created_at.asc())
        .all()
    )
    return [post_comment_to_response(comment) for comment in comments]


@router.post(
    "/updates/{item_type}/{item_id}/comments",
    response_model=UpdateCommentResponse,
)
def create_update_comment(
    item_type: str,
    item_id: str,
    payload: UpdateCommentCreate,
    db: Session = Depends(get_db),
):
    item_type = require_item_type(item_type)

    if item_type == "report":
        report = db.query(Report).filter(Report.id == item_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        comment = ReportComment(report_id=item_id, **payload.dict())
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return report_comment_to_response(comment)

    post = db.query(CommunityPost).filter(CommunityPost.id == item_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    comment = CommunityPostComment(post_id=item_id, **payload.dict())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return post_comment_to_response(comment)
