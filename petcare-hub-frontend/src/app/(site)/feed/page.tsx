"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, PencilLine, Send, Shield, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { resolveApiMediaUrl } from "@/lib/media";
import AnimatedState from "@/src/components/AnimatedState";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import MediaMosaic from "@/src/components/MediaMosaic";

type UpdateImage = {
    id: string;
    url: string;
};

type CommunityComment = {
    id: string;
    item_id: string;
    body: string;
    author_name?: string | null;
    parent_id?: string | null;
    created_at: string;
};

type CommunityPost = {
    id: string;
    item_type: "community";
    title: string;
    content?: string | null;
    category?: string | null;
    author_name?: string | null;
    tags?: string | null;
    image_url?: string | null;
    images: UpdateImage[];
    comments?: CommunityComment[];
    reaction_count: number;
    created_at: string;
};

const PAGE_SIZE = 10;

function extractPosts(payload: unknown): CommunityPost[] {
    if (Array.isArray(payload)) return payload as CommunityPost[];
    if (payload && typeof payload === "object" && "items" in payload) {
        return ((payload as { items?: unknown }).items || []) as CommunityPost[];
    }
    if (payload && typeof payload === "object" && "data" in payload) {
        return ((payload as { data?: unknown }).data || []) as CommunityPost[];
    }
    return [];
}

function mediaForPost(post: CommunityPost): string[] {
    const gallery = (post.images || [])
        .map((image) => resolveApiMediaUrl(image.url))
        .filter(Boolean) as string[];
    const featured = resolveApiMediaUrl(post.image_url);
    if (!featured) return gallery;
    if (gallery.includes(featured)) return gallery;
    return [featured, ...gallery];
}

