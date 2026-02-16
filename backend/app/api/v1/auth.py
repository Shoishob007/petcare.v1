from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.uploads import delete_upload, save_upload
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_roles,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthChangePasswordRequest,
    AuthLoginRequest,
    AuthProfileUpdateRequest,
    AuthRegisterRequest,
    AuthRoleUpdateRequest,
    AuthTokenResponse,
    AuthUserResponse,
    AuthUsersListResponse,
)

router = APIRouter()
ALLOWED_ROLES = {"admin", "user"}


def normalize_role(value: str) -> str:
    role = value.strip().lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Unsupported role.")
    return role


@router.post("/register", response_model=AuthTokenResponse)
def register(payload: AuthRegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use.")

    normalized_username = payload.username.strip().lower() if payload.username else None
    if normalized_username:
        username_exists = (
            db.query(User).filter(User.username == normalized_username).first()
        )
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already in use.")

    user = User(
        email=normalized_email,
        password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=normalized_username,
        phone=payload.phone,
        city=payload.city,
        country=payload.country,
        bio=payload.bio,
        is_pet_caregiver=payload.is_pet_caregiver,
        is_veterinarian=payload.is_veterinarian,
        specializations=payload.specializations,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return AuthTokenResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return AuthTokenResponse(access_token=token, user=user)


@router.get("/me", response_model=AuthUserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=AuthUserResponse)
def update_me(
    payload: AuthProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    if "username" in data and data["username"]:
        normalized_username = data["username"].strip().lower()
        username_exists = (
            db.query(User)
            .filter(User.username == normalized_username, User.id != current_user.id)
            .first()
        )
        if username_exists:
            raise HTTPException(status_code=400, detail="Username already in use.")
        data["username"] = normalized_username

    for key, value in data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: AuthChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password.",
        )

    current_user.password = hash_password(payload.new_password)
    db.commit()
    return {"status": "password_updated"}


@router.post("/upload-profile-image", response_model=AuthUserResponse)
def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_image = current_user.profile_image_url
    file_name = save_upload(file)
    if existing_image and existing_image.startswith("/uploads/"):
        delete_upload(existing_image.replace("/uploads/", ""))

    current_user.profile_image_url = f"/uploads/{file_name}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=AuthUsersListResponse)
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles("admin")),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return AuthUsersListResponse(users=users)


@router.patch("/users/{user_id}/role", response_model=AuthUserResponse)
def update_user_role(
    user_id: str,
    payload: AuthRoleUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.role = normalize_role(payload.role)
    db.commit()
    db.refresh(user)
    return user
