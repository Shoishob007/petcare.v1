"use client";

import { useEffect, useMemo, useState } from "react";

type ReportResponse = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  category?: string | null;
  created_at: string;
};

type ReportCreate = {
  title: string;
  description?: string;
  location?: string;
  category?: string;
};

const API_BASE = "http://127.0.0.1:8000/api/v1";

export default function ReportsSection() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  async function fetchReports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reports`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load reports (${res.status})`);
      }
      const data = (await res.json()) as ReportResponse[];
      setReports(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    const payload: ReportCreate = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      category: category.trim() || undefined,
    };

    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to create report (${res.status})`);
      }
      const created = (await res.json()) as ReportResponse;
      setReports((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="report-section" id="report-form">
      <div className="panel">
        <div className="panel-header">
          <h2>Create a report</h2>
          <p>Share details so your community can jump in fast.</p>
        </div>

        <form onSubmit={handleCreate} className="report-form">
          <label>
            Title
            <input
              placeholder="Lost golden retriever near Elm St."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <textarea
              placeholder="Friendly, responds to the name Sunny, blue collar."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <div className="field-row">
            <label>
              Location
              <input
                placeholder="Downtown / Elm St."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            <label>
              Category
              <input
                placeholder="Lost, Found, Sighting"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>
          </div>
          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Saving..." : "Create report"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Latest reports</h2>
          <button className="ghost small" onClick={fetchReports}>
            Refresh
          </button>
        </div>

        {loading && reports.length === 0 && <p>Loading...</p>}
        {!loading && reports.length === 0 && (
          <p>No reports yet. Be the first to share one.</p>
        )}
        <div className="report-list">
          {reports.map((r) => (
            <article key={r.id} className="report-card">
              <div>
                <h3>{r.title}</h3>
                <p>{r.description || "No details provided yet."}</p>
              </div>
              <div className="report-meta">
                <span>{r.category || "General"}</span>
                <span>{r.location || "Location unknown"}</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