function prettyDate(date: string): string {
    return new Date(date).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function parseThreads(comments: CommunityComment[]) {
    const roots: CommunityComment[] = [];
    const repliesByParent: Record<string, CommunityComment[]> = {};

    for (const comment of comments) {
        if (comment.parent_id) {
            repliesByParent[comment.parent_id] = repliesByParent[comment.parent_id] || [];
            repliesByParent[comment.parent_id].push(comment);
        } else {
            roots.push(comment);
        }
    }

    roots.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    Object.values(repliesByParent).forEach((list) =>
        list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    );

    return roots.map((root) => ({ root, replies: repliesByParent[root.id] || [] }));
}

export default function FeedPage() {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [category, setCategory] = useState("general");
    const [tags, setTags] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [publishing, setPublishing] = useState(false);

    const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
    const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
    const [commentBusyByPost, setCommentBusyByPost] = useState<Record<string, boolean>>({});
    const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
    const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
    const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>({});

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const authUser = getAuthUser();
    const token = getAuthToken();
    const isAdmin = (authUser?.role || "user").toLowerCase() === "admin";

    const categoryOptions = useMemo(() => ["general", "tip", "adoption", "event", "volunteer"], []);

    const mediaByPost = useMemo(() => {
        const map: Record<string, string[]> = {};
        for (const post of posts) map[post.id] = mediaForPost(post);
        return map;
    }, [posts]);

    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    async function loadPosts(reset = false) {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        setError(null);
        try {
            const offset = reset ? 0 : posts.length;
            const res = await apiFetch(
                `/updates?item_type=community&limit=${PAGE_SIZE}&offset=${offset}&include_comments=true`,
                { cache: "no-store" },
            );
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to load community posts.");
            }

            const batch = extractPosts(await res.json());
            setHasMore(batch.length === PAGE_SIZE);

            setPosts((prev) => {
                if (reset) return batch;
                const seen = new Set(prev.map((item) => item.id));
                const append = batch.filter((item) => !seen.has(item.id));
                return append.length ? [...prev, ...append] : prev;
            });

            setCommentsByPost((prev) => {
                const next = { ...prev };
                for (const post of batch) next[post.id] = post.comments || next[post.id] || [];
                return next;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load community posts.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    useEffect(() => {
        loadPosts(true);
    }, []);

    async function createPost(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!token) {
            setError("Sign in to publish posts.");
            return;
        }
        if (!title.trim() || !body.trim()) return;

        setPublishing(true);
        setError(null);
        try {
            const createRes = await apiFetch("/updates", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    item_type: "community",
                    title: title.trim(),
                    content: body.trim(),
                    category,
                    tags: tags.trim() || undefined,
                }),
            });

            if (!createRes.ok) {
                const payload = (await createRes.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to publish post.");
            }

            const created = (await createRes.json()) as CommunityPost;

            if (files.length > 0) {
                const formData = new FormData();
                files.forEach((file) => formData.append("files", file));

                const uploadRes = await apiFetch(`/updates/community/${created.id}/images`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const payload = (await uploadRes.json().catch(() => null)) as { detail?: string } | null;
                    throw new Error(payload?.detail || "Post created, but image upload failed.");
                }
            }

            setTitle("");
            setBody("");
            setCategory("general");
            setTags("");
            setFiles([]);
            await loadPosts(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to publish post.");
        } finally {
            setPublishing(false);
        }
    }

    async function toggleReaction(postId: string) {
        if (!token) {
            setError("Sign in to react.");
            return;
        }

        try {
            const res = await apiFetch(`/updates/community/${postId}/reactions`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to update reaction.");
            }

            const updated = (await res.json()) as CommunityPost;
            setPosts((prev) =>
                prev.map((post) =>
                    post.id === postId ? { ...post, reaction_count: updated.reaction_count } : post,
                ),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update reaction.");
        }
    }

    async function openComments(postId: string) {
        setCommentsOpen((prev) => ({ ...prev, [postId]: !prev[postId] }));
        if (commentsByPost[postId]) return;

        try {
            const res = await apiFetch(`/updates/community/${postId}/comments`, { cache: "no-store" });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to load comments.");
            }
            const comments = (await res.json()) as CommunityComment[];
            setCommentsByPost((prev) => ({ ...prev, [postId]: comments || [] }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load comments.");
        }
    }

    async function submitComment(postId: string, parentId?: string | null) {
        if (!token) {
            setError("Sign in to comment.");
            return;
        }

        const draftKey = parentId ? `${postId}:${parentId}` : postId;
        const text = parentId ? replyDraft[draftKey] : commentDraft[postId];
        if (!text?.trim()) return;

        setCommentBusyByPost((prev) => ({ ...prev, [postId]: true }));
        try {
            const res = await apiFetch(`/updates/community/${postId}/comments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ body: text.trim(), parent_id: parentId || undefined }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to post comment.");
            }

            const created = (await res.json()) as CommunityComment;
            setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), created] }));

            if (parentId) {
                setReplyDraft((prev) => ({ ...prev, [draftKey]: "" }));
                setReplyTarget((prev) => ({ ...prev, [postId]: null }));
            } else {
                setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to post comment.");
        } finally {
            setCommentBusyByPost((prev) => ({ ...prev, [postId]: false }));
        }
    }

    function startEdit(post: CommunityPost) {
        setEditingId(post.id);
        setEditTitle(post.title || "");
        setEditBody(post.content || "");
    }

    async function saveEdit(postId: string) {
        if (!token) return;
        if (!editTitle.trim() || !editBody.trim()) {
            setError("Title and content are required to update the post.");
            return;
        }
        try {
            const res = await apiFetch(`/updates/community/${postId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    body: editBody.trim(),
                    content: editBody.trim(),
                }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to update post.");
            }

            const updated = (await res.json()) as CommunityPost;
            setPosts((prev) =>
                prev.map((post) =>
                    post.id === postId
                        ? {
                            ...post,
                            title: updated.title,
                            content: updated.content,
                            category: updated.category,
                            tags: updated.tags,
                            image_url: updated.image_url,
                        }
                        : post,
                ),
            );
            setEditingId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update post.");
        }
    }

    async function removePost() {
        if (!token) return;
        if (!deleteTargetId) return;
        setDeleteBusy(true);
        try {
            const res = await apiFetch(`/updates/community/${deleteTargetId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to delete post.");
            }
            setPosts((prev) => prev.filter((post) => post.id !== deleteTargetId));
            setDeleteTargetId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete post.");
        } finally {
            setDeleteBusy(false);
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-6">
                <header className="soft-card p-6 md:p-7 lg:p-8">
                    <p className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-on-secondary-container">
                        <Shield className="h-3.5 w-3.5" />
                        Community Network
                    </p>
                    <h1 className="mt-4 font-headline text-4xl font-extrabold md:text-5xl lg:text-6xl">Social Feed</h1>
                    <p className="mt-3 max-w-3xl text-sm text-on-surface-variant md:text-base">
                        Share updates, publish media, and collaborate around pet care in one professional timeline.
                    </p>
                </header>

                <form onSubmit={createPost} className="soft-card space-y-4 p-6 md:p-7">
                    <div className="grid gap-3 md:grid-cols-2">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Post title"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                        />
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                        >
                            {categoryOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Share updates, progress, or requests from your pet community..."
                        className="h-28 w-full resize-none rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                    />

                    <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Tags: rescue, foster, adoption"
                        className="w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                    />

                    <label className="block rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                        Add media (one or multiple images)
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="mt-2 block w-full text-sm"
                            onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        />
                    </label>

                    {previewUrls.length > 0 ? <MediaMosaic images={previewUrls} alt="post preview" /> : null}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={publishing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {publishing ? "Publishing..." : "Publish Post"}
                        </button>
                    </div>
                </form>

                {error ? <p className="rounded-xl border border-error/25 bg-error-container/40 px-4 py-2 text-sm font-semibold text-error">{error}</p> : null}

                <div className="space-y-5">
                    {loading ? (
                        <AnimatedState
                            title="Loading social feed"
                            message="Pulling the newest community activity now."
                            emoji="🛰️"
                            compact
                        />
                    ) : null}
                    {!loading && posts.length === 0 ? (
                        <AnimatedState
                            title="No posts yet"
                            message="Be the first to publish an update and kick off community engagement."
                            emoji="🚀"
                            tone="calm"
                        />
                    ) : null}

                    {posts.map((post) => {
                        const comments = commentsByPost[post.id] || [];
                        const isEditing = editingId === post.id;

                        return (
                            <article key={post.id} className="soft-card p-5 md:p-6">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                                            {(post.category || "general").toUpperCase()} · {prettyDate(post.created_at)}
                                        </p>
                                        {!isEditing ? (
                                            <h3 className="mt-1 text-xl font-bold">{post.title}</h3>
                                        ) : (
                                            <input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="mt-1 w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-lg font-bold outline-none"
                                            />
                                        )}
                                        <p className="mt-1 text-sm text-on-surface-variant">by {post.author_name || "Community member"}</p>
                                    </div>

                                    {isAdmin ? (
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={() => saveEdit(post.id)}
                                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                                                >
                                                    Save
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(post)}
                                                    className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold"
                                                >
                                                    <PencilLine className="mr-1 inline h-3.5 w-3.5" /> Edit
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTargetId(post.id)}
                                                className="rounded-lg border border-error/35 px-3 py-1.5 text-xs font-semibold text-error"
                                            >
                                                <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete
                                            </button>
                                        </div>
                                    ) : null}
                                </div>

                                {!isEditing ? (
                                    <p className="text-sm leading-7 text-on-surface-variant">{post.content || ""}</p>
                                ) : (
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        className="mt-1 h-28 w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                                    />
                                )}

                                {(mediaByPost[post.id] || []).length > 0 ? (
                                    <div className="mt-4">
                                        <MediaMosaic images={mediaByPost[post.id]} alt={post.title} />
                                    </div>
                                ) : null}

                                {post.tags ? <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{post.tags}</p> : null}

                                <div className="mt-4 flex items-center gap-5 border-t border-outline-variant/30 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleReaction(post.id)}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant"
                                    >
                                        <Heart className="h-4 w-4" /> {post.reaction_count}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openComments(post.id)}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant"
                                    >
                                        <MessageCircle className="h-4 w-4" /> {comments.length}
                                    </button>
                                </div>

                                {commentsOpen[post.id] ? (
                                    <div className="mt-4 space-y-3 rounded-2xl bg-surface-container-low p-3">
                                        {parseThreads(comments).map(({ root, replies }) => (
                                            <div key={root.id} className="rounded-xl border border-outline-variant/30 bg-white/80 p-3">
                                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                                                    <span className="font-semibold">{root.author_name || "User"}</span>
                                                    <span>{prettyDate(root.created_at)}</span>
                                                </div>
                                                <p className="text-sm">{root.body}</p>

                                                <button
                                                    type="button"
                                                    className="mt-2 text-xs font-semibold text-primary"
                                                    onClick={() => setReplyTarget((prev) => ({ ...prev, [post.id]: root.id }))}
                                                >
                                                    Reply
                                                </button>

                                                {replies.length > 0 ? (
                                                    <div className="mt-3 space-y-2 border-l border-outline-variant/30 pl-3">
                                                        {replies.map((reply) => (
                                                            <div key={reply.id}>
                                                                <p className="text-xs font-semibold text-on-surface-variant">{reply.author_name || "User"}</p>
                                                                <p className="text-sm">{reply.body}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}

                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                submitComment(post.id);
                                            }}
                                            className="flex gap-2"
                                        >
                                            <input
                                                value={commentDraft[post.id] || ""}
                                                onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                                placeholder="Write a comment"
                                                className="flex-1 rounded-xl border border-outline-variant/35 bg-white px-3 py-2 text-sm outline-none"
                                            />
                                            <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary">
                                                {commentBusyByPost[post.id] ? "Posting..." : "Post"}
                                            </button>
                                        </form>

                                        {replyTarget[post.id] ? (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    submitComment(post.id, replyTarget[post.id]);
                                                }}
                                                className="flex gap-2"
                                            >
                                                <input
                                                    value={replyDraft[`${post.id}:${replyTarget[post.id]}`] || ""}
                                                    onChange={(e) =>
                                                        setReplyDraft((prev) => ({
                                                            ...prev,
                                                            [`${post.id}:${replyTarget[post.id]}`]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Write a reply"
                                                    className="flex-1 rounded-xl border border-outline-variant/35 bg-white px-3 py-2 text-sm outline-none"
                                                />
                                                <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary">
                                                    {commentBusyByPost[post.id] ? "Replying..." : "Reply"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyTarget((prev) => ({ ...prev, [post.id]: null }))}
                                                    className="rounded-xl border border-outline-variant/35 px-3 py-2 text-xs font-semibold"
                                                >
                                                    Cancel
                                                </button>
                                            </form>
                                        ) : null}
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </div>

                {hasMore ? (
                    <div className="flex justify-center pt-2">
                        <button
                            type="button"
                            onClick={() => loadPosts(false)}
                            disabled={loadingMore}
                            className="rounded-xl border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold"
                        >
                            {loadingMore ? "Loading..." : "Load More"}
                        </button>
                    </div>
                ) : null}
            </section>

            <aside className="space-y-4 xl:sticky xl:h-fit">
                <div className="soft-card p-5">
                    <h3 className="font-headline text-lg font-bold">User Features</h3>
                    <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                        <li>Publish community posts with multiple images</li>
                        <li>React and comment in threaded discussions</li>
                        <li>Open complete galleries from +N media tiles</li>
                        <li>Browse categorized updates from the network</li>
                    </ul>
                </div>

                <div className="soft-card p-5">
                    <h3 className="font-headline text-lg font-bold">Admin Controls</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                        Admin users can edit and remove community content directly from the feed and from the admin panel.
                    </p>
                </div>
            </aside>

            <ConfirmDialog
                open={Boolean(deleteTargetId)}
                title="Delete this post?"
                message="This action permanently removes the post and its media from the feed."
                confirmLabel="Yes, delete"
                busy={deleteBusy}
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={removePost}
            />
        </div>
    );
}
