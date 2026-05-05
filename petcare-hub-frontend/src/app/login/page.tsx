"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import AuthFrame from "@/src/components/AuthFrame";

type LoginResponse = {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        role: string;
        first_name?: string | null;
        last_name?: string | null;
    };
};

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const payload = (await res.json()) as LoginResponse | { detail?: string };
            if (!res.ok) {
                throw new Error((payload as { detail?: string }).detail || "Login failed.");
            }

            const data = payload as LoginResponse;
            setAuthSession(data.access_token, data.user, data.refresh_token);
            router.push("/feed");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthFrame
            title="Sign In"
            subtitle="Access your dashboard, community feed, reports, and team tools."
            footerText="Need an account?"
            footerCtaLabel="Create one"
            footerCtaHref="/signup"
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</span>
                    <div className="flex items-center rounded-2xl border border-outline-variant/35 bg-surface-container-low px-4">
                        <Mail className="h-4 w-4 text-on-surface-variant" />
                        <input
                            type="email"
                            placeholder="owner@example.com"
                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </label>

                <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</span>
                    <div className="flex items-center rounded-2xl border border-outline-variant/35 bg-surface-container-low px-4">
                        <KeyRound className="h-4 w-4 text-on-surface-variant" />
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </label>

                {error ? <p className="rounded-xl border border-error/25 bg-error-container/30 px-3 py-2 text-sm font-semibold text-error">{error}</p> : null}

                <button
                    type="submit"
                    className="w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-on-primary transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                >
                    {submitting ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </AuthFrame>
    );
}
