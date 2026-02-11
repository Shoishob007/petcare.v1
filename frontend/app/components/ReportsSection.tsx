"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import Dialog from "./Dialog";
import Dropdown from "./Dropdown";
import MediaGrid from "./MediaGrid";
import { useToast } from "./Toast";

type ReportImage = {
  id: string;
  url: string;
  created_at: string;
};

type ReportResponse = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  category?: string | null;
  status?: string | null;
  species?: string | null;
  urgency?: string | null;
  reporter_name?: string | null;
  created_at: string;
  images: ReportImage[];
  reaction_count: number;
};

type ReportComment = {
  id: string;
  report_id: string;
  body: string;
  author_name?: string | null;
  parent_id?: string | null;
  created_at: string;
};

type ReportCreate = {
  title: string;
  description?: string;
  location?: string;
  category?: string;
  status?: string;
  species?: string;
  urgency?: string;
  reporter_name?: string;
};

const API_ROOT = "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT}/api/v1`;

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Monitoring", value: "monitoring" },
  { label: "Resolved", value: "resolved" },
];

const URGENCY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

const CATEGORY_OPTIONS = [
  { label: "Select category", value: "" },
  { label: "Lost", value: "Lost" },
  { label: "Found", value: "Found" },
  { label: "Sighting", value: "Sighting" },
  { label: "Health", value: "Health" },
  { label: "Care", value: "Care" },
];

