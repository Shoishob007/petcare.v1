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
  is_verified?: boolean;
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

const IMAGE_OPTIONS = [
  { label: "All media", value: "all" },
  { label: "With photos", value: "with" },
  { label: "No photos", value: "without" },
];

const formatLabel = (value?: string | null) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function SicknessPage() {
  const toast = useToast();
  const [items, setItems] = useState<Sickness[]>([]);
  const [pendingItems, setPendingItems] = useState<Sickness[]>([]);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
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
  const [editExistingImages, setEditExistingImages] = useState<SicknessImage[]>(
    [],
  );
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(
    new Set(),
  );
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

  async function fetchPendingSicknesses() {
    if (!isAdmin) {
      setPendingItems([]);
      return;
    }
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/sicknesses/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load pending conditions (${res.status})`);
      }
      const data = (await res.json()) as Sickness[];
      setPendingItems(data || []);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      toast.error(errorMsg);
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

  useEffect(() => {
    if (isAdmin) {
      fetchPendingSicknesses();
    }
  }, [isAdmin]);

  async function handleApprovePending(sicknessId: string) {
    const token = requireAdminToken();
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sicknesses/${sicknessId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to approve condition (${res.status})`);
      }
      toast.success("Condition approved.");
      await fetchSicknesses();
      await fetchPendingSicknesses();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectPending(sicknessId: string) {
    const token = requireAdminToken();
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sicknesses/${sicknessId}/reject`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to reject condition (${res.status})`);
      }
      toast.success("Condition rejected.");
      await fetchPendingSicknesses();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  const speciesOptions = useMemo(() => {
    const speciesSet = new Set<string>();
    items.forEach((item) => {
      const normalized = item.species?.trim();
      if (normalized) {
        speciesSet.add(normalized);
      }
    });
    return [
      { label: "All species", value: "all" },
      ...Array.from(speciesSet)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ label: value, value })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (severityFilter !== "all" && item.severity !== severityFilter) {
        return false;
      }
      if (speciesFilter !== "all" && (item.species || "").trim() !== speciesFilter) {
        return false;
      }
      if (mediaFilter === "with" && (!item.images || item.images.length === 0)) {
        return false;
      }
      if (mediaFilter === "without" && item.images && item.images.length > 0) {
        return false;
      }
      if (!normalized) return true;
      const haystack = `${item.name} ${item.summary ?? ""} ${item.symptoms ?? ""
        } ${item.remedies ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query, severityFilter, speciesFilter, mediaFilter]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please login to submit a condition.");
        window.location.href = "/login";
        return;
      }

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
      if (created.is_verified) {
        setItems((prev) => [created, ...prev]);
      }
      setName("");
      setSpecies("");
      setSummary("");
      setSymptoms("");
      setRemedies("");
      setSeverity("moderate");
      setImageFiles([]);
      setCreateOpen(false);
      if (created.is_verified) {
        toast.success("Condition created successfully!");
      } else {
        toast.success("Condition submitted and waiting for admin approval.");
      }
      fetchSicknesses();
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
    setEditExistingImages(item.images || []);
    setRemovedImageIds(new Set());
    setEditOpen(true);
  }

  function toggleRemoveExistingImage(imageId: string) {
    setRemovedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }

  async function deleteExistingImage(
    sicknessId: string,
    imageId: string,
    token: string,
  ) {
    const res = await fetch(`${API_BASE}/sicknesses/${sicknessId}/images/${imageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to remove image (${res.status})`);
    }
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

      const markedForDelete = Array.from(removedImageIds);
      for (const imageId of markedForDelete) {
        await deleteExistingImage(updated.id, imageId, token);
      }

      if (markedForDelete.length > 0) {
        updated = {
          ...updated,
          images: (updated.images || []).filter(
            (image) => !removedImageIds.has(image.id),
          ),
        };
      }

      if (editImageFiles.length > 0) {
        const uploaded = await uploadSicknessImages(
          updated.id,
          editImageFiles,
          token,
        );
        updated = { ...updated, images: [...(updated.images || []), ...uploaded] };
      }
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditOpen(false);
      setEditExistingImages([]);
      setRemovedImageIds(new Set());
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
              >
                Add condition
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  fetchSicknesses();
                  if (isAdmin) fetchPendingSicknesses();
                }}
              >
                {loading ? (
                  <PawLoader label="Refreshing" size="sm" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </header>

        {isAdmin ? (
          <section className="panel panel-spaced">
            <div className="panel-header">
              <div>
                <h2>Pending submissions</h2>
                <p className="subtext">{pendingItems.length} waiting approval</p>
              </div>
            </div>
            {pendingItems.length === 0 ? (
              <p className="subtext">No pending conditions.</p>
            ) : (
              <div className="grid-list condition-grid-list">
                {pendingItems.map((item) => (
                  <article key={item.id} className="sickness-card">
                    <div className="card-header">
                      <h3>{item.name}</h3>
                      {item.severity ? (
                        <span className="pill">{formatLabel(item.severity)}</span>
                      ) : null}
                    </div>
                    <p>{item.summary}</p>
                    <div className="card-actions">
                      <Button
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={() => handleApprovePending(item.id)}
                        disabled={actionLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectPending(item.id)}
                        disabled={actionLoading}
                      >
                        Reject
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="panel panel-spaced">
          <div className="panel-header">
            <div>
              <h2>Condition intelligence</h2>
              <p className="subtext">
                Keep symptoms, remedies, and triage signals organized for faster decisions.
              </p>
            </div>
          </div>
          <div className="grid-list">
            <article className="support-card">
              <h3>Care guide goals</h3>
              <ul className="feature-list">
                <li>Document common symptoms so care teams respond faster.</li>
                <li>Capture remedies that help stabilize pets quickly.</li>
                <li>Flag critical cases with high severity.</li>
              </ul>
            </article>
          </div>
          <div>
            <h3>Quick filters</h3>
            <p className="subtext">Find conditions faster.</p>
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
              <Dropdown
                label="Species"
                value={speciesFilter}
                onChange={setSpeciesFilter}
                options={speciesOptions}
              />
              {/* <Dropdown
                label="Media"
                value={mediaFilter}
                onChange={setMediaFilter}
                options={IMAGE_OPTIONS}
              /> */}
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
          <div className="grid-list condition-grid-list">
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
                    previewLimit={3}
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

          {editExistingImages.length > 0 && (
            <div className="form-grid">
              <label>Existing photos</label>
              <div
                className="grid-list"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "10px",
                }}
              >
                {editExistingImages.map((image) => {
                  const marked = removedImageIds.has(image.id);
                  const imageSrc = image.url.startsWith("/uploads/")
                    ? `${API_ROOT}${image.url}`
                    : image.url;
                  return (
                    <div
                      key={image.id}
                      style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: marked
                          ? "2px solid rgba(176,0,32,0.5)"
                          : "1px solid rgba(31, 92, 74, 0.2)",
                        opacity: marked ? 0.55 : 1,
                      }}
                    >
                      <img
                        src={imageSrc}
                        alt="Existing upload"
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ position: "absolute", top: 6, right: 6 }}
                        onClick={() => toggleRemoveExistingImage(image.id)}
                      >
                        {marked ? "Undo" : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
