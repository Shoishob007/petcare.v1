"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ImagePlus,
  MapPin,
  MessageSquare,
  Paperclip,
  Send,
  Smile,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import Dialog from "../components/Dialog";
import PawLoader from "../components/PawLoader";
import Button from "../components/Button";
import { Avatar } from "../components/shared/Avatar";
import { useToast } from "../components/Toast";
import { apiFetch } from "../lib/api";
import { getAuthToken, getAuthUser, resolveAuthImageUrl } from "../lib/auth";

type ChatUserSummary = {
  id: string;
  email: string;
  display_name: string;
  profile_image_url?: string | null;
  role?: string | null;
};

type ChatMemberSummary = {
  user: ChatUserSummary;
  role: string;
  joined_at: string;
  last_read_at?: string | null;
};

type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  message_type: string;
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_label?: string | null;
  created_at: string;
};

type ChatSummary = {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_read_at?: string | null;
  members: ChatMemberSummary[];
  last_message?: ChatMessage | null;
};

type ChatMemberRequest = {
  id: string;
  room_id: string;
  requester: ChatUserSummary;
  target_user: ChatUserSummary;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at?: string | null;
  reviewed_by?: ChatUserSummary | null;
};

const API_ROOTS = [
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
].filter((root, index, arr) => Boolean(root) && arr.indexOf(root) === index);

const WS_ROOTS = API_ROOTS.map((root) =>
  root.startsWith("https://")
    ? root.replace("https://", "wss://")
    : root.replace("http://", "ws://"),
);

const EMOJIS = ["🐶", "🐱", "❤️", "🙏", "📍", "🩺", "✅", "🎉", "😄", "👍", "🙌", "🌟"];

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });

const emitChatUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("petcare-chat-updated"));
};

