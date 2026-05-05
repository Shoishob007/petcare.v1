"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertOctagon, PencilLine, ShieldCheck, Trash2, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAuthToken, getAuthUser, type AuthUser } from "@/lib/auth";
import AnimatedState from "@/src/components/AnimatedState";
import ConfirmDialog from "@/src/components/ConfirmDialog";

type UsersResponse = { users: AuthUser[] };

type UpdateItem = {
    id: string;
    item_type: "report" | "community";
    title: string;
    content?: string | null;
    created_at: string;
};

type HomePageContent = {
    badge: string;
    title_prefix: string;
    title_highlight: string;
    description: string;
    primary_cta_label: string;
    primary_cta_href: string;
    secondary_cta_label: string;
    secondary_cta_href: string;
};

const DEFAULT_HOME_CONTENT: HomePageContent = {
    badge: "Pet Operations Workspace",
    title_prefix: "Coordinate care with",
    title_highlight: "confidence",
    description: "Manage your pet community through an operationally mature and visual platform.",
    primary_cta_label: "Open Feed",
    primary_cta_href: "/feed",
    secondary_cta_label: "Open Reports",
    secondary_cta_href: "/safety",
};

export default function Admin() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);

    const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
    const [editingUpdateTitle, setEditingUpdateTitle] = useState("");
    const [editingUpdateContent, setEditingUpdateContent] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<UpdateItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const [homeContent, setHomeContent] = useState<HomePageContent>(DEFAULT_HOME_CONTENT);
    const [savingHome, setSavingHome] = useState(false);

    const authUser = getAuthUser();
    const isAdmin = (authUser?.role || "user").toLowerCase() === "admin";

    const reportCount = useMemo(
        () => updates.filter((item) => item.item_type === "report").length,
        [updates],
    );
    const communityCount = useMemo(
        () => updates.filter((item) => item.item_type === "community").length,
        [updates],
    );

    async function load() {
        const token = getAuthToken();
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [usersRes, updatesRes, homeRes] = await Promise.all([
                apiFetch("/auth/users", {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }),
                apiFetch("/updates?limit=40", { cache: "no-store" }),
                apiFetch("/homepage-content", { cache: "no-store" }),
            ]);

            if (!usersRes.ok) {
                const payload = (await usersRes.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || `Unable to load users (${usersRes.status})`);
            }

            const usersPayload = (await usersRes.json()) as UsersResponse;
            setUsers(usersPayload.users || []);

            if (updatesRes.ok) {
                const updatesPayload = (await updatesRes.json()) as UpdateItem[];
                setUpdates(updatesPayload || []);
            } else {
                setUpdates([]);
            }

            if (homeRes.ok) {
                setHomeContent((await homeRes.json()) as HomePageContent);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load admin data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        load();
    }, [isAdmin]);

    async function onRoleChange(e: FormEvent<HTMLFormElement>, user: AuthUser) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const role = String(formData.get("role") || "user");

        const token = getAuthToken();
        if (!token) return;

        setBusyUserId(user.id);
        setError(null);
        try {
            const res = await apiFetch(`/auth/users/${user.id}/role`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Role update failed");
            }

            const updated = (await res.json()) as AuthUser;
            setUsers((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Role update failed");
        } finally {
            setBusyUserId(null);
        }
    }

    function startEditingUpdate(item: UpdateItem) {
        setEditingUpdateId(item.id);
        setEditingUpdateTitle(item.title || "");
        setEditingUpdateContent(item.content || "");
    }

    async function saveUpdate(item: UpdateItem) {
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await apiFetch(`/updates/${item.item_type}/${item.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: editingUpdateTitle,
                    content: editingUpdateContent,
                    body: editingUpdateContent,
                    description: editingUpdateContent,
                }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Content update failed");
            }

            setEditingUpdateId(null);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Content update failed");
        }
    }

    async function deleteUpdate() {
        const token = getAuthToken();
        if (!token) return;
        if (!deleteTarget) return;
        setDeleteBusy(true);

        try {
            const res = await apiFetch(`/updates/${deleteTarget.item_type}/${deleteTarget.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Content delete failed");
            }
            setUpdates((prev) => prev.filter((entry) => entry.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Content delete failed");
        } finally {
            setDeleteBusy(false);
        }
    }

    async function saveHomeContent(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        setSavingHome(true);
        setError(null);
        try {
            const res = await apiFetch("/homepage-content", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(homeContent),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Unable to update homepage content");
            }

            setHomeContent((await res.json()) as HomePageContent);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update homepage content");
        } finally {
            setSavingHome(false);
        }
    }

    if (!isAdmin) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-10">
                <div className="rounded-2xl border border-error/20 bg-error-container/40 p-6">
                    <h1 className="font-headline text-2xl font-bold text-on-error-container">Admin Access Required</h1>
                    <p className="mt-2 text-on-error-container/85">
                        This area is restricted to administrators with content and user management permissions.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/30 bg-white/80 p-6">
                <div>
                    <h1 className="font-headline text-3xl font-extrabold">Admin Control Room</h1>
                    <p className="text-sm text-on-surface-variant">Manage users, moderate content, and tune homepage messaging.</p>
                </div>
                <button type="button" onClick={load} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-on-primary">
                    Refresh
                </button>
            </header>

            {error ? <p className="rounded-xl border border-error/25 bg-error-container/40 px-4 py-2 text-sm text-error">{error}</p> : null}
            {loading ? (
                <AnimatedState
                    title="Loading admin workspace"
                    message="Fetching users, moderation queue, and homepage content."
                    emoji="🧩"
                    compact
                />
            ) : null}

            <section className="grid gap-4 md:grid-cols-3">
                <article className="soft-card p-5">
                    <Users className="mb-2 h-6 w-6 text-primary" />
                    <p className="text-2xl font-extrabold">{users.length}</p>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Total Users</p>
                </article>

                <article className="soft-card p-5">
                    <AlertOctagon className="mb-2 h-6 w-6 text-error" />
                    <p className="text-2xl font-extrabold">{reportCount}</p>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Reports</p>
                </article>

                <article className="soft-card p-5">
                    <ShieldCheck className="mb-2 h-6 w-6 text-secondary" />
                    <p className="text-2xl font-extrabold">{communityCount}</p>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Community Posts</p>
                </article>
            </section>

            <section className="soft-card p-6">
                <h2 className="font-headline text-2xl font-bold">User Role Management</h2>
                <div className="mt-4 space-y-3">
                    {users.map((user) => {
                        const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || user.email;
                        return (
                            <article key={user.id} className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-semibold">{displayName}</p>
                                        <p className="text-sm text-on-surface-variant">{user.email}</p>
                                    </div>

                                    <form onSubmit={(e) => onRoleChange(e, user)} className="flex items-center gap-2">
                                        <select
                                            name="role"
                                            defaultValue={(user.role || "user").toLowerCase()}
                                            className="rounded-lg border border-outline-variant/35 bg-white px-3 py-2"
                                        >
                                            <option value="user">USER</option>
                                            <option value="admin">ADMIN</option>
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={busyUserId === user.id}
                                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
                                        >
                                            {busyUserId === user.id ? "Updating..." : "Update"}
                                        </button>
                                    </form>
                                </div>
                            </article>
                        );
                    })}
                    {!loading && users.length === 0 ? <p className="text-on-surface-variant">No users found.</p> : null}
                </div>
            </section>

            <section className="soft-card p-6">
                <h2 className="font-headline text-2xl font-bold">Content Moderation</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Edit or remove reports and community posts.</p>

                <div className="mt-4 space-y-3">
                    {updates.map((item) => {
                        const isEditing = editingUpdateId === item.id;
                        return (
                            <article key={`${item.item_type}-${item.id}`} className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                                {!isEditing ? (
                                    <>
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{item.item_type}</p>
                                                <h3 className="font-semibold">{item.title}</h3>
                                                <p className="mt-1 text-xs text-on-surface-variant">{new Date(item.created_at).toLocaleString()}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditingUpdate(item)}
                                                    className="rounded-lg border border-outline-variant/35 px-3 py-1.5 text-xs font-semibold"
                                                >
                                                    <PencilLine className="mr-1 inline h-3.5 w-3.5" /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(item)}
                                                    className="rounded-lg border border-error/35 px-3 py-1.5 text-xs font-semibold text-error"
                                                >
                                                    <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        {item.content ? <p className="mt-2 text-sm text-on-surface-variant line-clamp-2">{item.content}</p> : null}
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            value={editingUpdateTitle}
                                            onChange={(e) => setEditingUpdateTitle(e.target.value)}
                                            className="w-full rounded-xl border border-outline-variant/35 bg-white px-3 py-2 text-sm outline-none"
                                        />
                                        <textarea
                                            value={editingUpdateContent}
                                            onChange={(e) => setEditingUpdateContent(e.target.value)}
                                            className="h-24 w-full rounded-xl border border-outline-variant/35 bg-white px-3 py-2 text-sm outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => saveUpdate(item)}
                                                className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingUpdateId(null)}
                                                className="rounded-lg border border-outline-variant/35 px-3 py-2 text-xs font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                    {!loading && updates.length === 0 ? (
                        <AnimatedState
                            title="No content in queue"
                            message="Everything is moderated and up to date right now."
                            emoji="✅"
                            tone="calm"
                            compact
                        />
                    ) : null}
                </div>
            </section>

            <section className="soft-card p-6">
                <h2 className="font-headline text-2xl font-bold">Homepage Content Editor</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Update the hero content seen by users on the home screen.</p>

                <form className="mt-4 space-y-3" onSubmit={saveHomeContent}>
                    <div className="grid gap-3 md:grid-cols-2">
                        <input
                            value={homeContent.badge}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, badge: e.target.value }))}
                            placeholder="Badge"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                        <input
                            value={homeContent.title_prefix}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, title_prefix: e.target.value }))}
                            placeholder="Title prefix"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                        <input
                            value={homeContent.title_highlight}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, title_highlight: e.target.value }))}
                            placeholder="Title highlight"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                        <input
                            value={homeContent.primary_cta_label}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, primary_cta_label: e.target.value }))}
                            placeholder="Primary CTA label"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                        <input
                            value={homeContent.primary_cta_href}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, primary_cta_href: e.target.value }))}
                            placeholder="Primary CTA href"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                        <input
                            value={homeContent.secondary_cta_label}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, secondary_cta_label: e.target.value }))}
                            placeholder="Secondary CTA label"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                        <input
                            value={homeContent.secondary_cta_href}
                            onChange={(e) => setHomeContent((prev) => ({ ...prev, secondary_cta_href: e.target.value }))}
                            placeholder="Secondary CTA href"
                            className="rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <textarea
                        value={homeContent.description}
                        onChange={(e) => setHomeContent((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Homepage description"
                        className="h-24 w-full rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm outline-none"
                    />

                    <button
                        type="submit"
                        disabled={savingHome}
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
                    >
                        {savingHome ? "Saving..." : "Save Homepage Content"}
                    </button>
                </form>
            </section>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Delete this content item?"
                message="This operation cannot be undone and the item will disappear from all user feeds."
                confirmLabel="Yes, delete"
                busy={deleteBusy}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={deleteUpdate}
            />
        </div>
    );
}