const formatLabel = (value?: string | null) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function ReportsSection() {
  const toast = useToast();
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("open");
  const [species, setSpecies] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [reporterName, setReporterName] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("open");
  const [editSpecies, setEditSpecies] = useState("");
  const [editUrgency, setEditUrgency] = useState("medium");
  const [editReporterName, setEditReporterName] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentsByReport, setCommentsByReport] = useState<
    Record<string, ReportComment[]>
  >({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>(
    {},
  );

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  async function fetchReports() {
    setLoadingReports(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reports`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load reports (${res.status})`);
      }
      const data = (await res.json()) as ReportResponse[];
      setReports(data);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function uploadReportImages(reportId: string, selected: File[]) {
    if (selected.length === 0) return [];
    const formData = new FormData();
    selected.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch(`${API_BASE}/reports/${reportId}/images`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Failed to upload images (${res.status})`);
    }

    return (await res.json()) as ReportImage[];
  }

  async function reactToReport(reportId: string) {
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/reactions`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Failed to react (${res.status})`);
      }
      const updated = (await res.json()) as ReportResponse;
      setReports((prev) =>
        prev.map((report) =>
          report.id === updated.id
            ? { ...report, reaction_count: updated.reaction_count }
            : report,
        ),
      );
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function fetchComments(reportId: string) {
    const res = await fetch(`${API_BASE}/reports/${reportId}/comments`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to load comments (${res.status})`);
    }
    const data = (await res.json()) as ReportComment[];
    setCommentsByReport((prev) => ({ ...prev, [reportId]: data }));
  }

  async function toggleComments(reportId: string) {
    const open = !commentsOpen[reportId];
    setCommentsOpen((prev) => ({ ...prev, [reportId]: open }));
    if (open && !commentsByReport[reportId]) {
      try {
        await fetchComments(reportId);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  }

  async function submitComment(reportId: string, parentId?: string | null) {
    const draftKey = parentId ? `${reportId}:${parentId}` : reportId;
    const draft = parentId ? replyDraft[draftKey] : commentDraft[reportId];
    if (!draft?.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: draft.trim(),
          parent_id: parentId || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to add comment (${res.status})`);
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
      toast.success("Comment added successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    const payload: ReportCreate = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      category: category.trim() || undefined,
      status: status.trim() || undefined,
      species: species.trim() || undefined,
      urgency: urgency.trim() || undefined,
      reporter_name: reporterName.trim() || undefined,
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
      let images: ReportImage[] = created.images || [];
      if (files.length > 0) {
        images = await uploadReportImages(created.id, files);
      }

      setReports((prev) => [{ ...created, images }, ...prev]);
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("");
      setStatus("open");
      setSpecies("");
      setUrgency("medium");
      setReporterName("");
      setFiles([]);
      setCreateOpen(false);
      toast.success("Report created successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(report: ReportResponse) {
    setActiveReport(report);
    setEditTitle(report.title);
    setEditDescription(report.description || "");
    setEditLocation(report.location || "");
    setEditCategory(report.category || "");
    setEditStatus(report.status || "open");
    setEditSpecies(report.species || "");
    setEditUrgency(report.urgency || "medium");
    setEditReporterName(report.reporter_name || "");
    setEditFiles([]);
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeReport) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reports/${activeReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          location: editLocation.trim() || undefined,
          category: editCategory.trim() || undefined,
          status: editStatus.trim() || undefined,
          species: editSpecies.trim() || undefined,
          urgency: editUrgency.trim() || undefined,
          reporter_name: editReporterName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update report (${res.status})`);
      }
      const updated = (await res.json()) as ReportResponse;
      let images = updated.images || [];
      if (editFiles.length > 0) {
        images = await uploadReportImages(updated.id, editFiles);
      }
      setReports((prev) =>
        prev.map((report) =>
          report.id === updated.id ? { ...updated, images } : report,
        ),
      );
      setEditOpen(false);
      toast.success("Report updated successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  function openDelete(report: ReportResponse) {
    setActiveReport(report);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!activeReport) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reports/${activeReport.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete report (${res.status})`);
      }
      setReports((prev) =>
        prev.filter((report) => report.id !== activeReport.id),
      );
      setDeleteOpen(false);
      toast.success("Report deleted successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  const selectedFileNames = useMemo(
    () => files.map((file) => file.name),
    [files],
  );

  return (
    <section className="report-section" id="report-form">
      <div className="panel">
        <div className="panel-header">
          <h2>Reports hub</h2>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New report
          </Button>
        </div>
        <p className="subtext">
          Track sightings, health issues, and neighborhood alerts in one place.
          Add photos and urgency tags to keep responses fast.
        </p>
        <ul className="feature-list">
          <li>Attach clear photos for quick identification.</li>
          <li>Use status updates to close the loop.</li>
          <li>Log exact locations to speed up responses.</li>
        </ul>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Latest reports</h2>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={fetchReports}
          >
            {loadingReports ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {loadingReports && reports.length === 0 && <p>Loading...</p>}
        {!loadingReports && reports.length === 0 && (
          <p>No reports yet. Be the first to share one.</p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="report-list">
          {reports.map((report) => {
            const reportComments = commentsByReport[report.id] || [];
            const isCommentsOpen = commentsOpen[report.id];
            const replyKey = replyTarget[report.id]
              ? `${report.id}:${replyTarget[report.id]}`
              : report.id;
            return (
              <article key={report.id} className="social-card">
                <div className="social-header">
                  <div>
                    <h3>{report.title}</h3>
                    <div className="social-meta">
                      {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                  {report.status && (
                    <span className="pill">{formatLabel(report.status)}</span>
                  )}
                </div>
                <p>{report.description || "No details provided yet."}</p>
                {report.images.length > 0 && (
                  <MediaGrid
                    items={report.images.map((image) => ({
                      id: image.id,
                      src: `${API_ROOT}${image.url}`,
                      alt: "Report upload",
                    }))}
                  />
                )}
                <div className="report-meta">
                  <span>{report.category || "General"}</span>
                  <span>{report.location || "Location unknown"}</span>
                  <span>{report.species || "Species unknown"}</span>
                  <span>
                    {formatLabel(report.urgency) || "Urgency not set"}
                  </span>
                  {report.reporter_name && <span>{report.reporter_name}</span>}
                </div>
                <div className="social-actions">
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => reactToReport(report.id)}
                  >
                    React
                  </Button>
                  <span>{report.reaction_count || 0} reactions</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => toggleComments(report.id)}
                  >
                    {isCommentsOpen ? "Hide comments" : "Comments"}
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => openEdit(report)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => openDelete(report)}
                  >
                    Delete
                  </Button>
                </div>
                {isCommentsOpen && (
                  <div className="comment-list">
                    {reportComments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div>{comment.body}</div>
                        <div className="comment-meta">
                          <span>{comment.author_name || "Anonymous"}</span>
                          <span>
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() =>
                              setReplyTarget((prev) => ({
                                ...prev,
                                [report.id]: comment.id,
                              }))
                            }
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
                    <form
                      className="comment-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitComment(report.id);
                      }}
                    >
                      <textarea
                        placeholder="Write a comment"
                        value={commentDraft[report.id] || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({
                            ...prev,
                            [report.id]: e.target.value,
                          }))
                        }
                      />
                      <Button type="submit" size="sm">
                        Post comment
                      </Button>
                    </form>
                    {replyTarget[report.id] && (
                      <form
                        className="comment-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitComment(report.id, replyTarget[report.id]);
                        }}
                      >
                        <textarea
                          placeholder="Write a reply"
                          value={replyDraft[replyKey] || ""}
                          onChange={(e) =>
                            setReplyDraft((prev) => ({
                              ...prev,
                              [replyKey]: e.target.value,
                            }))
                          }
                        />
                        <div className="comment-actions">
                          <Button type="submit" size="sm">
                            Reply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setReplyTarget((prev) => ({
                                ...prev,
                                [report.id]: null,
                              }))
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <Dialog
        open={createOpen}
        title="Create report"
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
            <Button
              type="submit"
              form="create-report-form"
              disabled={!canSubmit || submitting}
            >
              {submitting ? "Saving..." : "Create report"}
            </Button>
          </div>
        }
      >
        <form
          id="create-report-form"
          className="form-grid"
          onSubmit={handleCreate}
        >
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
            <Dropdown
              label="Category"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
            />
          </div>
          <div className="field-row">
            <label>
              Species
              <input
                placeholder="Dog, Cat, Bird"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              />
            </label>
            <label>
              Reporter name
              <input
                placeholder="Your name"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </label>
          </div>
          <div className="field-row">
            <Dropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
            <Dropdown
              label="Urgency"
              value={urgency}
              onChange={setUrgency}
              options={URGENCY_OPTIONS}
            />
          </div>
          <label>
            Images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {selectedFileNames.length > 0 && (
              <div className="file-list">
                {selectedFileNames.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            )}
          </label>
          {error && <p className="error">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={editOpen}
        title="Edit report"
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
              form="edit-report-form"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        }
      >
        <form
          id="edit-report-form"
          className="form-grid"
          onSubmit={handleEditSubmit}
        >
          <label>
            Title
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
          </label>
          <div className="field-row">
            <label>
              Location
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </label>
            <Dropdown
              label="Category"
              value={editCategory}
              onChange={setEditCategory}
              options={CATEGORY_OPTIONS}
            />
          </div>
          <div className="field-row">
            <label>
              Species
              <input
                value={editSpecies}
                onChange={(e) => setEditSpecies(e.target.value)}
              />
            </label>
            <label>
              Reporter name
              <input
                value={editReporterName}
                onChange={(e) => setEditReporterName(e.target.value)}
              />
            </label>
          </div>
          <div className="field-row">
            <Dropdown
              label="Status"
              value={editStatus}
              onChange={setEditStatus}
              options={STATUS_OPTIONS}
            />
            <Dropdown
              label="Urgency"
              value={editUrgency}
              onChange={setEditUrgency}
              options={URGENCY_OPTIONS}
            />
          </div>
          <label>
            Add more images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setEditFiles(Array.from(e.target.files || []))}
            />
          </label>
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        title="Delete report"
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
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to remove this report? This cannot be undone.
        </p>
      </Dialog>
    </section>
  );
}