export default function ChatPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const chatThreadRef = useRef<HTMLDivElement | null>(null);

  const [authReady, setAuthReady] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const [users, setUsers] = useState<ChatUserSummary[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"chats" | "people">("chats");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewType, setPreviewType] = useState<"files" | "location" | null>(null);
  const [previewCaption, setPreviewCaption] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<Set<string>>(new Set());
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberTargetId, setMemberTargetId] = useState("");
  const [submittingMemberAction, setSubmittingMemberAction] = useState(false);
  const [memberRequests, setMemberRequests] = useState<ChatMemberRequest[]>([]);
  const [loadingMemberRequests, setLoadingMemberRequests] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);

  const authUser = useMemo(() => getAuthUser(), [authReady]);
  const token = useMemo(() => getAuthToken(), [authReady]);
  const currentUserId = authUser?.id || "";

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;
  const activeMessages = activeChatId ? messagesByChat[activeChatId] || [] : [];
  const activeMembership =
    activeChat?.members.find((member) => member.user.id === currentUserId) || null;
  const isPlatformAdmin = (authUser?.role || "user").toLowerCase() === "admin";
  const canAdminActiveChat =
    Boolean(activeChat?.is_group) &&
    (isPlatformAdmin || (activeMembership?.role || "").toLowerCase() === "admin");

  const availableUsersForActiveChat = useMemo(() => {
    if (!activeChat) return [];
    const memberIds = new Set(activeChat.members.map((member) => member.user.id));
    return users.filter((user) => user.id !== currentUserId && !memberIds.has(user.id));
  }, [activeChat, users, currentUserId]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!chatThreadRef.current) return;
    chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
  }, [activeChatId, activeMessages.length, loadingMessages]);

  useEffect(() => {
    setEmojiPickerOpen(false);
  }, [activeChatId]);

  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviewUrls]);

  const filteredUsers = useMemo(() => {
    const term = peopleSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const haystack = `${user.display_name} ${user.email}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [users, peopleSearch]);

  useEffect(() => {
    const localToken = getAuthToken();
    if (!localToken) {
      window.location.href = "/login";
      return;
    }
    setAuthReady((prev) => !prev);
  }, []);

  useEffect(() => {
    const syncAuthState = () => setAuthReady((prev) => !prev);
    window.addEventListener("petcare-auth-updated", syncAuthState);
    return () => {
      window.removeEventListener("petcare-auth-updated", syncAuthState);
    };
  }, []);

  const upsertMessage = (chatId: string, message: ChatMessage) => {
    setMessagesByChat((prev) => {
      const current = prev[chatId] || [];
      if (current.some((entry) => entry.id === message.id)) {
        return prev;
      }
      return { ...prev, [chatId]: [...current, message] };
    });
  };

  const updateChatSummary = (chatId: string, updater: (chat: ChatSummary) => ChatSummary) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? updater(chat) : chat)),
    );
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/chat/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const payload = (await res.json()) as ChatUserSummary[];
      setUsers(payload || []);
    } catch {
      // User list failures should not block the chat view.
    }
  };

  const loadChats = async () => {
    if (!token) return;
    setLoadingChats(true);
    try {
      const res = await apiFetch("/chat/chats", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load chats (${res.status})`);
      }
      const payload = (await res.json()) as ChatSummary[];
      setChats(payload || []);
      if (!activeChatId && payload.length > 0) {
        setActiveChatId(payload[0].id);
      }
      emitChatUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load chats");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/chat/chats/${chatId}/messages?limit=150`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load messages (${res.status})`);
      }
      const payload = (await res.json()) as ChatMessage[];
      setMessagesByChat((prev) => ({ ...prev, [chatId]: payload || [] }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (chatId: string, messageId?: string) => {
    if (!token) return;
    try {
      const res = await apiFetch(`/chat/chats/${chatId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message_id: messageId || null }),
      });
      if (!res.ok) return;
      const summary = (await res.json()) as ChatSummary;
      updateChatSummary(chatId, () => summary);
      emitChatUpdate();
    } catch {
      // Mark-as-read failures are non-blocking.
    }
  };

  const resolveUploadUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) {
      return `${API_ROOTS[0]}${url}`;
    }
    return url;
  };

  const clearPreviewState = () => {
    filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setFilePreviewUrls([]);
    setPendingFiles([]);
    setPendingLocation(null);
    setPreviewCaption("");
    setPreviewType(null);
    setPreviewDialogOpen(false);
  };

  const getOwnMessageStatus = (message: ChatMessage, chat: ChatSummary) => {
    const others = chat.members.filter((member) => member.user.id !== currentUserId);
    if (others.length === 0) return "sent";
    const createdAt = new Date(message.created_at).getTime();
    const fullyRead = others.every(
      (member) =>
        member.last_read_at && new Date(member.last_read_at).getTime() >= createdAt,
    );
    if (fullyRead) return "read";
    if (socketConnected) return "delivered";
    return "sent";
  };

  const getLastMessageLabel = (chat: ChatSummary) => {
    if (!chat.last_message) return "No messages yet";
    const item = chat.last_message;
    const prefix = item.sender_id === currentUserId ? "You: " : `${item.sender_name}: `;
    if (item.message_type === "location") return `${prefix}Shared location`;
    if (item.message_type === "image") return `${prefix}Image`;
    if (item.message_type === "file") return `${prefix}${item.file_name || "File"}`;
    return `${prefix}${item.content || "New message"}`;
  };

  const sendMessage = async (chatId: string, payload: Record<string, unknown>) => {
    if (!token) return null;
    const res = await apiFetch(`/chat/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `Message send failed (${res.status})`);
    }
    return (await res.json()) as ChatMessage;
  };

  const uploadFile = async (chatId: string, file: File) => {
    if (!token) return null;
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch(`/chat/chats/${chatId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `Upload failed (${res.status})`);
    }
    return (await res.json()) as { file_url: string; file_name: string };
  };

  const handleSendText = async () => {
    if (!activeChatId || !composer.trim() || sending) return;
    setSending(true);
    try {
      const message = await sendMessage(activeChatId, {
        message_type: "text",
        content: composer.trim(),
      });
      if (message) {
        upsertMessage(activeChatId, message);
        updateChatSummary(activeChatId, (chat) => ({
          ...chat,
          last_message: message,
          updated_at: message.created_at,
        }));
      }
      setComposer("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (!activeChatId || selected.length === 0) return;

    filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    const previews = selected
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));
    setFilePreviewUrls(previews);
    setPendingFiles(selected);
    setPendingLocation(null);
    setPreviewType("files");
    setPreviewCaption("");
    setPreviewDialogOpen(true);
    event.target.value = "";
  };

  const handleSendLocation = async () => {
    if (!activeChatId || sending) return;
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setPendingLocation({
          lat,
          lng,
          label: `Shared location (${lat}, ${lng})`,
        });
        setPendingFiles([]);
        setPreviewType("location");
        setPreviewCaption("");
        setPreviewDialogOpen(true);
      },
      (error) => {
        toast.error(error.message || "Unable to access your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleConfirmPreviewSend = async () => {
    if (!activeChatId || !previewType || sending) return;
    setSending(true);
    try {
      if (previewType === "files" && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const uploaded = await uploadFile(activeChatId, file);
          if (!uploaded) continue;
          const messageType = file.type.startsWith("image/") ? "image" : "file";
          const message = await sendMessage(activeChatId, {
            message_type: messageType,
            file_url: uploaded.file_url,
            file_name: uploaded.file_name || file.name,
            content: previewCaption.trim() || (messageType === "file" ? file.name : undefined),
          });
          if (message) {
            upsertMessage(activeChatId, message);
            updateChatSummary(activeChatId, (chat) => ({
              ...chat,
              last_message: message,
              updated_at: message.created_at,
            }));
          }
        }
      }

      if (previewType === "location" && pendingLocation) {
        const message = await sendMessage(activeChatId, {
          message_type: "location",
          content: previewCaption.trim() || undefined,
          location_lat: pendingLocation.lat,
          location_lng: pendingLocation.lng,
          location_label:
            previewCaption.trim() || pendingLocation.label || "Shared location",
        });
        if (message) {
          upsertMessage(activeChatId, message);
          updateChatSummary(activeChatId, (chat) => ({
            ...chat,
            last_message: message,
            updated_at: message.created_at,
          }));
        }
      }

      clearPreviewState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send preview content");
    } finally {
      setSending(false);
    }
  };

  const openDirectChat = async (userId: string) => {
    if (!token) return;
    try {
      const res = await apiFetch("/chat/direct", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Unable to start chat (${res.status})`);
      }
      const chat = (await res.json()) as ChatSummary;
      setChats((prev) => {
        const exists = prev.some((entry) => entry.id === chat.id);
        if (exists) {
          return prev.map((entry) => (entry.id === chat.id ? chat : entry));
        }
        return [chat, ...prev];
      });
      setActiveChatId(chat.id);
      setSidebarTab("chats");
      emitChatUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start direct chat");
    }
  };

  const handleCreateGroup = async () => {
    if (!token || creatingGroup) return;
    if (!groupName.trim()) {
      toast.error("Group name is required.");
      return;
    }
    if (groupMemberIds.size === 0) {
      toast.error("Select at least one member.");
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await apiFetch("/chat/groups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName.trim(),
          member_ids: Array.from(groupMemberIds),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Group creation failed (${res.status})`);
      }
      const chat = (await res.json()) as ChatSummary;
      setChats((prev) => [chat, ...prev.filter((entry) => entry.id !== chat.id)]);
      setActiveChatId(chat.id);
      setGroupDialogOpen(false);
      setGroupName("");
      setGroupMemberIds(new Set());
      emitChatUpdate();
      toast.success("Group created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const loadMemberRequests = async (chatId: string) => {
    if (!token) return;
    setLoadingMemberRequests(true);
    try {
      const query = canAdminActiveChat ? "?status=pending" : "";
      const res = await apiFetch(`/chat/chats/${chatId}/member-requests${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Failed to load requests (${res.status})`);
      }
      const payload = (await res.json()) as ChatMemberRequest[];
      setMemberRequests(payload || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load member requests");
    } finally {
      setLoadingMemberRequests(false);
    }
  };

  const handleMemberAction = async () => {
    if (!activeChatId || !activeChat?.is_group || !memberTargetId || submittingMemberAction) {
      return;
    }

    setSubmittingMemberAction(true);
    try {
      if (canAdminActiveChat) {
        const res = await apiFetch(`/chat/chats/${activeChatId}/members`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: memberTargetId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || `Unable to add member (${res.status})`);
        }
        const summary = (await res.json()) as ChatSummary;
        updateChatSummary(activeChatId, () => summary);
        toast.success("Team member added.");
      } else {
        const res = await apiFetch(`/chat/chats/${activeChatId}/member-requests`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: memberTargetId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || `Unable to submit request (${res.status})`);
        }
        toast.success("Request submitted. Awaiting admin approval.");
      }

      setMemberDialogOpen(false);
      setMemberTargetId("");
      loadChats();
      if (activeChatId) {
        loadMessages(activeChatId);
        loadMemberRequests(activeChatId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Member action failed");
    } finally {
      setSubmittingMemberAction(false);
    }
  };

  const handleReviewRequest = async (
    requestId: string,
    decision: "approve" | "reject",
  ) => {
    if (!activeChatId || !canAdminActiveChat) return;
    setReviewingRequestId(requestId);
    try {
      const res = await apiFetch(
        `/chat/chats/${activeChatId}/member-requests/${requestId}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decision }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Unable to review request (${res.status})`);
      }
      await loadChats();
      await loadMemberRequests(activeChatId);
      toast.success(decision === "approve" ? "Request approved." : "Request rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review request");
    } finally {
      setReviewingRequestId(null);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadUsers();
    loadChats();
  }, [token]);

  useEffect(() => {
    if (!activeChatId || !token) return;
    loadMessages(activeChatId).then(() => markAsRead(activeChatId));
    if (activeChat?.is_group) {
      loadMemberRequests(activeChatId);
    } else {
      setMemberRequests([]);
    }
  }, [activeChatId, token]);

  useEffect(() => {
    if (!token || !currentUserId) return;
    let reconnectTimer: number | null = null;
    let currentIndex = 0;
    let closedManually = false;

    const connect = () => {
      const root = WS_ROOTS[currentIndex % WS_ROOTS.length];
      const socket = new WebSocket(
        `${root}/api/v1/chat/ws?token=${encodeURIComponent(token)}`,
      );
      websocketRef.current = socket;
      socket.onopen = () => {
        setSocketConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            chat_id?: string;
            message?: ChatMessage;
            user_id?: string;
            last_read_at?: string;
          };

          if (payload.type === "chat.message" && payload.chat_id && payload.message) {
            const chatId = payload.chat_id;
            const message = payload.message;
            const isActiveChat = activeChatIdRef.current === chatId;
            const fromCurrentUser = message.sender_id === currentUserId;
            let chatExists = false;

            upsertMessage(chatId, message);
            setChats((prev) => {
              chatExists = prev.some((chat) => chat.id === chatId);
              return prev.map((chat) =>
                chat.id === chatId
                  ? {
                    ...chat,
                    last_message: message,
                    updated_at: message.created_at,
                    unread_count:
                      !isActiveChat && !fromCurrentUser
                        ? (chat.unread_count || 0) + 1
                        : chat.unread_count || 0,
                  }
                  : chat,
              );
            });
            if (!chatExists) {
              loadChats();
            }
            if (isActiveChat && !fromCurrentUser) {
              markAsRead(chatId, message.id);
            } else {
              emitChatUpdate();
            }
          }

          if (payload.type === "chat.read" && payload.chat_id && payload.user_id) {
            updateChatSummary(payload.chat_id, (chat) => ({
              ...chat,
              unread_count:
                payload.user_id === currentUserId ? 0 : chat.unread_count,
              last_read_at:
                payload.user_id === currentUserId
                  ? payload.last_read_at || new Date().toISOString()
                  : chat.last_read_at,
              members: chat.members.map((member) =>
                member.user.id === payload.user_id
                  ? { ...member, last_read_at: payload.last_read_at || null }
                  : member,
              ),
            }));
            if (payload.user_id === currentUserId) {
              emitChatUpdate();
            }
          }

          if (
            payload.type === "chat.members_updated" ||
            payload.type === "chat.member_request_created" ||
            payload.type === "chat.member_request_reviewed"
          ) {
            loadChats();
            if (activeChatIdRef.current === payload.chat_id && payload.chat_id) {
              loadMessages(payload.chat_id);
              loadMemberRequests(payload.chat_id);
            }
          }
        } catch {
          // Ignore malformed websocket payloads.
        }
      };

      socket.onclose = () => {
        setSocketConnected(false);
        if (closedManually) return;
        currentIndex += 1;
        reconnectTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      closedManually = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      websocketRef.current?.close();
    };
  }, [token, currentUserId]);

  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="community-hero">
          <div className="community-hero-content">
            <div>
              <p className="eyebrow">Real-time chat</p>
              <h1>Coordinate care with instant messages, files, and locations.</h1>
              <p className="subtext">
                Send text, emojis, attachments, and live location updates in direct
                or group conversations.
              </p>
            </div>
          </div>
        </header>

        <section className="panel panel-spaced chat-shell">
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <div>
                <h2>Chats</h2>
                <p className="subtext">{chats.length} conversations</p>
              </div>
              <Button type="button" size="sm" onClick={() => setGroupDialogOpen(true)}>
                <Users className="w-4 h-4 mr-1" />
                New group
              </Button>
            </div>
            <div className="chat-sidebar-tabs">
              <button
                type="button"
                className={`chat-sidebar-tab ${sidebarTab === "chats" ? "active" : ""}`}
                onClick={() => setSidebarTab("chats")}
              >
                Chats
              </button>
              <button
                type="button"
                className={`chat-sidebar-tab ${sidebarTab === "people" ? "active" : ""}`}
                onClick={() => setSidebarTab("people")}
              >
                People
              </button>
            </div>

            {sidebarTab === "chats" ? (
              <div className="chat-room-list">
                {loadingChats ? (
                  <PawLoader label="Loading chats" />
                ) : chats.length === 0 ? (
                  <p className="subtext">No conversations yet.</p>
                ) : (
                  chats.map((chat) => {
                    const active = chat.id === activeChatId;
                    const hasUnread = chat.unread_count > 0;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        className={`chat-room-item ${active ? "active" : ""} ${hasUnread ? "unread" : ""
                          }`}
                        onClick={() => setActiveChatId(chat.id)}
                      >
                        <div className="chat-room-head">
                          <strong>{chat.name}</strong>
                          <span>{formatDate(chat.updated_at)}</span>
                        </div>
                        <div className="chat-room-preview">
                          <span>{getLastMessageLabel(chat)}</span>
                          {hasUnread ? (
                            <span className="chat-unread-badge">
                              {chat.unread_count > 99 ? "99+" : chat.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="chat-people-panel">
                <label className="chat-people-search">
                  Search people
                  <input
                    type="search"
                    placeholder="Name or email..."
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                  />
                </label>
                <div className="chat-people-list">
                  {filteredUsers.length === 0 ? (
                    <p className="subtext">No people found.</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="chat-person-item"
                        onClick={() => openDirectChat(user.id)}
                      >
                        <Avatar
                          src={resolveAuthImageUrl(user.profile_image_url)}
                          name={user.display_name}
                          size="sm"
                        />
                        <span className="chat-person-meta">
                          <strong>{user.display_name}</strong>
                          <small>{user.email}</small>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="chat-main">
            {!activeChat ? (
              <div className="chat-empty">
                <MessageSquare className="w-10 h-10" />
                <h3>Select a conversation</h3>
                <p>Open an existing chat or start one from the People tab.</p>
              </div>
            ) : (
              <>
                <div className="chat-main-header">
                  <div>
                    <h3>{activeChat.name}</h3>
                    <p className="subtext">
                      {activeChat.is_group
                        ? `${activeChat.members.length} participants`
                        : "Direct conversation"}
                    </p>
                  </div>
                  <div className="chat-main-header-actions">
                    {activeChat.is_group ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="chat-action-btn"
                        onClick={() => setMemberDialogOpen(true)}
                      >
                        <UserPlus className="w-4 h-4" />
                        Add team member
                      </Button>
                    ) : null}
                    <span className="chat-members">
                      <Users className="w-4 h-4" />
                      {activeChat.members.length}
                    </span>
                  </div>
                </div>

                <div className="chat-thread" ref={chatThreadRef}>
                  {loadingMessages ? (
                    <PawLoader label="Loading messages" />
                  ) : activeMessages.length === 0 ? (
                    <p className="subtext">No messages yet. Say hello.</p>
                  ) : (
                    activeMessages.map((message) => {
                      const isMine = message.sender_id === currentUserId;
                      const unread =
                        !isMine &&
                        activeChat.last_read_at &&
                        new Date(message.created_at) > new Date(activeChat.last_read_at);
                      const attachmentUrl = resolveUploadUrl(message.file_url);
                      const senderName = isMine
                        ? authUser?.first_name || authUser?.username || authUser?.email || "You"
                        : message.sender_name;
                      const senderAvatar = resolveAuthImageUrl(
                        isMine
                          ? authUser?.profile_image_url || authUser?.avatar_url || authUser?.image_url
                          : message.sender_avatar,
                      );
                      const ownStatus = isMine
                        ? getOwnMessageStatus(message, activeChat)
                        : null;

                      return (
                        <div key={message.id} className={`chat-msg-row ${isMine ? "own" : ""}`}>
                          <Avatar src={senderAvatar} name={senderName} size="sm" />
                          <article
                            className={`chat-msg ${isMine ? "own" : ""} ${unread ? "unread" : ""
                              }`}
                          >
                            <div className="chat-msg-meta">
                              <span>{senderName}</span>
                              <span>{formatTime(message.created_at)}</span>
                            </div>

                            {message.message_type === "location" ? (
                              <a
                                className="chat-location"
                                href={`https://maps.google.com/?q=${message.location_lat},${message.location_lng}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {message.location_label || "Open shared location"}
                                </span>
                              </a>
                            ) : null}

                            {(message.message_type === "image" || message.message_type === "file") &&
                              attachmentUrl ? (
                              message.message_type === "image" ? (
                                <a href={attachmentUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={attachmentUrl}
                                    alt={message.file_name || "Shared image"}
                                    className="chat-image"
                                  />
                                </a>
                              ) : (
                                <a
                                  className="chat-file"
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Paperclip className="w-4 h-4" />
                                  {message.file_name || "Download file"}
                                </a>
                              )
                            ) : null}

                            {message.content ? <p>{message.content}</p> : null}

                            {ownStatus ? (
                              <div className={`chat-msg-status ${ownStatus}`}>
                                {ownStatus === "read"
                                  ? "✓✓ Read"
                                  : ownStatus === "delivered"
                                    ? "✓✓ Delivered"
                                    : "✓ Sent"}
                              </div>
                            ) : null}
                          </article>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="chat-compose">
                  <div className="chat-compose-toolbar">
                    <div className="chat-compose-left-actions">
                      <button
                        type="button"
                        className="chat-emoji-trigger"
                        onClick={() => setEmojiPickerOpen((prev) => !prev)}
                        aria-label="Open emoji picker"
                      >
                        <Smile className="w-4 h-4" />
                        Emoji
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        multiple
                        className="hidden"
                        onChange={handleSendFiles}
                      />
                      <Button
                        variant="ghost"
                        type="button"
                        className="chat-action-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                      >
                        <ImagePlus className="w-4 h-4" />
                        Files
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        className="chat-action-btn"
                        onClick={handleSendLocation}
                        disabled={sending}
                      >
                        <MapPin className="w-4 h-4" />
                        Location
                      </Button>
                    </div>

                    <Button
                      type="button"
                      className="chat-action-btn"
                      onClick={handleSendText}
                      disabled={sending}
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>

                  {emojiPickerOpen ? (
                    <div className="chat-emoji-popover">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setComposer((prev) => `${prev}${emoji}`);
                            setEmojiPickerOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    rows={3}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={memberDialogOpen}
        title={canAdminActiveChat ? "Add team member" : "Request new team member"}
        onClose={() => {
          setMemberDialogOpen(false);
          setMemberTargetId("");
        }}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setMemberDialogOpen(false);
                setMemberTargetId("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleMemberAction}
              disabled={!memberTargetId || submittingMemberAction}
            >
              {submittingMemberAction
                ? canAdminActiveChat
                  ? "Adding..."
                  : "Submitting..."
                : canAdminActiveChat
                  ? "Add member"
                  : "Submit for approval"}
            </Button>
          </div>
        }
      >
        <div className="form-grid">
          <label>
            Select teammate
            <select
              value={memberTargetId}
              onChange={(e) => setMemberTargetId(e.target.value)}
            >
              <option value="">Select a user</option>
              {availableUsersForActiveChat.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name} ({user.email})
                </option>
              ))}
            </select>
          </label>

          {!canAdminActiveChat ? (
            <p className="subtext">
              Your request is sent to a chat admin and is added only after approval.
            </p>
          ) : null}

          {canAdminActiveChat ? (
            <div className="chat-member-requests">
              <h4>Pending approval requests</h4>
              {loadingMemberRequests ? (
                <p className="subtext">Loading requests...</p>
              ) : memberRequests.length === 0 ? (
                <p className="subtext">No pending requests.</p>
              ) : (
                memberRequests.map((request) => (
                  <div key={request.id} className="chat-member-request-item">
                    <div>
                      <strong>{request.target_user.display_name}</strong>
                      <p className="subtext">
                        Requested by {request.requester.display_name}
                      </p>
                    </div>
                    <div className="chat-member-request-actions">
                      <Button
                        type="button"
                        variant="ghost"
                        className="chat-action-btn"
                        onClick={() => handleReviewRequest(request.id, "approve")}
                        disabled={reviewingRequestId === request.id}
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="chat-action-btn"
                        onClick={() => handleReviewRequest(request.id, "reject")}
                        disabled={reviewingRequestId === request.id}
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={groupDialogOpen}
        title="Create group chat"
        onClose={() => setGroupDialogOpen(false)}
        footer={
          <div className="form-actions">
            <Button variant="ghost" type="button" onClick={() => setGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateGroup} disabled={creatingGroup}>
              {creatingGroup ? <PawLoader label="Creating" size="sm" /> : "Create group"}
            </Button>
          </div>
        }
      >
        <div className="form-grid">
          <label>
            Group name
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Care Team Night Shift"
            />
          </label>
          <div className="chat-group-members">
            {users.map((user) => {
              const selected = groupMemberIds.has(user.id);
              return (
                <label key={user.id} className="chat-group-member">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      setGroupMemberIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) {
                          next.add(user.id);
                        } else {
                          next.delete(user.id);
                        }
                        return next;
                      })
                    }
                  />
                  <Avatar
                    src={resolveAuthImageUrl(user.profile_image_url)}
                    name={user.display_name}
                    size="sm"
                  />
                  <span>{user.display_name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={previewDialogOpen}
        title={
          previewType === "location"
            ? "Preview location message"
            : "Preview attachment"
        }
        onClose={clearPreviewState}
        footer={
          <div className="form-actions">
            <Button variant="ghost" type="button" onClick={clearPreviewState}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmPreviewSend} disabled={sending}>
              {sending ? <PawLoader label="Sending" size="sm" /> : "Send"}
            </Button>
          </div>
        }
      >
        <div className="form-grid">
          {previewType === "files" && pendingFiles.length > 0 ? (
            <div className="chat-preview-block">
              <p className="subtext">{pendingFiles.length} file(s) ready to send</p>
              <div className="chat-preview-media">
                {filePreviewUrls.length > 0 ? (
                  filePreviewUrls.slice(0, 6).map((url) => (
                    <img key={url} src={url} alt="Attachment preview" />
                  ))
                ) : (
                  pendingFiles.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="chat-preview-file">
                      <Paperclip className="w-4 h-4" />
                      <span>{file.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {previewType === "location" && pendingLocation ? (
            <div className="chat-preview-block">
              <a
                className="chat-location"
                href={`https://maps.google.com/?q=${pendingLocation.lat},${pendingLocation.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="w-4 h-4" />
                <span>{pendingLocation.label}</span>
              </a>
            </div>
          ) : null}

          <label>
            Message / caption
            <textarea
              rows={3}
              value={previewCaption}
              onChange={(e) => setPreviewCaption(e.target.value)}
              placeholder={
                previewType === "location"
                  ? "Add context for this location..."
                  : "Add a caption for attachments..."
              }
            />
          </label>
        </div>
      </Dialog>

      <SiteFooter />
    </main>
  );
}
