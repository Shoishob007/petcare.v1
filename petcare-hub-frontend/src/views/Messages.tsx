"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, MapPin, MessageSquare, Paperclip, Plus, Send, Smile, Users, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { resolveApiMediaUrl } from "@/lib/media";
import AnimatedState from "@/src/components/AnimatedState";
import { cn } from "../lib/utils";

type ChatUser = {
    id: string;
    email: string;
    display_name: string;
    profile_image_url?: string | null;
};

type ChatMessage = {
    id: string;
    chat_id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar?: string | null;
    content?: string | null;
    message_type: string;
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
    unread_count: number;
    last_message?: ChatMessage | null;
};

const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const previewMessage = (message?: ChatMessage | null) => {
    if (!message) return "No messages yet";
    if (message.message_type === "image") return "Shared an image";
    if (message.message_type === "file") return `Shared file: ${message.file_name || "Attachment"}`;
    if (message.message_type === "location") return "Shared a location";
    return message.content || "No messages yet";
};

const EMOJIS = ["🐶", "🐱", "❤️", "🙏", "📍", "🩺", "✅", "🎉", "😄", "👍", "🙌", "🌟"];

function resolveAttachment(url?: string | null): string | undefined {
    return resolveApiMediaUrl(url || undefined);
}

export default function Messages() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [ready, setReady] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messageDraft, setMessageDraft] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewType, setPreviewType] = useState<"files" | "location" | null>(null);
    const [previewCaption, setPreviewCaption] = useState("");
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
    const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

    const token = useMemo(() => (ready ? getAuthToken() : null), [ready]);
    const authUser = useMemo(() => (ready ? getAuthUser() : null), [ready]);

    const activeChat = chats.find((chat) => chat.id === activeChatId) || null;
    const activeMessages = activeChatId ? messages[activeChatId] || [] : [];

    useEffect(() => {
        return () => {
            filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [filePreviewUrls]);

    useEffect(() => {
        const localToken = getAuthToken();
        if (!localToken) {
            window.location.href = "/login";
            return;
        }
        setReady(true);
    }, []);

    const loadUsers = async (authToken: string) => {
        const res = await apiFetch("/chat/users", {
            headers: { Authorization: `Bearer ${authToken}` },
            cache: "no-store",
        });
        if (!res.ok) return;
        const payload = (await res.json()) as ChatUser[];
        setUsers(payload || []);
    };

    const loadChats = async (authToken: string) => {
        setLoadingChats(true);
        const res = await apiFetch("/chat/chats", {
            headers: { Authorization: `Bearer ${authToken}` },
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
        setLoadingChats(false);
    };

    const loadMessages = async (chatId: string, authToken: string) => {
        setLoadingMessages(true);
        const res = await apiFetch(`/chat/chats/${chatId}/messages?limit=100`, {
            headers: { Authorization: `Bearer ${authToken}` },
            cache: "no-store",
        });
        if (!res.ok) {
            setLoadingMessages(false);
            throw new Error(`Failed to load messages (${res.status})`);
        }
        const payload = (await res.json()) as ChatMessage[];
        setMessages((prev) => ({ ...prev, [chatId]: payload || [] }));

        await apiFetch(`/chat/chats/${chatId}/read`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message_id: payload[payload.length - 1]?.id || null }),
        });

        setChats((prev) =>
            prev.map((chat) => (chat.id === chatId ? { ...chat, unread_count: 0 } : chat)),
        );
        setLoadingMessages(false);
    };

    useEffect(() => {
        if (!token) return;

        const bootstrap = async () => {
            setError(null);
            try {
                await Promise.all([loadChats(token), loadUsers(token)]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load chat data");
                setLoadingChats(false);
            }
        };

        bootstrap();
    }, [token]);

    useEffect(() => {
        if (!token || !activeChatId) return;
        loadMessages(activeChatId, token).catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load messages");
        });
        setEmojiPickerOpen(false);
    }, [activeChatId, token]);

    const clearPreviewState = () => {
        filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        setFilePreviewUrls([]);
        setPendingFiles([]);
        setPendingLocation(null);
        setPreviewCaption("");
        setPreviewType(null);
        setPreviewDialogOpen(false);
    };

    const createDirectChat = async (userId: string) => {
        if (!token) return;
        setError(null);
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
                throw new Error(`Unable to start chat (${res.status})`);
            }
            const chat = (await res.json()) as ChatSummary;
            setChats((prev) => {
                if (prev.some((entry) => entry.id === chat.id)) return prev;
                return [chat, ...prev];
            });
            setActiveChatId(chat.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to start chat");
        }
    };

    async function uploadFile(chatId: string, file: File, authToken: string) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await apiFetch(`/chat/chats/${chatId}/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}` },
            body: formData,
        });

        if (!res.ok) {
            const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
            throw new Error(payload?.detail || `Upload failed (${res.status})`);
        }

        return (await res.json()) as { file_url: string; file_name: string };
    }

    const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token || !activeChatId || !messageDraft.trim()) return;

        setSubmitting(true);
        setError(null);
        try {
            const res = await apiFetch(`/chat/chats/${activeChatId}/messages`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message_type: "text", content: messageDraft.trim() }),
            });
            if (!res.ok) {
                throw new Error(`Message send failed (${res.status})`);
            }
            const created = (await res.json()) as ChatMessage;
            setMessages((prev) => ({
                ...prev,
                [activeChatId]: [...(prev[activeChatId] || []), created],
            }));
            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === activeChatId ? { ...chat, last_message: created } : chat,
                ),
            );
            setMessageDraft("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Message send failed");
        } finally {
            setSubmitting(false);
        }
    };

    const sendLocation = async () => {
        if (!activeChatId || !token || submitting) return;
        if (!navigator.geolocation) {
            setError("Geolocation is not available in this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position.coords.latitude.toFixed(6));
                const lng = Number(position.coords.longitude.toFixed(6));
                setPendingFiles([]);
                setPendingLocation({ lat, lng, label: `Shared location (${lat}, ${lng})` });
                setPreviewType("location");
                setPreviewCaption("");
                setPreviewDialogOpen(true);
            },
            (geoErr) => {
                setError(geoErr.message || "Unable to access location");
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const openFilePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files || []);
        if (selected.length === 0) return;

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

    const confirmPreviewSend = async () => {
        if (!activeChatId || !token || !previewType || submitting) return;

        setSubmitting(true);
        setError(null);
        try {
            if (previewType === "files" && pendingFiles.length > 0) {
                for (const file of pendingFiles) {
                    const uploaded = await uploadFile(activeChatId, file, token);
                    const messageType = file.type.startsWith("image/") ? "image" : "file";

                    const res = await apiFetch(`/chat/chats/${activeChatId}/messages`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message_type: messageType,
                            file_url: uploaded.file_url,
                            file_name: uploaded.file_name || file.name,
                            content: previewCaption.trim() || (messageType === "file" ? file.name : undefined),
                        }),
                    });

                    if (!res.ok) {
                        const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                        throw new Error(payload?.detail || `Message send failed (${res.status})`);
                    }

                    const created = (await res.json()) as ChatMessage;
                    setMessages((prev) => ({
                        ...prev,
                        [activeChatId]: [...(prev[activeChatId] || []), created],
                    }));
                }
            }

            if (previewType === "location" && pendingLocation) {
                const res = await apiFetch(`/chat/chats/${activeChatId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message_type: "location",
                        content: previewCaption.trim() || undefined,
                        location_lat: pendingLocation.lat,
                        location_lng: pendingLocation.lng,
                        location_label: previewCaption.trim() || pendingLocation.label,
                    }),
                });

                if (!res.ok) {
                    const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                    throw new Error(payload?.detail || `Message send failed (${res.status})`);
                }

                const created = (await res.json()) as ChatMessage;
                setMessages((prev) => ({
                    ...prev,
                    [activeChatId]: [...(prev[activeChatId] || []), created],
                }));
            }

            await loadMessages(activeChatId, token);
            clearPreviewState();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send preview content");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] flex overflow-hidden">
            <aside className="w-full md:w-80 lg:w-96 border-r border-outline-variant/10 bg-surface flex flex-col shrink-0">
                <div className="p-6 space-y-4 border-b border-outline-variant/10">
                    <h1 className="font-headline text-2xl font-extrabold">Live Chat</h1>
                    <p className="text-sm text-on-surface-variant">Secure conversations for care teams and community members.</p>
                </div>

                <div className="px-3 py-3 border-b border-outline-variant/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Chats</p>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                        {loadingChats ? (
                            <AnimatedState
                                title="Syncing conversations"
                                message="Loading chat channels and participants..."
                                emoji="💬"
                                compact
                            />
                        ) : null}
                        {!loadingChats && chats.length === 0 ? (
                            <AnimatedState
                                title="Your inbox is waiting"
                                message="Start a direct chat with someone from the people list."
                                emoji="📨"
                                tone="calm"
                                compact
                            />
                        ) : null}
                        {chats.map((chat) => (
                            <button
                                key={chat.id}
                                type="button"
                                onClick={() => setActiveChatId(chat.id)}
                                className={cn(
                                    "w-full text-left px-3 py-3 rounded-xl border",
                                    activeChatId === chat.id
                                        ? "bg-primary-container border-primary/20 text-on-primary"
                                        : "bg-surface-container-lowest border-outline-variant/20",
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn("font-semibold truncate", activeChatId === chat.id ? "text-on-primary" : "")}>{chat.name}</p>
                                    {chat.unread_count > 0 ? (
                                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", activeChatId === chat.id ? "bg-white/20 text-white" : "bg-primary/20 text-primary")}>
                                            {chat.unread_count}
                                        </span>
                                    ) : null}
                                </div>
                                <p className={cn("text-xs truncate mt-1", activeChatId === chat.id ? "text-white/90" : "text-on-surface-variant")}>
                                    {previewMessage(chat.last_message)}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">People</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => createDirectChat(user.id)}
                                className="w-full text-left px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/30"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{user.display_name}</p>
                                        <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-primary shrink-0" />
                                </div>
                            </button>
                        ))}
                        {users.length === 0 ? (
                            <p className="text-sm text-on-surface-variant px-2">No other users found.</p>
                        ) : null}
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-surface-container-lowest">
                <header className="p-5 border-b border-outline-variant/10 bg-surface/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {activeChat?.is_group ? <Users className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="font-bold">{activeChat?.name || "Select a conversation"}</h2>
                            <p className="text-xs text-on-surface-variant">
                                {activeChat ? "Keep your team aligned in real time" : "Create or open a conversation from the sidebar"}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loadingMessages && activeChatId ? (
                        <AnimatedState
                            title="Opening conversation"
                            message="Messages are being pulled in for this chat."
                            emoji="📡"
                            compact
                        />
                    ) : null}
                    {!activeChatId ? (
                        <AnimatedState
                            title="Pick a conversation"
                            message="Select a chat from the left to start exchanging messages."
                            emoji="🧭"
                            tone="calm"
                        />
                    ) : null}
                    {activeChatId && !loadingMessages && activeMessages.length === 0 ? (
                        <AnimatedState
                            title="Start the first message"
                            message="Share a quick update, drop a photo, or send your location to begin this thread."
                            emoji="✨"
                            tone="calm"
                        />
                    ) : null}

                    {activeMessages.map((message) => {
                        const mine = message.sender_id === authUser?.id;
                        return (
                            <div
                                key={message.id}
                                className={cn("flex", mine ? "justify-end" : "justify-start")}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] px-4 py-3 rounded-2xl",
                                        mine
                                            ? "bg-primary text-on-primary"
                                            : "bg-surface-container-low border border-outline-variant/20",
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {!mine && message.sender_avatar ? (
                                            <img
                                                src={resolveApiMediaUrl(message.sender_avatar)}
                                                alt={message.sender_name}
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        ) : null}
                                        <p className={cn("text-xs font-semibold", mine ? "text-on-primary/80" : "text-on-surface-variant")}>
                                            {mine ? "You" : message.sender_name}
                                        </p>
                                        <span className={cn("text-[10px]", mine ? "text-on-primary/70" : "text-on-surface-variant")}>
                                            {formatTime(message.created_at)}
                                        </span>
                                    </div>

                                    {message.message_type === "location" && message.location_lat !== null && message.location_lng !== null ? (
                                        <a
                                            href={`https://maps.google.com/?q=${message.location_lat},${message.location_lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs mb-2",
                                                mine ? "bg-black/15 text-on-primary" : "bg-surface-container-high text-on-surface",
                                            )}
                                        >
                                            <MapPin className="w-3 h-3" />
                                            {message.location_label || "Open location"}
                                        </a>
                                    ) : null}

                                    {(message.message_type === "image" || message.message_type === "file") && message.file_url ? (
                                        message.message_type === "image" ? (
                                            <a href={resolveAttachment(message.file_url)} target="_blank" rel="noreferrer">
                                                <img
                                                    src={resolveAttachment(message.file_url)}
                                                    alt={message.file_name || "Shared image"}
                                                    className="w-full max-h-64 object-cover rounded-xl mb-2"
                                                />
                                            </a>
                                        ) : (
                                            <a
                                                href={resolveAttachment(message.file_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={cn(
                                                    "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs mb-2",
                                                    mine ? "bg-black/15 text-on-primary" : "bg-surface-container-high text-on-surface",
                                                )}
                                            >
                                                <Paperclip className="w-3 h-3" />
                                                {message.file_name || "Download file"}
                                            </a>
                                        )
                                    ) : null}

                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content || (message.message_type === "text" ? "" : "")}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={sendMessage} className="p-5 border-t border-outline-variant/10 bg-surface/60">
                    {error ? <p className="text-sm text-error mb-2">{error}</p> : null}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setEmojiPickerOpen((prev) => !prev)}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold inline-flex items-center gap-1"
                        >
                            <Smile className="w-3 h-3" /> Emoji
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            multiple
                            className="hidden"
                            onChange={openFilePreview}
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold inline-flex items-center gap-1"
                            disabled={!activeChatId || submitting}
                        >
                            <ImagePlus className="w-3 h-3" /> Files
                        </button>

                        <button
                            type="button"
                            onClick={sendLocation}
                            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold inline-flex items-center gap-1"
                            disabled={!activeChatId || submitting}
                        >
                            <MapPin className="w-3 h-3" /> Location
                        </button>
                    </div>

                    {emojiPickerOpen ? (
                        <div className="mb-2 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap gap-1">
                            {EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className="px-2 py-1 rounded-lg hover:bg-surface-container-high"
                                    onClick={() => {
                                        setMessageDraft((prev) => `${prev}${emoji}`);
                                        setEmojiPickerOpen(false);
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            placeholder={activeChatId ? "Type a message" : "Select a chat first"}
                            className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={!activeChatId || submitting}
                        />
                        <button
                            type="submit"
                            className="bg-primary text-on-primary h-11 px-4 rounded-xl font-semibold disabled:opacity-60 inline-flex items-center gap-2"
                            disabled={!activeChatId || !messageDraft.trim() || submitting}
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? "Sending" : "Send"}
                        </button>
                    </div>
                </form>
            </main>

            {previewDialogOpen ? (
                <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-headline text-xl font-bold">{previewType === "location" ? "Preview location" : "Preview attachments"}</h3>
                            <button type="button" onClick={clearPreviewState} className="text-on-surface-variant">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {previewType === "files" ? (
                            <div className="space-y-3 mb-4">
                                <p className="text-sm text-on-surface-variant">{pendingFiles.length} file(s) ready to send</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {filePreviewUrls.length > 0 ? (
                                        filePreviewUrls.map((url) => (
                                            <img key={url} src={url} alt="Attachment preview" className="w-full h-24 object-cover rounded-lg" />
                                        ))
                                    ) : (
                                        pendingFiles.map((file) => (
                                            <div key={`${file.name}-${file.size}`} className="rounded-lg border border-outline-variant/20 p-2 text-xs flex items-center gap-2">
                                                <Paperclip className="w-3 h-3" /> {file.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {previewType === "location" && pendingLocation ? (
                            <a
                                href={`https://maps.google.com/?q=${pendingLocation.lat},${pendingLocation.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-primary font-semibold mb-4"
                            >
                                <MapPin className="w-4 h-4" /> {pendingLocation.label}
                            </a>
                        ) : null}

                        <textarea
                            value={previewCaption}
                            onChange={(e) => setPreviewCaption(e.target.value)}
                            rows={3}
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 mb-4"
                            placeholder={previewType === "location" ? "Add context for this location..." : "Add a caption..."}
                        />

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={clearPreviewState} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm">Cancel</button>
                            <button
                                type="button"
                                onClick={confirmPreviewSend}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold"
                                disabled={submitting}
                            >
                                {submitting ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
