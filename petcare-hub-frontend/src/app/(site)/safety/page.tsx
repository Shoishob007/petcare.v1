"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Heart, MapPin, MessageCircle, PencilLine, Send, ShieldAlert, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { resolveApiMediaUrl } from "@/lib/media";
import AnimatedState from "@/src/components/AnimatedState";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import MediaMosaic from "@/src/components/MediaMosaic";

type ReportImage = {
    id: string;
    url?: string;
    file_url?: string;
    image_url?: string;
};

type ReportComment = {
    id: string;
    body: string;
    author_name?: string | null;
    parent_id?: string | null;
    created_at: string;
};

function parseThreads(comments: ReportComment[]) {
    const roots: ReportComment[] = [];
    const repliesByParent: Record<string, ReportComment[]> = {};

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

type Report = {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    category?: string | null;
    urgency?: string | null;
    status?: string | null;
    reaction_count: number;
    comment_count?: number;
    created_at: string;
    images?: ReportImage[];
};

function imageUrls(report: Report): string[] {
    return (report.images || [])
        .map((img) => resolveApiMediaUrl(img.url || img.file_url || img.image_url || ""))
        .filter(Boolean) as string[];
}

function dateText(value: string): string {
    return new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function SafetyPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [posting, setPosting] = useState(false);

    const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
    const [commentsByReport, setCommentsByReport] = useState<Record<string, ReportComment[]>>({});
    const [commentBusyByReport, setCommentBusyByReport] = useState<Record<string, boolean>>({});
    const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
    const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
    const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>({});

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const authUser = getAuthUser();
    const token = getAuthToken();
    const isAdmin = (authUser?.role || "user").toLowerCase() === "admin";

    const reportImages = useMemo(() => {
        const map: Record<string, string[]> = {};
        for (const report of reports) map[report.id] = imageUrls(report);
        return map;
    }, [reports]);

    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    async function loadReports() {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch("/reports", { cache: "no-store" });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to load reports.");
            }
            setReports((await res.json()) as Report[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load reports.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReports();
    }, []);

    async function createReport(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!token) {
            setError("Sign in to submit reports.");
            return;
        }
        if (!title.trim()) return;

        setPosting(true);
        setError(null);
        try {
            const createRes = await apiFetch("/reports", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    location: location.trim() || null,
                    category: "safety",
                    urgency: "high",
                    status: "open",
                }),
            });

            if (!createRes.ok) {
                const payload = (await createRes.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to submit report.");
            }

            const created = (await createRes.json()) as Report;

            if (files.length > 0) {
                const formData = new FormData();
                files.forEach((file) => formData.append("files", file));

                const uploadRes = await apiFetch(`/reports/${created.id}/images`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const payload = (await uploadRes.json().catch(() => null)) as { detail?: string } | null;
                    throw new Error(payload?.detail || "Report created, but image upload failed.");
                }
            }

            setTitle("");
            setDescription("");
            setLocation("");
            setFiles([]);
            await loadReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to submit report.");
        } finally {
            setPosting(false);
        }
    }

    async function toggleReaction(reportId: string) {
        if (!token) {
            setError("Sign in to react.");
            return;
        }

        try {
            const res = await apiFetch(`/reports/${reportId}/reactions`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to update reaction.");
            }

            const updated = (await res.json()) as Report;
            setReports((prev) =>
                prev.map((report) =>
                    report.id === reportId ? { ...report, reaction_count: updated.reaction_count } : report,
                ),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update reaction.");
        }
    }

    async function openComments(reportId: string) {
        setCommentsOpen((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
        if (commentsByReport[reportId]) return;

        try {
            const res = await apiFetch(`/reports/${reportId}/comments`, { cache: "no-store" });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to load comments.");
            }
            const comments = (await res.json()) as ReportComment[];
            setCommentsByReport((prev) => ({ ...prev, [reportId]: comments }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load comments.");
        }
    }

    async function postComment(reportId: string, parentId?: string | null) {
        if (!token) {
            setError("Sign in to comment.");
            return;
        }

        const draftKey = parentId ? `${reportId}:${parentId}` : reportId;
        const text = parentId ? replyDraft[draftKey] : commentDraft[reportId];
        if (!text?.trim()) return;

        setCommentBusyByReport((prev) => ({ ...prev, [reportId]: true }));
        try {
            const res = await apiFetch(`/reports/${reportId}/comments`, {
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

            const created = (await res.json()) as ReportComment;
            setCommentsByReport((prev) => ({
                ...prev,
                [reportId]: [...(prev[reportId] || []), created],
            }));

            if (parentId) {
                setReplyDraft((prev) => ({ ...prev, [draftKey]: "" }));
                setReplyTarget((prev) => ({ ...prev, [reportId]: null }));
            } else {
                setCommentDraft((prev) => ({ ...prev, [reportId]: "" }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to post comment.");
        } finally {
            setCommentBusyByReport((prev) => ({ ...prev, [reportId]: false }));
        }
    }

    function startEdit(report: Report) {
        setEditingId(report.id);
        setEditTitle(report.title);
        setEditDescription(report.description || "");
    }

    async function saveEdit(reportId: string) {
        if (!token) return;

        try {
            const res = await apiFetch(`/reports/${reportId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to update report.");
            }

            setEditingId(null);
            await loadReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update report.");
        }
    }

    async function deleteReport() {
        if (!token) return;
        if (!deleteTargetId) return;
        setDeleteBusy(true);

        try {
            const res = await apiFetch(`/reports/${deleteTargetId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to delete report.");
            }
            setReports((prev) => prev.filter((report) => report.id !== deleteTargetId));
            setDeleteTargetId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete report.");
        } finally {
            setDeleteBusy(false);
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-6">
                <header className="soft-card p-6 md:p-7 lg:p-8">
                    <p className="inline-flex items-center gap-2 rounded-full bg-error-container px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-on-error-container">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Safety Response
                    </p>
                    <h1 className="mt-4 font-headline text-4xl font-extrabold md:text-5xl lg:text-6xl">Reports Hub</h1>
                    <p className="mt-3 max-w-3xl text-sm text-on-surface-variant md:text-base">
                        Publish urgent updates, attach supporting images, and coordinate local responders effectively.
                    </p>
                </header>

                <form onSubmit={createReport} className="soft-card space-y-4 p-6 md:p-7">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Alert title"
                        className="w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                        required
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Location"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                        />
                        <label className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                            Attach images
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="mt-2 block w-full text-sm"
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                            />
                        </label>
                    </div>

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what happened and what help is needed."
                        className="h-24 w-full resize-none rounded-xl border border-outline-variant/35 bg-surface-container-low px-4 py-3 outline-none"
                    />

                    {previewUrls.length > 0 ? <MediaMosaic images={previewUrls} alt="report preview" /> : null}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={posting}
                            className="inline-flex items-center gap-2 rounded-xl bg-error px-5 py-3 text-sm font-bold text-on-error disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {posting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </form>

                {error ? <p className="rounded-xl border border-error/25 bg-error-container/40 px-4 py-2 text-sm font-semibold text-error">{error}</p> : null}

                <div className="space-y-5">
                    {loading ? (
                        <AnimatedState
                            title="Loading reports"
                            message="Collecting the latest field incidents and updates."
                            emoji="📍"
                            tone="warning"
                            compact
                        />
                    ) : null}
                    {!loading && reports.length === 0 ? (
                        <AnimatedState
                            title="No reports available"
                            message="Your response board is clear. Submit a report when new incidents appear."
                            emoji="🛡️"
                            tone="calm"
                        />
                    ) : null}

                    {reports.map((report) => {
                        const comments = commentsByReport[report.id] || [];
                        const isEditing = editingId === report.id;

                        return (
                            <article key={report.id} className="soft-card p-5 md:p-6">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                                            {(report.status || "open").toUpperCase()} · {dateText(report.created_at)}
                                        </p>

                                        {!isEditing ? (
                                            <h3 className="mt-1 text-xl font-bold">{report.title}</h3>
                                        ) : (
                                            <input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="mt-1 w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-lg font-bold outline-none"
                                            />
                                        )}

                                        {report.location ? (
                                            <p className="mt-1 inline-flex items-center gap-1 text-sm text-on-surface-variant">
                                                <MapPin className="h-4 w-4" /> {report.location}
                                            </p>
                                        ) : null}
                                    </div>

                                    {isAdmin ? (
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={() => saveEdit(report.id)}
                                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                                                >
                                                    Save
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(report)}
                                                    className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold"
                                                >
                                                    <PencilLine className="mr-1 inline h-3.5 w-3.5" /> Edit
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setDeleteTargetId(report.id)}
                                                className="rounded-lg border border-error/35 px-3 py-1.5 text-xs font-semibold text-error"
                                            >
                                                <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete
                                            </button>
                                        </div>
                                    ) : null}
                                </div>

                                {!isEditing ? (
                                    <p className="text-sm leading-7 text-on-surface-variant">{report.description || "No details added."}</p>
                                ) : (
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="mt-1 h-24 w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                                    />
                                )}

                                {(reportImages[report.id] || []).length > 0 ? (
                                    <div className="mt-4">
                                        <MediaMosaic images={reportImages[report.id]} alt={report.title} />
                                    </div>
                                ) : null}

                                <div className="mt-4 flex items-center gap-5 border-t border-outline-variant/30 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleReaction(report.id)}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant"
                                    >
                                        <Heart className="h-4 w-4" /> {report.reaction_count || 0}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openComments(report.id)}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant"
                                    >
                                        <MessageCircle className="h-4 w-4" /> {comments.length}
                                    </button>
                                </div>

                                {commentsOpen[report.id] ? (
                                    <div className="mt-4 space-y-3 rounded-2xl bg-surface-container-low p-3">
                                        {parseThreads(comments).map(({ root, replies }) => (
                                            <div key={root.id} className="rounded-xl border border-outline-variant/30 bg-white/80 p-3">
                                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                                                    <span className="font-semibold">{root.author_name || "User"}</span>
                                                    <span>{dateText(root.created_at)}</span>
                                                </div>
                                                <p className="text-sm">{root.body}</p>

                                                <button
                                                    type="button"
                                                    className="mt-2 text-xs font-semibold text-primary"
                                                    onClick={() => setReplyTarget((prev) => ({ ...prev, [report.id]: root.id }))}
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
                                                postComment(report.id);
                                            }}
                                            className="flex gap-2"
                                        >
                                            <input
                                                value={commentDraft[report.id] || ""}
                                                onChange={(e) => setCommentDraft((prev) => ({ ...prev, [report.id]: e.target.value }))}
                                                placeholder="Add a response"
                                                className="flex-1 rounded-xl border border-outline-variant/35 bg-white px-3 py-2 text-sm outline-none"
                                            />
                                            <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary">
                                                {commentBusyByReport[report.id] ? "Posting..." : "Post"}
                                            </button>
                                        </form>

                                        {replyTarget[report.id] ? (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    postComment(report.id, replyTarget[report.id]);
                                                }}
                                                className="flex gap-2"
                                            >
                                                <input
                                                    value={replyDraft[`${report.id}:${replyTarget[report.id]}`] || ""}
                                                    onChange={(e) =>
                                                        setReplyDraft((prev) => ({
                                                            ...prev,
                                                            [`${report.id}:${replyTarget[report.id]}`]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Write a reply"
                                                    className="flex-1 rounded-xl border border-outline-variant/35 bg-white px-3 py-2 text-sm outline-none"
                                                />
                                                <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary">
                                                    {commentBusyByReport[report.id] ? "Replying..." : "Reply"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyTarget((prev) => ({ ...prev, [report.id]: null }))}
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
            </section>

            <aside className="space-y-4 xl:sticky xl:h-fit">
                <div className="soft-card p-5">
                    <h3 className="font-headline text-lg font-bold">How this works</h3>
                    <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
                        <li>Publish reports with context and media evidence</li>
                        <li>Engage with reactions and coordinated comments</li>
                        <li>Open rich galleries for high-volume report images</li>
                        <li>Admins can edit or remove report entries</li>
                    </ul>
                </div>

                <div className="soft-card p-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-error-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-error-container">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Priority
                    </div>
                    <p className="mt-3 text-sm text-on-surface-variant">
                        When details are clear and media is attached, responders can triage incidents much faster.
                    </p>
                </div>
            </aside>

            <ConfirmDialog
                open={Boolean(deleteTargetId)}
                title="Delete this report?"
                message="This removes the report from responders and community members permanently."
                confirmLabel="Yes, remove"
                busy={deleteBusy}
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={deleteReport}
            />
        </div>
    );
}
