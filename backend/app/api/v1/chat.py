from datetime import datetime
from typing import Any, Dict, List

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.security import get_current_user
from app.core.uploads import save_upload
from app.db.session import SessionLocal, get_db
from app.models.chat import ChatMember, ChatMemberRequest, ChatMessage, ChatRoom
from app.models.user import User
from app.schemas.chat import (
    ChatDirectCreateRequest,
    ChatGroupCreateRequest,
    ChatMemberSummary,
    ChatMemberAddRequest,
    ChatMemberRequestCreate,
    ChatMemberRequestResponse,
    ChatMemberRequestReview,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatReadRequest,
    ChatSummaryResponse,
    ChatUnreadCountResponse,
    ChatUploadResponse,
    ChatUserSummary,
)

router = APIRouter()

MESSAGE_TYPES = {"text", "emoji", "image", "file", "location", "system"}


class ChatConnectionManager:
    def __init__(self):
        self.active: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        sockets = self.active.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self.active.pop(user_id, None)

    async def send_to_users(self, user_ids: list[str], payload: dict[str, Any]):
        for user_id in user_ids:
            sockets = list(self.active.get(user_id, set()))
            for ws in sockets:
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(user_id, ws)


manager = ChatConnectionManager()


def _display_name(user: User) -> str:
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    return full_name or user.username or user.email


def _user_summary(user: User) -> ChatUserSummary:
    return ChatUserSummary(
        id=user.id,
        email=user.email,
        display_name=_display_name(user),
        profile_image_url=user.profile_image_url,
        role=user.role,
    )


def _serialize_message(db: Session, message: ChatMessage) -> ChatMessageResponse:
    sender = db.query(User).filter(User.id == message.sender_id).first()
    sender_name = _display_name(sender) if sender else "Unknown"
    sender_avatar = sender.profile_image_url if sender else None
    return ChatMessageResponse(
        id=message.id,
        chat_id=message.room_id,
        sender_id=message.sender_id,
        sender_name=sender_name,
        sender_avatar=sender_avatar,
        message_type=message.message_type,
        content=message.content,
        file_url=message.file_url,
        file_name=message.file_name,
        location_lat=message.location_lat,
        location_lng=message.location_lng,
        location_label=message.location_label,
        created_at=message.created_at,
    )


