"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  ThumbsUp,
  Edit2,
  Trash2,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import MediaGrid from "./MediaGrid";

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

const urgencyColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const formatLabel = (value?: string | null) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export default function ReportsSection() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
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
  const [activeReport, setActiveReport] = useState<ReportResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("open");
  const [editUrgency, setEditUrgency] = useState("medium");

  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentsByReport, setCommentsByReport] = useState<
    Record<string, ReportComment[]>
  >({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  // Fetch reports
  async function fetchReports() {
    setLoadingReports(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reports`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load reports`);
      const data = (await res.json()) as ReportResponse[];
      setReports(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading reports");
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  // Upload images
  async function uploadReportImages(reportId: string, selected: File[]) {
    if (selected.length === 0) return [];
    const formData = new FormData();
    selected.forEach((file) => formData.append("files", file));

    const res = await fetch(`${API_BASE}/reports/${reportId}/images`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload images");
    return (await res.json()) as ReportImage[];
  }

  // Handle create
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          category: category.trim() || undefined,
          status,
          species: species.trim() || undefined,
          urgency,
          reporter_name: reporterName.trim() || undefined,
        } as ReportCreate),
      });

      if (!res.ok) throw new Error("Failed to create report");
      const created = (await res.json()) as ReportResponse;

      if (files.length > 0) {
        const images = await uploadReportImages(created.id, files);
        created.images = images;
      }

      setReports((prev) => [created, ...prev]);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creating report");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle edit
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeReport) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${activeReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          status: editStatus,
          urgency: editUrgency,
        }),
      });

      if (!res.ok) throw new Error("Failed to update report");
      const updated = (await res.json()) as ReportResponse;

      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setEditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error updating report");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!activeReport) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${activeReport.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete report");

      setReports((prev) => prev.filter((r) => r.id !== activeReport.id));
      setEditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error deleting report");
    } finally {
      setSubmitting(false);
    }
  }

  // React to report
  async function reactToReport(reportId: string) {
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/reactions`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to react");

      const updated = (await res.json()) as ReportResponse;
      setReports((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? { ...r, reaction_count: updated.reaction_count }
            : r,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error reacting");
    }
  }

  // Fetch comments
  async function fetchComments(reportId: string) {
    const res = await fetch(`${API_BASE}/reports/${reportId}/comments`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load comments");

    const data = (await res.json()) as ReportComment[];
    setCommentsByReport((prev) => ({ ...prev, [reportId]: data }));
  }

  // Toggle comments
  async function toggleComments(reportId: string) {
    const isOpen = !commentsOpen[reportId];
    setCommentsOpen((prev) => ({ ...prev, [reportId]: isOpen }));

    if (isOpen && !commentsByReport[reportId]) {
      try {
        await fetchComments(reportId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error loading comments");
      }
    }
  }

  // Submit comment
  async function submitComment(reportId: string) {
    const draft = commentDraft[reportId];
    if (!draft?.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });

      if (!res.ok) throw new Error("Failed to add comment");
      const created = (await res.json()) as ReportComment;

      setCommentsByReport((prev) => ({
        ...prev,
        [reportId]: [...(prev[reportId] || []), created],
      }));
      setCommentDraft((prev) => ({ ...prev, [reportId]: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error posting comment");
    }
  }

  // Open edit dialog
  function openEdit(report: ReportResponse) {
    setActiveReport(report);
    setEditTitle(report.title);
    setEditDescription(report.description || "");
    setEditCategory(report.category || "");
    setEditStatus(report.status || "open");
    setEditUrgency(report.urgency || "medium");
    setEditOpen(true);
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Reports Hub</h1>
          <p className="text-muted-foreground mb-4">
            Track pet sightings, health issues, and neighborhood alerts. Help
            your community stay connected and safe.
          </p>
          <Button onClick={() => setCreateOpen(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loadingReports && reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        )}

        {/* Empty state */}
        {!loadingReports && reports.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No reports yet. Be the first to create one!
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              Create First Report
            </Button>
          </Card>
        )}

        {/* Reports Grid */}
        <div className="space-y-6">
          {/* Refresh button */}
          {reports.length > 0 && (
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
                disabled={loadingReports}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {loadingReports ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          )}

          {reports.map((report) => {
            const reportComments = commentsByReport[report.id] || [];
            const isCommentsOpen = commentsOpen[report.id];

            return (
              <Card
                key={report.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{report.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {formatDate(report.created_at)} by{" "}
                        {report.reporter_name || "Anonymous"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.status && (
                        <Badge
                          variant={
                            report.status === "open"
                              ? "default"
                              : report.status === "monitoring"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {formatLabel(report.status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Card Content */}
                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm leading-relaxed">
                    {report.description || "No details provided yet."}
                  </p>

                  {/* Images */}
                  {report.images.length > 0 && (
                    <div>
                      <MediaGrid
                        items={report.images.map((image) => ({
                          id: image.id,
                          src: `${API_ROOT}${image.url}`,
                          alt: "Report image",
                        }))}
                      />
                    </div>
                  )}

                  {/* Metadata Badges */}
                  <div className="flex flex-wrap gap-2">
                    {report.category && (
                      <Badge variant="outline" className="text-xs">
                        {report.category}
                      </Badge>
                    )}
                    {report.species && (
                      <Badge variant="outline" className="text-xs">
                        {report.species}
                      </Badge>
                    )}
                    {report.location && (
                      <Badge variant="outline" className="text-xs">
                        📍 {report.location}
                      </Badge>
                    )}
                    {report.urgency && (
                      <Badge
                        className={`text-xs ${
                          urgencyColors[
                            report.urgency as keyof typeof urgencyColors
                          ] || "bg-gray-100"
                        }`}
                      >
                        ⚡ {formatLabel(report.urgency)}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reactToReport(report.id)}
                      className="text-xs"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {report.reaction_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(report.id)}
                      className="text-xs"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {reportComments.length > 0
                        ? reportComments.length
                        : "Comment"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(report)}
                      className="text-xs"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveReport(report);
                        setEditOpen(true);
                      }}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {isCommentsOpen && (
                    <div className="border-t pt-4 mt-4 space-y-4">
                      {/* Comments List */}
                      {reportComments.length > 0 && (
                        <div className="space-y-3">
                          {reportComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex gap-2 text-sm"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                              <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                <p className="font-medium text-xs">
                                  {comment.author_name || "Anonymous"}
                                </p>
                                <p className="text-gray-700">{comment.body}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(comment.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Form */}
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitComment(report.id);
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentDraft[report.id] || ""}
                          onChange={(e) =>
                            setCommentDraft((prev) => ({
                              ...prev,
                              [report.id]: e.target.value,
                            }))
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button type="submit" size="sm">
                          Post
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Share information about a lost pet, found animal, or pet-related
              issue
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                placeholder="e.g., Lost golden retriever near Elm St."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                placeholder="Provide details to help identify the pet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Species
                </label>
                <input
                  type="text"
                  placeholder="Dog, Cat, Bird..."
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City or neighborhood..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Reporter Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full"
              />
              {files.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {files.length} file(s) selected
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? "Creating..." : "Create Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen && !!activeReport && !activeReport.id.includes("delete")}
        onOpenChange={setEditOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeReport ? "Edit Report" : ""}</DialogTitle>
          </DialogHeader>

          {activeReport && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Urgency
                </label>
                <select
                  value={editUrgency}
                  onChange={(e) => setEditUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg"
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="mr-auto"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
