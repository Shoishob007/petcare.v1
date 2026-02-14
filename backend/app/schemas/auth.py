from datetime import datetime
from pydantic import BaseModel, Field


class AuthRegisterRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    first_name: str = Field(min_length=1)
    last_name: str | None = None
    username: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    bio: str | None = None
    is_pet_caregiver: bool = False
    is_veterinarian: bool = False
    specializations: str | None = None


class AuthLoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str


class AuthProfileUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    bio: str | None = None
    is_pet_caregiver: bool | None = None
    is_veterinarian: bool | None = None
    specializations: str | None = None


class AuthChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class AuthRoleUpdateRequest(BaseModel):
    role: str = Field(min_length=3)


class AuthUserResponse(BaseModel):
    id: str
    email: str
    role: str
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    bio: str | None = None
    is_pet_caregiver: bool
    is_veterinarian: bool
    specializations: str | None = None
    last_login: datetime | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class AuthUsersListResponse(BaseModel):
    users: list[AuthUserResponse]
