from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.uploads import delete_upload, save_upload
from app.db.session import get_db
from app.models.community_post_comments import CommunityPostComment
from app.models.community_post_images import CommunityPostImage
from app.models.community_posts import CommunityPost
from app.schemas.comments import (
    CommunityPostCommentCreate,
    CommunityPostCommentResponse,
)
from app.schemas.community_posts import (
    CommunityPostCreate,
    CommunityPostImageResponse,
    CommunityPostResponse,
    CommunityPostUpdate,
)

router = APIRouter()


@router.post("/community-posts", response_model=CommunityPostResponse)
def create_community_post(payload: CommunityPostCreate, db: Session = Depends(get_db)):
    post = CommunityPost(**payload.dict())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/community-posts", response_model=List[CommunityPostResponse])
def list_community_posts(db: Session = Depends(get_db)):
    return db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).all()


@router.patch("/community-posts/{post_id}", response_model=CommunityPostResponse)
def update_community_post(
    post_id: str, payload: CommunityPostUpdate, db: Session = Depends(get_db)
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    update_data = payload.dict(exclude_unset=True)
    if "image_url" in update_data:
        if (
            post.image_url
            and post.image_url.startswith("/uploads/")
            and update_data["image_url"] != post.image_url
        ):
            delete_upload(post.image_url.replace("/uploads/", ""))

    for key, value in update_data.items():
        setattr(post, key, value)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/community-posts/{post_id}")
def delete_community_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if post.image_url and post.image_url.startswith("/uploads/"):
        delete_upload(post.image_url.replace("/uploads/", ""))

    for image in post.images:
        delete_upload(image.file_name)

    db.delete(post)
    db.commit()
    return {"status": "deleted"}


@router.post("/community-posts/{post_id}/image", response_model=CommunityPostResponse)
def upload_community_post_image(
    post_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if post.image_url and post.image_url.startswith("/uploads/"):
        delete_upload(post.image_url.replace("/uploads/", ""))

    file_name = save_upload(file)
    post.image_url = f"/uploads/{file_name}"
    db.commit()
    db.refresh(post)
    return post


@router.post(
    "/community-posts/{post_id}/images", response_model=List[CommunityPostImageResponse]
)
def upload_community_post_images(
    post_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    images: List[CommunityPostImage] = []
    for file in files:
        file_name = save_upload(file)
        image = CommunityPostImage(post_id=post_id, file_name=file_name)
        images.append(image)
        db.add(image)

    db.commit()
    for image in images:
        db.refresh(image)
    return images


@router.post("/community-posts/{post_id}/reactions", response_model=CommunityPostResponse)
def react_to_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    post.reaction_count = (post.reaction_count or 0) + 1
    db.commit()
    db.refresh(post)
    return post


@router.get(
    "/community-posts/{post_id}/comments",
    response_model=List[CommunityPostCommentResponse],
)
def list_post_comments(post_id: str, db: Session = Depends(get_db)):
    return (
        db.query(CommunityPostComment)
        .filter(CommunityPostComment.post_id == post_id)
        .order_by(CommunityPostComment.created_at.asc())
        .all()
    )


@router.post(
    "/community-posts/{post_id}/comments",
    response_model=CommunityPostCommentResponse,
)
def create_post_comment(
    post_id: str, payload: CommunityPostCommentCreate, db: Session = Depends(get_db)
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    comment = CommunityPostComment(post_id=post_id, **payload.dict())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
