"use client";

import { FormEvent, useEffect, useState } from "react";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import PawLoader from "../components/PawLoader";
import { apiFetch } from "../lib/api";
import { getAuthToken, getAuthUser, type AuthUser } from "../lib/auth";

type UsersResponse = { users: AuthUser[] };

export default function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    const current = getAuthUser();
    if (!current) {
      window.location.href = "/login";
      return;
    }
    if ((current.role || "user").toLowerCase() !== "admin") {
      window.location.href = "/feed";
      return;
    }

    loadUsers();
  }, []);

  async function loadUsers() {
    const token = getAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      setError(null);
      const res = await apiFetch("/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.detail || `Unable to load users (${res.status})`,
        );
      }

      const data = (await res.json()) as UsersResponse;
      setUsers(data.users || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onRoleChange(
    event: FormEvent<HTMLFormElement>,
    user: AuthUser,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const role = String(formData.get("role") || "user");

    const token = getAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      setBusyUserId(user.id);
      setError(null);
      const res = await apiFetch(`/auth/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.detail || `Role update failed (${res.status})`,
        );
      }

      const updated = (await res.json()) as AuthUser;
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Role update failed",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />
      <div className="page">
        <header className="community-hero">
          <div className="community-hero-content">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>Manage users and access roles.</h1>
              <p className="subtext">
                Promote trusted members and keep moderation balanced.
              </p>
            </div>
          </div>
        </header>

        <section className="panel panel-spaced">
          {error && <p className="error">{error}</p>}
          {loading ? (
            <div style={{ maxWidth: "420px", margin: "0 auto" }}>
              <PawLoader label="Loading users" />
            </div>
          ) : users.length === 0 ? (
            <p className="subtext">No users found.</p>
          ) : (
            <div className="grid-list">
              {users.map((user) => (
                <article className="feed-card" key={user.id}>
                  <h3>{user.first_name || user.username || user.email}</h3>
                  <p className="subtext">{user.email}</p>
                  <p className="subtext">
                    Current role: {(user.role || "user").toUpperCase()}
                  </p>

                  <form
                    onSubmit={(e) => onRoleChange(e, user)}
                    className="field-row"
                  >
                    <label>
                      Role
                      <select
                        name="role"
                        defaultValue={(user.role || "user").toLowerCase()}
                      >
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </label>

                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={busyUserId === user.id}
                    >
                      {busyUserId === user.id ? (
                        <PawLoader label="Updating role" />
                      ) : (
                        "Update role"
                      )}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
