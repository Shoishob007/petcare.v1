"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import Dropdown from "../components/Dropdown";
import MainNav from "../components/MainNav";
import MediaGrid from "../components/MediaGrid";
import PawLoader from "../components/PawLoader";
import SiteFooter from "../components/SiteFooter";
import { useToast } from "../components/Toast";
import { getAuthToken, getAuthUser } from "../lib/auth";

type Sickness = {
  id: string;
  name: string;
  species?: string | null;
  summary?: string | null;
  symptoms?: string | null;
  remedies?: string | null;
  severity?: string | null;
  created_at: string;
  images: SicknessImage[];
};

type SicknessImage = {
  id: string;
  url: string;
  created_at: string;
};

const API_ROOT = "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT}/api/v1`;

const SEVERITY_OPTIONS = [
  { label: "All severities", value: "all" },
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

const formatLabel = (value?: string | null) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function SicknessPage() {
  const toast = useToast();
  const [items, setItems] = useState<Sickness[]>([]);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [summary, setSummary] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [remedies, setRemedies] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Sickness | null>(null);
  const [editName, setEditName] = useState("");
  const [editSpecies, setEditSpecies] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editSymptoms, setEditSymptoms] = useState("");
  const [editRemedies, setEditRemedies] = useState("");
  const [editSeverity, setEditSeverity] = useState("moderate");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    setIsAdmin((user?.role || "").toLowerCase() === "admin");
  }, []);

  function requireAdminToken() {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login as admin.");
      window.location.href = "/login";
      return null;
    }
    if (!isAdmin) {
      toast.error("Admin role required for this action.");
      return null;
    }
    return token;
  }

  async function fetchSicknesses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sicknesses`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load sicknesses (${res.status})`);
      }
      const data = (await res.json()) as Sickness[];
      setItems(data);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function uploadSicknessImages(
    sicknessId: string,
    files: File[],
    token: string,
  ) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    const res = await fetch(`${API_BASE}/sicknesses/${sicknessId}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Failed to upload images (${res.status})`);
    }
    return (await res.json()) as SicknessImage[];
  }

  useEffect(() => {
    fetchSicknesses();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (severityFilter !== "all" && item.severity !== severityFilter) {
        return false;
      }
      if (!normalized) return true;
      const haystack = `${item.name} ${item.summary ?? ""} ${
        item.symptoms ?? ""
      } ${item.remedies ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query, severityFilter]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = requireAdminToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/sicknesses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          species: species.trim() || undefined,
          summary: summary.trim() || undefined,
          symptoms: symptoms.trim() || undefined,
          remedies: remedies.trim() || undefined,
          severity: severity.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to create sickness (${res.status})`);
      }
      let created = (await res.json()) as Sickness;
      if (imageFiles.length > 0) {
        const uploaded = await uploadSicknessImages(
          created.id,
          imageFiles,
          token,
        );
        created = { ...created, images: uploaded };
      }
      setItems((prev) => [created, ...prev]);
      setName("");
      setSpecies("");
      setSummary("");
      setSymptoms("");
      setRemedies("");
      setSeverity("moderate");
      setImageFiles([]);
      setCreateOpen(false);
      toast.success("Sickness created successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(item: Sickness) {
    setActiveItem(item);
    setEditName(item.name);
    setEditSpecies(item.species || "");
    setEditSummary(item.summary || "");
    setEditSymptoms(item.symptoms || "");
    setEditRemedies(item.remedies || "");
    setEditSeverity(item.severity || "moderate");
    setEditImageFiles([]);
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeItem) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/sicknesses/${activeItem.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          species: editSpecies.trim() || undefined,
          summary: editSummary.trim() || undefined,
          symptoms: editSymptoms.trim() || undefined,
          remedies: editRemedies.trim() || undefined,
          severity: editSeverity.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update sickness (${res.status})`);
      }
      let updated = (await res.json()) as Sickness;
      if (editImageFiles.length > 0) {
        const uploaded = await uploadSicknessImages(
          updated.id,
          editImageFiles,
          token,
        );
        updated = { ...updated, images: uploaded };
      }
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditOpen(false);
      toast.success("Sickness updated successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  function openDelete(item: Sickness) {
    setActiveItem(item);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!activeItem) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = requireAdminToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/sicknesses/${activeItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to delete sickness (${res.status})`);
      }
      setItems((prev) => prev.filter((item) => item.id !== activeItem.id));
      setDeleteOpen(false);
      toast.success("Sickness deleted successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="hero">
          <div className="page-header">
            <p className="eyebrow">Known sickness</p>
            <h1>Quick reference for symptoms, remedies, and care priority.</h1>
            <p className="subtext">
              Use this guide to identify common issues and document the right
              next steps.
            </p>
            <div className="hero-actions">
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={!isAdmin}
              >
                Add condition
              </Button>
              <Button variant="ghost" type="button" onClick={fetchSicknesses}>
                {loading ? (
                  <PawLoader label="Refreshing" size="sm" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </header>

        <section className="panel-spaced two-column">
          <div className="panel">
            <div className="panel-header">
              <h2>Care guide goals</h2>
              <p>Make symptoms and remedies easy to follow.</p>
            </div>
            <ul className="feature-list">
              <li>Document common symptoms so care teams respond faster.</li>
              <li>Capture remedies that help stabilize pets quickly.</li>
              <li>Flag critical cases with high severity.</li>
            </ul>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h2>Quick filters</h2>
              <p>Find conditions faster.</p>
            </div>
            <div className="quick-filters-row">
              <label className="field">
                Search
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search symptoms or remedies"
                />
              </label>
              <Dropdown
                label="Severity"
                value={severityFilter}
                onChange={setSeverityFilter}
                options={SEVERITY_OPTIONS}
              />
            </div>
          </div>
        </section>

        <section className="panel panel-spaced">
          <div className="panel-header">
            <div>
              <h2>Condition library</h2>
              <p className="subtext">{filtered.length} conditions shown</p>
            </div>
          </div>
          {loading && items.length === 0 && (
            <PawLoader label="Loading conditions" size="lg" />
          )}
          {error && <p className="error">{error}</p>}
          <div className="grid-list">
            {filtered.map((item) => (
              <article key={item.id} className="sickness-card">
                <div className="card-header">
                  <h3>{item.name}</h3>
                  {item.severity && (
                    <span className="pill">{formatLabel(item.severity)}</span>
                  )}
                </div>
                <p>{item.summary}</p>
                {item.images?.length > 0 && (
                  <MediaGrid
                    items={item.images.map((image) => ({
                      id: image.id,
                      src: `${API_ROOT}${image.url}`,
                      alt: item.name,
                    }))}
                  />
                )}
                {item.species && (
                  <div className="report-meta">
                    <span>{item.species}</span>
                  </div>
                )}
                {item.symptoms && (
                  <div>
                    <strong>Symptoms</strong>
                    <p>{item.symptoms}</p>
                  </div>
                )}
                {item.remedies && (
                  <div>
                    <strong>Remedies</strong>
                    <p>{item.remedies}</p>
                  </div>
                )}
                <div className="card-actions">
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => openEdit(item)}
                    disabled={!isAdmin}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => openDelete(item)}
                    disabled={!isAdmin}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <Dialog
        open={createOpen}
        title="Add condition"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-sickness-form" disabled={saving}>
              {saving ? (
                <PawLoader label="Saving" size="sm" />
              ) : (
                "Add condition"
              )}
            </Button>
          </div>
        }
      >
        <form
          id="create-sickness-form"
          className="form-grid"
          onSubmit={handleCreate}
        >
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Species
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Dog, Cat"
            />
          </label>
          <label>
            Summary
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
            />
          </label>
          <label>
            Symptoms
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
            />
          </label>
          <label>
            Remedies
            <textarea
              value={remedies}
              onChange={(e) => setRemedies(e.target.value)}
              rows={3}
            />
          </label>
          <Dropdown
            label="Severity"
            value={severity}
            onChange={setSeverity}
            options={SEVERITY_OPTIONS.filter((opt) => opt.value !== "all")}
          />
          <label>
            Photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            />
          </label>
          {error && <p className="error">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={editOpen}
        title="Edit condition"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-sickness-form"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <PawLoader label="Saving" size="sm" />
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        }
      >
        <form
          id="edit-sickness-form"
          className="form-grid"
          onSubmit={handleEditSubmit}
        >
          <label>
            Name
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </label>
          <label>
            Species
            <input
              value={editSpecies}
              onChange={(e) => setEditSpecies(e.target.value)}
            />
          </label>
          <label>
            Summary
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={2}
            />
          </label>
          <label>
            Symptoms
            <textarea
              value={editSymptoms}
              onChange={(e) => setEditSymptoms(e.target.value)}
              rows={3}
            />
          </label>
          <label>
            Remedies
            <textarea
              value={editRemedies}
              onChange={(e) => setEditRemedies(e.target.value)}
              rows={3}
            />
          </label>
          <Dropdown
            label="Severity"
            value={editSeverity}
            onChange={setEditSeverity}
            options={SEVERITY_OPTIONS.filter((opt) => opt.value !== "all")}
          />
          <label>
            Add more photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setEditImageFiles(Array.from(e.target.files || []))
              }
            />
          </label>
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        title="Delete condition"
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <PawLoader label="Deleting" size="sm" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to remove this condition?</p>
      </Dialog>

      <SiteFooter />
    </main>
  );
}