def _get_membership_or_404(db: Session, chat_id: str, user_id: str) -> ChatMember:
    membership = (
        db.query(ChatMember)
        .options(joinedload(ChatMember.room))
        .filter(ChatMember.room_id == chat_id, ChatMember.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return membership


def _room_member_user_ids(db: Session, room_id: str) -> list[str]:
    rows = db.query(ChatMember.user_id).filter(ChatMember.room_id == room_id).all()
    return [row[0] for row in rows]


def _is_chat_admin(member: ChatMember, user: User) -> bool:
    return (member.role or "member").lower() == "admin" or (user.role or "user").lower() == "admin"


def _serialize_member_request(db: Session, request: ChatMemberRequest) -> ChatMemberRequestResponse:
    requester = db.query(User).filter(User.id == request.requester_id).first()
    target_user = db.query(User).filter(User.id == request.target_user_id).first()
    reviewed_by = (
        db.query(User).filter(User.id == request.reviewed_by_id).first()
        if request.reviewed_by_id
        else None
    )

    if not requester or not target_user:
        raise HTTPException(status_code=404, detail="Request user information not found.")

    return ChatMemberRequestResponse(
        id=request.id,
        room_id=request.room_id,
        requester=_user_summary(requester),
        target_user=_user_summary(target_user),
        status=request.status,
        requested_at=request.requested_at,
        reviewed_at=request.reviewed_at,
        reviewed_by=_user_summary(reviewed_by) if reviewed_by else None,
    )


def _validate_message_payload(payload: ChatMessageCreate) -> None:
    if payload.message_type not in MESSAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported message type.")

    if payload.message_type in {"text", "emoji"} and not (payload.content or "").strip():
        raise HTTPException(status_code=400, detail="Message content is required.")

    if payload.message_type in {"image", "file"} and not payload.file_url:
        raise HTTPException(status_code=400, detail="File URL is required.")

    if payload.message_type == "location" and (
        payload.location_lat is None or payload.location_lng is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Latitude and longitude are required for location messages.",
        )


def _create_message(
    db: Session,
    room: ChatRoom,
    sender_id: str,
    payload: ChatMessageCreate,
) -> ChatMessage:
    _validate_message_payload(payload)

    message = ChatMessage(
        room_id=room.id,
        sender_id=sender_id,
        message_type=payload.message_type,
        content=(payload.content or "").strip() or None,
        file_url=payload.file_url,
        file_name=payload.file_name,
        location_lat=payload.location_lat,
        location_lng=payload.location_lng,
        location_label=payload.location_label,
    )
    room.updated_at = datetime.utcnow()
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def _build_chat_summary(
    db: Session,
    room: ChatRoom,
    current_user_id: str,
    membership: ChatMember | None = None,
) -> ChatSummaryResponse:
    room_memberships = (
        db.query(ChatMember)
        .options(joinedload(ChatMember.user))
        .filter(ChatMember.room_id == room.id)
        .all()
    )

    if membership is None:
        membership = next(
            (item for item in room_memberships if item.user_id == current_user_id),
            None,
        )

    if not membership:
        raise HTTPException(status_code=403, detail="Access denied.")

    members = [
        ChatMemberSummary(
            user=_user_summary(member.user),
            role=member.role,
            joined_at=member.joined_at,
            last_read_at=member.last_read_at,
        )
        for member in room_memberships
        if member.user
    ]

    chat_name = room.name or "Direct chat"
    if not room.is_group:
        other = next((member for member in room_memberships if member.user_id != current_user_id), None)
        if other and other.user:
            chat_name = _display_name(other.user)

    last_message = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room.id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    serialized_last_message = (
        _serialize_message(db, last_message) if last_message else None
    )

    read_cutoff = membership.last_read_at or datetime.min
    unread_count = (
        db.query(func.count(ChatMessage.id))
        .filter(
            ChatMessage.room_id == room.id,
            ChatMessage.sender_id != current_user_id,
            ChatMessage.created_at > read_cutoff,
        )
        .scalar()
    ) or 0

    return ChatSummaryResponse(
        id=room.id,
        name=chat_name,
        is_group=room.is_group,
        created_at=room.created_at,
        updated_at=room.updated_at,
        unread_count=int(unread_count),
        last_read_at=membership.last_read_at,
        members=members,
        last_message=serialized_last_message,
    )


def _get_user_from_token(db: Session, token: str) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    return user


@router.get("/chat/users", response_model=List[ChatUserSummary])
def list_chat_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = (
        db.query(User)
        .filter(User.id != current_user.id, User.is_active == True)
        .order_by(User.first_name.asc(), User.email.asc())
        .all()
    )
    return [_user_summary(user) for user in users]


@router.get("/chat/chats", response_model=List[ChatSummaryResponse])
def list_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(ChatMember)
        .options(joinedload(ChatMember.room))
        .filter(ChatMember.user_id == current_user.id)
        .all()
    )

    chats = [
        _build_chat_summary(db, membership.room, current_user.id, membership)
        for membership in memberships
        if membership.room
    ]
    chats.sort(
        key=lambda chat: (
            chat.last_message.created_at if chat.last_message else chat.updated_at
        ),
        reverse=True,
    )
    return chats


@router.get("/chat/chats/unread-count", response_model=ChatUnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(ChatMember)
        .filter(ChatMember.user_id == current_user.id)
        .all()
    )
    total = 0
    for membership in memberships:
        read_cutoff = membership.last_read_at or datetime.min
        unread = (
            db.query(func.count(ChatMessage.id))
            .filter(
                ChatMessage.room_id == membership.room_id,
                ChatMessage.sender_id != current_user.id,
                ChatMessage.created_at > read_cutoff,
            )
            .scalar()
        ) or 0
        total += int(unread)
    return ChatUnreadCountResponse(total_unread=total)


@router.post("/chat/direct", response_model=ChatSummaryResponse)
def create_or_open_direct_chat(
    payload: ChatDirectCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create direct chat with yourself.")

    target = (
        db.query(User)
        .filter(User.id == payload.user_id, User.is_active == True)
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    total_members_subquery = (
        db.query(
            ChatMember.room_id.label("room_id"),
            func.count(ChatMember.id).label("member_count"),
        )
        .group_by(ChatMember.room_id)
        .subquery()
    )

    existing_room = (
        db.query(ChatRoom)
        .join(total_members_subquery, total_members_subquery.c.room_id == ChatRoom.id)
        .join(ChatMember, ChatMember.room_id == ChatRoom.id)
        .filter(
            ChatRoom.is_group == False,
            total_members_subquery.c.member_count == 2,
            ChatMember.user_id.in_([current_user.id, target.id]),
        )
        .group_by(ChatRoom.id, total_members_subquery.c.member_count)
        .having(func.count(ChatMember.id) == 2)
        .first()
    )

    if existing_room:
        return _build_chat_summary(db, existing_room, current_user.id)

    room = ChatRoom(
        is_group=False,
        created_by_id=current_user.id,
    )
    db.add(room)
    db.flush()

    now = datetime.utcnow()
    db.add(
        ChatMember(
            room_id=room.id,
            user_id=current_user.id,
            role="member",
            last_read_at=now,
        ),
    )
    db.add(
        ChatMember(
            room_id=room.id,
            user_id=target.id,
            role="member",
            last_read_at=now,
        ),
    )
    db.commit()
    db.refresh(room)
    return _build_chat_summary(db, room, current_user.id)


@router.post("/chat/groups", response_model=ChatSummaryResponse)
def create_group_chat(
    payload: ChatGroupCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member_ids = {member_id for member_id in payload.member_ids if member_id != current_user.id}
    if not member_ids:
        raise HTTPException(status_code=400, detail="Select at least one member.")

    users = (
        db.query(User)
        .filter(User.id.in_(member_ids), User.is_active == True)
        .all()
    )
    if len(users) != len(member_ids):
        raise HTTPException(status_code=400, detail="One or more members are invalid.")

    room = ChatRoom(
        name=payload.name.strip(),
        is_group=True,
        created_by_id=current_user.id,
    )
    db.add(room)
    db.flush()

    db.add(
        ChatMember(
            room_id=room.id,
            user_id=current_user.id,
            role="admin",
            last_read_at=datetime.utcnow(),
        ),
    )
    for user in users:
        db.add(
            ChatMember(
                room_id=room.id,
                user_id=user.id,
                role="member",
                last_read_at=datetime.utcnow(),
            ),
        )

    db.commit()
    db.refresh(room)
    return _build_chat_summary(db, room, current_user.id)


@router.post("/chat/chats/{chat_id}/members", response_model=ChatSummaryResponse)
async def add_chat_member(
    chat_id: str,
    payload: ChatMemberAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = _get_membership_or_404(db, chat_id, current_user.id)
    room = membership.room
    if not room.is_group:
        raise HTTPException(status_code=400, detail="Members can only be added to group chats.")
    if not _is_chat_admin(membership, current_user):
        raise HTTPException(status_code=403, detail="Only chat admins can add members directly.")

    target_user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.is_active == True)
        .first()
    )
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = (
        db.query(ChatMember)
        .filter(ChatMember.room_id == chat_id, ChatMember.user_id == payload.user_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this chat.")

    db.add(
        ChatMember(
            room_id=chat_id,
            user_id=payload.user_id,
            role="member",
            last_read_at=datetime.utcnow(),
        ),
    )
    room.updated_at = datetime.utcnow()
    db.commit()

    summary = _build_chat_summary(db, room, current_user.id)
    member_user_ids = _room_member_user_ids(db, chat_id)
    await manager.send_to_users(
        member_user_ids,
        {
            "type": "chat.members_updated",
            "chat_id": chat_id,
        },
    )
    return summary


@router.post("/chat/chats/{chat_id}/member-requests", response_model=ChatMemberRequestResponse)
async def create_chat_member_request(
    chat_id: str,
    payload: ChatMemberRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = _get_membership_or_404(db, chat_id, current_user.id)
    room = membership.room
    if not room.is_group:
        raise HTTPException(status_code=400, detail="Member requests are available only for group chats.")

    target_user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.is_active == True)
        .first()
    )
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing_member = (
        db.query(ChatMember)
        .filter(ChatMember.room_id == chat_id, ChatMember.user_id == payload.user_id)
        .first()
    )
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this chat.")

    duplicate_pending = (
        db.query(ChatMemberRequest)
        .filter(
            ChatMemberRequest.room_id == chat_id,
            ChatMemberRequest.target_user_id == payload.user_id,
            ChatMemberRequest.status == "pending",
        )
        .first()
    )
    if duplicate_pending:
        raise HTTPException(status_code=400, detail="A pending request already exists for this user.")

    request = ChatMemberRequest(
        room_id=chat_id,
        requester_id=current_user.id,
        target_user_id=payload.user_id,
        status="pending",
    )
    db.add(request)
    room.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)

    admins = (
        db.query(ChatMember.user_id)
        .filter(ChatMember.room_id == chat_id, ChatMember.role == "admin")
        .all()
    )
    admin_user_ids = [row[0] for row in admins]
    if admin_user_ids:
        await manager.send_to_users(
            admin_user_ids,
            {
                "type": "chat.member_request_created",
                "chat_id": chat_id,
                "request_id": request.id,
            },
        )

    return _serialize_member_request(db, request)


@router.get("/chat/chats/{chat_id}/member-requests", response_model=List[ChatMemberRequestResponse])
def list_chat_member_requests(
    chat_id: str,
    status_value: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = _get_membership_or_404(db, chat_id, current_user.id)
    query = db.query(ChatMemberRequest).filter(ChatMemberRequest.room_id == chat_id)

    is_admin = _is_chat_admin(membership, current_user)
    if not is_admin:
        query = query.filter(ChatMemberRequest.requester_id == current_user.id)

    if status_value:
        query = query.filter(ChatMemberRequest.status == status_value.strip().lower())

    rows = query.order_by(ChatMemberRequest.requested_at.desc()).all()
    return [_serialize_member_request(db, row) for row in rows]


@router.post(
    "/chat/chats/{chat_id}/member-requests/{request_id}/review",
    response_model=ChatMemberRequestResponse,
)
async def review_chat_member_request(
    chat_id: str,
    request_id: str,
    payload: ChatMemberRequestReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = _get_membership_or_404(db, chat_id, current_user.id)
    room = membership.room
    if not _is_chat_admin(membership, current_user):
        raise HTTPException(status_code=403, detail="Only chat admins can review member requests.")

    request = (
        db.query(ChatMemberRequest)
        .filter(ChatMemberRequest.id == request_id, ChatMemberRequest.room_id == chat_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Member request not found.")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="This request has already been reviewed.")

    decision = payload.decision.strip().lower()
    request.status = "approved" if decision == "approve" else "rejected"
    request.reviewed_at = datetime.utcnow()
    request.reviewed_by_id = current_user.id

    if request.status == "approved":
        existing_member = (
            db.query(ChatMember)
            .filter(
                ChatMember.room_id == chat_id,
                ChatMember.user_id == request.target_user_id,
            )
            .first()
        )
        if not existing_member:
            db.add(
                ChatMember(
                    room_id=chat_id,
                    user_id=request.target_user_id,
                    role="member",
                    last_read_at=datetime.utcnow(),
                ),
            )

    room.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)

    member_user_ids = _room_member_user_ids(db, chat_id)
    notify_user_ids = list(
        {
            *member_user_ids,
            request.requester_id,
            request.target_user_id,
        }
    )
    await manager.send_to_users(
        notify_user_ids,
        {
            "type": "chat.member_request_reviewed",
            "chat_id": chat_id,
            "request_id": request.id,
            "status": request.status,
        },
    )
    await manager.send_to_users(
        member_user_ids,
        {
            "type": "chat.members_updated",
            "chat_id": chat_id,
        },
    )

    return _serialize_member_request(db, request)


@router.get("/chat/chats/{chat_id}/messages", response_model=List[ChatMessageResponse])
def list_chat_messages(
    chat_id: str,
    limit: int = Query(100, ge=1, le=200),
    before: datetime | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_membership_or_404(db, chat_id, current_user.id)
    query = db.query(ChatMessage).filter(ChatMessage.room_id == chat_id)
    if before:
        query = query.filter(ChatMessage.created_at < before)

    rows = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    rows.reverse()
    return [_serialize_message(db, message) for message in rows]


@router.post("/chat/chats/{chat_id}/upload", response_model=ChatUploadResponse)
def upload_chat_file(
    chat_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_membership_or_404(db, chat_id, current_user.id)
    file_name = save_upload(file, allow_non_image=True)
    return ChatUploadResponse(file_url=f"/uploads/{file_name}", file_name=file.filename or file_name)


@router.post("/chat/chats/{chat_id}/messages", response_model=ChatMessageResponse)
async def create_chat_message(
    chat_id: str,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = _get_membership_or_404(db, chat_id, current_user.id)
    message = _create_message(db, membership.room, current_user.id, payload)
    member_user_ids = _room_member_user_ids(db, chat_id)
    serialized = _serialize_message(db, message)

    await manager.send_to_users(
        member_user_ids,
        {
            "type": "chat.message",
            "chat_id": chat_id,
            "message": serialized.model_dump(mode="json"),
        },
    )
    return serialized


@router.post("/chat/chats/{chat_id}/read", response_model=ChatSummaryResponse)
async def mark_chat_as_read(
    chat_id: str,
    payload: ChatReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = _get_membership_or_404(db, chat_id, current_user.id)
    room = membership.room

    if payload.message_id:
        message = (
            db.query(ChatMessage)
            .filter(ChatMessage.id == payload.message_id, ChatMessage.room_id == chat_id)
            .first()
        )
        if message:
            membership.last_read_at = message.created_at
    else:
        membership.last_read_at = datetime.utcnow()

    db.commit()
    db.refresh(membership)
    summary = _build_chat_summary(db, room, current_user.id, membership)

    member_user_ids = _room_member_user_ids(db, chat_id)
    await manager.send_to_users(
        member_user_ids,
        {
            "type": "chat.read",
            "chat_id": chat_id,
            "user_id": current_user.id,
            "last_read_at": (
                membership.last_read_at.isoformat() if membership.last_read_at else None
            ),
        },
    )
    return summary


@router.websocket("/chat/ws")
async def chat_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    auth_db = SessionLocal()
    try:
        user = _get_user_from_token(auth_db, token)
    except HTTPException:
        auth_db.close()
        await websocket.close(code=1008)
        return
    finally:
        auth_db.close()

    await manager.connect(user.id, websocket)

    try:
        while True:
            payload = await websocket.receive_json()
            event_type = str(payload.get("type") or "").strip().lower()

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if event_type == "send_message":
                raw_message = payload.get("payload") or {}
                db = SessionLocal()
                try:
                    membership = _get_membership_or_404(
                        db,
                        chat_id=str(raw_message.get("chat_id", "")),
                        user_id=user.id,
                    )
                    message_payload = ChatMessageCreate(
                        message_type=str(raw_message.get("message_type") or "text"),
                        content=raw_message.get("content"),
                        file_url=raw_message.get("file_url"),
                        file_name=raw_message.get("file_name"),
                        location_lat=raw_message.get("location_lat"),
                        location_lng=raw_message.get("location_lng"),
                        location_label=raw_message.get("location_label"),
                    )
                    message = _create_message(db, membership.room, user.id, message_payload)
                    recipients = _room_member_user_ids(db, membership.room_id)
                    serialized = _serialize_message(db, message)
                except HTTPException as exc:
                    await websocket.send_json(
                        {"type": "chat.error", "detail": exc.detail},
                    )
                    db.close()
                    continue
                finally:
                    db.close()

                await manager.send_to_users(
                    recipients,
                    {
                        "type": "chat.message",
                        "chat_id": membership.room_id,
                        "message": serialized.model_dump(mode="json"),
                    },
                )
                continue

            if event_type == "mark_read":
                chat_id = str((payload.get("payload") or {}).get("chat_id") or "")
                if not chat_id:
                    continue

                db = SessionLocal()
                try:
                    membership = _get_membership_or_404(db, chat_id, user.id)
                    membership.last_read_at = datetime.utcnow()
                    db.commit()
                    db.refresh(membership)
                    recipients = _room_member_user_ids(db, chat_id)
                finally:
                    db.close()

                await manager.send_to_users(
                    recipients,
                    {
                        "type": "chat.read",
                        "chat_id": chat_id,
                        "user_id": user.id,
                        "last_read_at": membership.last_read_at.isoformat()
                        if membership.last_read_at
                        else None,
                    },
                )
                continue

            await websocket.send_json(
                {"type": "chat.error", "detail": "Unsupported websocket event."},
            )
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
