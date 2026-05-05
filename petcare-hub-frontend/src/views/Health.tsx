"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, HeartPulse } from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";
import { resolveApiMediaUrl } from "@/lib/media";

type SicknessImage = {
    id: string;
    url: string;
};

type Sickness = {
    id: string;
    name: string;
    species?: string | null;
    summary?: string | null;
    symptoms?: string | null;
    remedies?: string | null;
    severity?: string | null;
    is_verified?: boolean;
    created_at: string;
    images: SicknessImage[];
};

export default function Health() {
    const [items, setItems] = useState<Sickness[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [summary, setSummary] = useState("");
    const [symptoms, setSymptoms] = useState("");
    const [remedies, setRemedies] = useState("");
    const [severity, setSeverity] = useState("moderate");

    const loadSicknesses = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch("/sicknesses", { cache: "no-store" });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || `Failed to load sicknesses (${res.status})`);
            }
            const payload = (await res.json()) as Sickness[];
            setItems(payload || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sicknesses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSicknesses();
    }, []);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return items;
        return items.filter((item) => {
            const haystack = `${item.name} ${item.species || ""} ${item.summary || ""} ${item.symptoms || ""}`.toLowerCase();
            return haystack.includes(term);
        });
    }, [items, query]);

    const submitCondition = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        setError(null);
        try {
            const res = await apiFetch("/sicknesses", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    name: name.trim(),
                    species: species.trim() || null,
                    summary: summary.trim() || null,
                    symptoms: symptoms.trim() || null,
                    remedies: remedies.trim() || null,
                    severity,
                }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
                throw new Error(payload?.detail || "Failed to submit condition");
            }

            setName("");
            setSpecies("");
            setSummary("");
            setSymptoms("");
            setRemedies("");
            setSeverity("moderate");
            await loadSicknesses();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit condition");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
            <header className="space-y-3">
                <h1 className="font-headline text-4xl lg:text-6xl font-extrabold">Health Library</h1>
                <p className="text-on-surface-variant text-lg">Structured condition records for care planning and decisions.</p>
            </header>

            <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/15">
                <h2 className="font-headline text-xl font-bold mb-4">Report New Condition</h2>
                <form onSubmit={submitCondition} className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Condition name"
                            className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3"
                            required
                        />
                        <input
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            placeholder="Species (optional)"
                            className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3"
                        />
                    </div>

                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Summary"
                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 h-20 resize-none"
                    />

                    <div className="grid md:grid-cols-2 gap-3">
                        <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="Symptoms"
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 h-20 resize-none"
                        />
                        <textarea
                            value={remedies}
                            onChange={(e) => setRemedies(e.target.value)}
                            placeholder="Remedies"
                            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 h-20 resize-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3"
                        >
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold disabled:opacity-60"
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                    <p className="text-xs text-on-surface-variant">Submitting requires login and uses the same auth context as feed/report creation.</p>
                </form>
            </section>

            <section className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <h2 className="font-headline text-2xl font-bold">Verified Conditions</h2>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name, species, or symptoms"
                        className="w-full md:w-96 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3"
                    />
                </div>

                {error ? (
                    <p className="text-error text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>
                ) : null}
                {loading ? <p className="text-on-surface-variant">Loading sickness records...</p> : null}
                {!loading && filtered.length === 0 ? <p className="text-on-surface-variant">No matching records.</p> : null}

                <div className="grid md:grid-cols-2 gap-4">
                    {filtered.map((item) => (
                        <article key={item.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/15">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-lg">{item.name}</h3>
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-1">
                                        {item.species || "Unknown species"} • {item.severity || "unknown severity"}
                                    </p>
                                </div>
                                <HeartPulse className="w-5 h-5 text-primary" />
                            </div>

                            {item.summary ? <p className="mt-3 text-on-surface-variant">{item.summary}</p> : null}
                            {item.symptoms ? <p className="mt-2 text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">Symptoms:</span> {item.symptoms}</p> : null}
                            {item.remedies ? <p className="mt-2 text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">Remedies:</span> {item.remedies}</p> : null}

                            {item.images?.length ? (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    {item.images.slice(0, 3).map((image) => (
                                        <img
                                            key={image.id}
                                            src={resolveApiMediaUrl(image.url)}
                                            alt={item.name}
                                            className="w-full h-20 rounded-lg object-cover border border-outline-variant/20"
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
