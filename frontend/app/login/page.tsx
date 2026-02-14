"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PawLoader from "../components/PawLoader";
import { apiFetch } from "../lib/api";
import { setAuthSession } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@petcarehub.local");
  const [password, setPassword] = useState("Admin@12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.detail || `Login failed (${res.status})`);
      }

      const data = await res.json();

      setAuthSession(data.access_token, data.user);
      window.location.href = "/feed";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell page-shell">
      <section className="auth-card">
        <aside className="auth-visual">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in and join your pet community.</h1>
          <p>
            Track updates, react to posts, and coordinate care with your local
            network.
          </p>
          <ul className="feature-list">
            <li>Personalized actions linked to your profile</li>
            <li>Role-based access for safer moderation</li>
            <li>One shared hub for reports and community posts</li>
          </ul>
        </aside>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-title">
            <h2>Login</h2>
            <p>Access your pet care dashboard.</p>
          </div>

          <label>
            Email
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <PawLoader label="Signing in" /> : "Login"}
          </button>

          <p className="auth-switch">
            New here? <Link href="/register">Create your account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
