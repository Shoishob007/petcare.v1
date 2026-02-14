"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Share2, Sparkles } from "lucide-react";
import Button from "./Button";
import Dialog from "./Dialog";
import Dropdown from "./Dropdown";
import MediaGrid from "./MediaGrid";
import PawLoader from "./PawLoader";
import { useToast } from "./Toast";
import { getAuthToken } from "../lib/auth";

type UpdateItemType = "report" | "community";

type UpdateImage = {
  id: string;
  url: string;
  created_at: string;
};

type UpdateItem = {
  id: string;
  item_type: UpdateItemType;
  title: string;
  content?: string | null;
  category?: string | null;
  location?: string | null;
  status?: string | null;
  species?: string | null;
  urgency?: string | null;
  reporter_name?: string | null;
  author_name?: string | null;
  tags?: string | null;
  image_url?: string | null;
  reaction_count: number;
  created_at: string;
  images: UpdateImage[];
};

type UpdateComment = {
  id: string;
  item_id: string;
  body: string;
  author_name?: string | null;
  parent_id?: string | null;
  created_at: string;
};

type EditableImage = {
  id: string;
  url: string;
  created_at: string;
};

type UpdatesBoardProps = {
  defaultType?: "all" | UpdateItemType;
  title?: string;
  subtitle?: string;
};

const API_ROOTS = [
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
].filter((root, index, arr) => Boolean(root) && arr.indexOf(root) === index);

const DEFAULT_API_ROOT = API_ROOTS[0] || "http://localhost:8000";

async function fetchWithApiFallback(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: Error | null = null;

  for (const root of API_ROOTS) {
    try {
      const res = await fetch(`${root}/api/v1${path}`, init);
      if (res.ok) {
        return res;
      }
      if (res.status >= 500) {
        lastError = new Error(`Request failed (${res.status})`);
        continue;
      }
      return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Network request failed");
    }
  }

  throw lastError || new Error("Unable to reach backend API");
}

const REPORT_CATEGORIES = ["Lost", "Found", "Sighting", "Health", "Care"];
const COMMUNITY_CATEGORIES = [
  "Volunteer",
  "Tip",
  "Update",
  "Adoption",
  "Event",
];

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
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString();
};

const getInitials = (name?: string | null) => {
  if (!name) return "PC";
  const parts = name.trim().split(" ");
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "PC";
};

const parseTags = (tags?: string | null) =>
  (tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const getCategoryOptions = (items: UpdateItem[]) => {
  const categories = new Set<string>([
    ...REPORT_CATEGORIES,
    ...COMMUNITY_CATEGORIES,
  ]);
  items.forEach((item) => {
    if (item.category) categories.add(item.category);
  });
  return ["all", ...Array.from(categories).sort()];
};

export default function UpdatesBoard({
  defaultType = "all",
  title = "Browse your feed",
  subtitle = "Manage pet reports and community updates from one shared hub.",
}: UpdatesBoardProps) {
  const toast = useToast();
  const [items, setItems] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>(defaultType);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [draftType, setDraftType] = useState<UpdateItemType>("report");
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("open");
  const [urgencyDraft, setUrgencyDraft] = useState("medium");
  const [speciesDraft, setSpeciesDraft] = useState("");
  const [reporterNameDraft, setReporterNameDraft] = useState("");
  const [authorNameDraft, setAuthorNameDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [filesDraft, setFilesDraft] = useState<File[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<UpdateItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState("open");
  const [editUrgency, setEditUrgency] = useState("medium");
  const [editSpecies, setEditSpecies] = useState("");
  const [editReporterName, setEditReporterName] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editExistingImages, setEditExistingImages] = useState<EditableImage[]>(
    [],
  );
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(
    new Set(),
  );

  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentsByItem, setCommentsByItem] = useState<
    Record<string, UpdateComment[]>
  >({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>(
    {},
  );
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editPreviewUrls, setEditPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    setTypeFilter(defaultType);
  }, [defaultType]);

  useEffect(() => {
    if (defaultType === "report" || defaultType === "community") {
      setDraftType(defaultType);
    }
  }, [defaultType]);

  const itemKey = (item: UpdateItem) => `${item.item_type}:${item.id}`;

  const requireAuthToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to perform this action.");
      window.location.href = "/login";
      return null;
    }
    return token;
  };

  async function fetchUpdates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithApiFallback(`/updates`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load updates (${res.status})`);
      }
      const data = (await res.json()) as UpdateItem[];
      setItems(data);
      data.slice(0, 5).forEach((item) => {
        fetchComments(item).catch(() => {});
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUpdates();
  }, []);

  async function uploadImages(
    itemType: UpdateItemType,
    itemId: string,
    selected: File[],
    token: string,
  ) {
    if (selected.length === 0) return [];
    const formData = new FormData();
    selected.forEach((file) => formData.append("files", file));
    const res = await fetchWithApiFallback(
      `/updates/${itemType}/${itemId}/images`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to upload images (${res.status})`);
    }
    return (await res.json()) as UpdateImage[];
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!titleDraft.trim()) return;
    if (draftType === "community" && !contentDraft.trim()) return;

    setSaving(true);
    setFormError(null);
    try {
      const token = requireAuthToken();
      if (!token) return;

      const payload = {
        item_type: draftType,
        title: titleDraft.trim(),
        content: contentDraft.trim() || undefined,
        category: categoryDraft.trim() || undefined,
        location: locationDraft.trim() || undefined,
        status: draftType === "report" ? statusDraft : undefined,
        urgency: draftType === "report" ? urgencyDraft : undefined,
        species:
          draftType === "report" ? speciesDraft.trim() || undefined : undefined,
        reporter_name:
          draftType === "report"
            ? reporterNameDraft.trim() || undefined
            : undefined,
        author_name:
          draftType === "community"
            ? authorNameDraft.trim() || undefined
            : undefined,
        tags:
          draftType === "community" ? tagsDraft.trim() || undefined : undefined,
        image_url:
          draftType === "community"
            ? imageUrlDraft.trim() || undefined
            : undefined,
      };

      const res = await fetchWithApiFallback(`/updates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        throw new Error("Please login to create updates.");
      }
      if (!res.ok) {
        throw new Error(`Failed to create update (${res.status})`);
      }
      let created = (await res.json()) as UpdateItem;
      if (filesDraft.length > 0) {
        const uploaded = await uploadImages(
          created.item_type,
          created.id,
          filesDraft,
          token,
        );
        created = { ...created, images: uploaded };
      }
      setItems((prev) => [created, ...prev]);
      setCreateOpen(false);
      setTitleDraft("");
      setContentDraft("");
      setCategoryDraft("");
      setLocationDraft("");
      setStatusDraft("open");
      setUrgencyDraft("medium");
      setSpeciesDraft("");
      setReporterNameDraft("");
      setAuthorNameDraft("");
      setTagsDraft("");
      setImageUrlDraft("");
      setFilesDraft([]);
      setPreviewUrls([]);
      toast.success("Update created successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(item: UpdateItem) {
    setActiveItem(item);
    setEditTitle(item.title);
    setEditContent(item.content || "");
    setEditCategory(item.category || "");
    setEditLocation(item.location || "");
    setEditStatus(item.status || "open");
    setEditUrgency(item.urgency || "medium");
    setEditSpecies(item.species || "");
    setEditReporterName(item.reporter_name || "");
    setEditAuthorName(item.author_name || "");
    setEditTags(item.tags || "");
    setEditImageUrl(item.image_url || "");
    setEditFiles([]);
    setEditExistingImages(item.images || []);
    setRemovedImageIds(new Set());
    setEditOpen(true);
    setFormError(null);
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
    itemType: UpdateItemType,
    itemId: string,
    imageId: string,
    token: string,
  ) {
    const res = await fetchWithApiFallback(
      `/updates/${itemType}/${itemId}/images/${imageId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to remove image (${res.status})`);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeItem) return;

    setActionLoading(true);
    setFormError(null);
    try {
      const token = requireAuthToken();
      if (!token) return;

      const payload = {
        title: editTitle.trim() || undefined,
        content: editContent.trim() || undefined,
        category: editCategory.trim() || undefined,
        location: editLocation.trim() || undefined,
        status: activeItem.item_type === "report" ? editStatus : undefined,
        urgency: activeItem.item_type === "report" ? editUrgency : undefined,
        species:
          activeItem.item_type === "report"
            ? editSpecies.trim() || undefined
            : undefined,
        reporter_name:
          activeItem.item_type === "report"
            ? editReporterName.trim() || undefined
            : undefined,
        author_name:
          activeItem.item_type === "community"
            ? editAuthorName.trim() || undefined
            : undefined,
        tags:
          activeItem.item_type === "community"
            ? editTags.trim() || undefined
            : undefined,
        image_url:
          activeItem.item_type === "community"
            ? editImageUrl.trim() || undefined
            : undefined,
      };

      const res = await fetchWithApiFallback(
        `/updates/${activeItem.item_type}/${activeItem.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (res.status === 401) {
        throw new Error("Please login to edit updates.");
      }
      if (!res.ok) {
        throw new Error(`Failed to update (${res.status})`);
      }
      let updated = (await res.json()) as UpdateItem;

      const markedForDelete = Array.from(removedImageIds);
      for (const imageId of markedForDelete) {
        await deleteExistingImage(
          updated.item_type,
          updated.id,
          imageId,
          token,
        );
      }

      if (markedForDelete.length > 0) {
        updated = {
          ...updated,
          images: (updated.images || []).filter(
            (image) => !removedImageIds.has(image.id),
          ),
        };
      }

      if (editFiles.length > 0) {
        const uploaded = await uploadImages(
          updated.item_type,
          updated.id,
          editFiles,
          token,
        );
        updated = { ...updated, images: uploaded };
      }
      setItems((prev) =>
        prev.map((item) =>
          itemKey(item) === itemKey(updated) ? updated : item,
        ),
      );
      setEditOpen(false);
      setEditExistingImages([]);
      setRemovedImageIds(new Set());
      toast.success("Update saved successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  function openDelete(item: UpdateItem) {
    setActiveItem(item);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!activeItem) return;
    setActionLoading(true);
    setFormError(null);
    try {
      const token = requireAuthToken();
      if (!token) return;

      const res = await fetchWithApiFallback(
        `/updates/${activeItem.item_type}/${activeItem.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 401) {
        throw new Error("Please login to delete updates.");
      }
      if (!res.ok) {
        throw new Error(`Failed to delete (${res.status})`);
      }
      setItems((prev) =>
        prev.filter((item) => itemKey(item) !== itemKey(activeItem)),
      );
      setDeleteOpen(false);
      toast.success("Update deleted successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  async function reactToItem(item: UpdateItem) {
    const key = itemKey(item);
    const isLiked = likedItems.has(key);

    try {
      const token = requireAuthToken();
      if (!token) return;

      const res = await fetchWithApiFallback(
        `/updates/${item.item_type}/${item.id}/reactions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 401) {
        throw new Error("Please login to react.");
      }
      if (!res.ok) {
        throw new Error(`Failed to react (${res.status})`);
      }
      const updated = (await res.json()) as UpdateItem;
      setLikedItems((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
      setItems((prev) =>
        prev.map((entry) =>
          itemKey(entry) === key
            ? { ...entry, reaction_count: updated.reaction_count }
            : entry,
        ),
      );
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function fetchComments(item: UpdateItem) {
    const res = await fetchWithApiFallback(
      `/updates/${item.item_type}/${item.id}/comments`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      throw new Error(`Failed to load comments (${res.status})`);
    }
    const data = (await res.json()) as UpdateComment[];
    setCommentsByItem((prev) => ({ ...prev, [itemKey(item)]: data }));
  }

  async function openComments(item: UpdateItem) {
    const key = itemKey(item);
    if (!commentsOpen[key]) {
      setCommentsOpen((prev) => ({ ...prev, [key]: true }));
    }
    if (!commentsByItem[key]) {
      try {
        await fetchComments(item);
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : "Error loading comments";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  }

  async function submitComment(item: UpdateItem, parentId?: string | null) {
    const key = itemKey(item);
    const draftKey = parentId ? `${key}:${parentId}` : key;
    const draft = parentId ? replyDraft[draftKey] : commentDraft[key];
    if (!draft?.trim()) return;
    try {
      const token = requireAuthToken();
      if (!token) return;

      const res = await fetchWithApiFallback(
        `/updates/${item.item_type}/${item.id}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: draft.trim(),
            parent_id: parentId || undefined,
          }),
        },
      );
      if (res.status === 401) {
        throw new Error("Please login to comment.");
      }
      if (!res.ok) {
        throw new Error(`Failed to add comment (${res.status})`);
      }
      const created = (await res.json()) as UpdateComment;
      setCommentsByItem((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), created],
      }));
      if (parentId) {
        setReplyDraft((prev) => ({ ...prev, [draftKey]: "" }));
        setReplyTarget((prev) => ({ ...prev, [key]: null }));
      } else {
        setCommentDraft((prev) => ({ ...prev, [key]: "" }));
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  const buildThreads = (comments: UpdateComment[]) => {
    const repliesByParent: Record<string, UpdateComment[]> = {};
    const roots: UpdateComment[] = [];
    comments.forEach((comment) => {
      if (comment.parent_id) {
        repliesByParent[comment.parent_id] =
          repliesByParent[comment.parent_id] || [];
        repliesByParent[comment.parent_id].push(comment);
      } else {
        roots.push(comment);
      }
    });

    const sortByDate = (a: UpdateComment, b: UpdateComment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    roots.sort(sortByDate);
    Object.values(repliesByParent).forEach((list) => list.sort(sortByDate));

    return roots.map((root) => ({
      root,
      replies: repliesByParent[root.id] || [],
    }));
  };

  useEffect(() => {
    const urls = filesDraft.map((file) => URL.createObjectURL(file));
    const fallback =
      draftType === "community" && imageUrlDraft ? [imageUrlDraft] : [];
    setPreviewUrls(urls.length > 0 ? urls : fallback);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filesDraft, imageUrlDraft, draftType]);

  useEffect(() => {
    const urls = editFiles.map((file) => URL.createObjectURL(file));
    const fallback =
      activeItem?.item_type === "community" && editImageUrl
        ? [editImageUrl]
        : [];
    setEditPreviewUrls(urls.length > 0 ? urls : fallback);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [editFiles, editImageUrl, activeItem]);

  const stats = useMemo(() => {
    const reportCount = items.filter(
      (item) => item.item_type === "report",
    ).length;
    const communityCount = items.filter(
      (item) => item.item_type === "community",
    ).length;
    const urgentCount = items.filter(
      (item) =>
        item.item_type === "report" &&
        (item.urgency === "high" || item.urgency === "critical"),
    ).length;
    return { reportCount, communityCount, urgentCount };
  }, [items]);

  const categoryOptions = useMemo(() => getCategoryOptions(items), [items]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.item_type !== typeFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      if (statusFilter !== "all") {
        if (item.item_type !== "report") return false;
        if (item.status !== statusFilter) return false;
      }
      if (urgencyFilter !== "all") {
        if (item.item_type !== "report") return false;
        if (item.urgency !== urgencyFilter) return false;
      }
      if (!normalized) return true;
      const haystack = `${item.title} ${item.content || ""} ${
        item.location || ""
      } ${item.tags || ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, typeFilter, categoryFilter, statusFilter, urgencyFilter, query]);

  const categoryOptionsForDraft =
    draftType === "report" ? REPORT_CATEGORIES : COMMUNITY_CATEGORIES;

  const categoryOptionsForEdit =
    activeItem?.item_type === "report"
      ? REPORT_CATEGORIES
      : COMMUNITY_CATEGORIES;

  return (
    <section className="panel panel-spaced updates-board">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p className="subtext">{subtitle}</p>
        </div>
        <div className="community-hero-actions">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New Post
          </Button>
          <Button variant="ghost" type="button" onClick={fetchUpdates}>
            {loading ? <PawLoader label="Refreshing" size="sm" /> : "Refresh"}
          </Button>
        </div>
      </div>
      <div className="update-stats">
        <div className="update-stat-card">
          <div className="update-stat-label">Reports</div>
          <strong>{stats.reportCount}</strong>
          <span>Active cases and sightings</span>
        </div>
        <div className="update-stat-card">
          <div className="update-stat-label">Community</div>
          <strong>{stats.communityCount}</strong>
          <span>Help requests and updates</span>
        </div>
        <div className="update-stat-card">
          <div className="update-stat-label">High priority</div>
          <strong>{stats.urgentCount}</strong>
          <span>High and critical urgency</span>
        </div>
      </div>
      <div className="update-filters">
        <Dropdown
          label=""
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: "All types", value: "all" },
            { label: "Reports", value: "report" },
            { label: "Community", value: "community" },
          ]}
        />
        <Dropdown
          label=""
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions.map((option) => ({
            label: option === "all" ? "All categories" : option,
            value: option,
          }))}
        />
        <Dropdown
          label=""
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ label: "All status", value: "all" }, ...STATUS_OPTIONS]}
        />
        <Dropdown
          label=""
          value={urgencyFilter}
          onChange={setUrgencyFilter}
          options={[{ label: "All urgency", value: "all" }, ...URGENCY_OPTIONS]}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, tags, locations"
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
        />
      </div>
      {error && <p className="error">{error}</p>}
      {loading && items.length === 0 && (
        <PawLoader label="Loading updates" size="lg" />
      )}
      {!loading && filteredItems.length === 0 && (
        <div className="update-empty">
          <Sparkles size={18} />
          <div>
            <strong>No updates found</strong>
            <span>Try a different filter or create the first update.</span>
          </div>
        </div>
      )}
      <div className="feed-list">
        {filteredItems.map((item) => {
          const key = itemKey(item);
          const itemComments = commentsByItem[key] || [];
          const isCommentsOpen = commentsOpen[key];
          const replyKey = replyTarget[key]
            ? `${key}:${replyTarget[key]}`
            : key;
          const threads = buildThreads(itemComments);
          const tags = parseTags(item.tags);
          const mediaItems = item.images?.length
            ? item.images.map((image) => ({
                id: image.id,
                src: `${DEFAULT_API_ROOT}${image.url}`,
                alt: item.title,
              }))
            : item.image_url
              ? [
                  {
                    id: `${item.id}-image`,
                    src: item.image_url.startsWith("/uploads/")
                      ? `${DEFAULT_API_ROOT}${item.image_url}`
                      : item.image_url,
                    alt: item.title,
                  },
                ]
              : [];
          const displayName =
            item.item_type === "report"
              ? item.reporter_name || "Anonymous reporter"
              : item.author_name || "PetCare Community";

          return (
            <article
              key={key}
              className={`social-card update-card update-card-${item.item_type}`}
            >
              <div className="social-header">
                <div className="social-author">
                  <div className="social-avatar">
                    {getInitials(displayName)}
                  </div>
                  <div className="social-author-meta">
                    <div className="social-name">{displayName}</div>
                    <div className="social-meta">
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
                <div className="update-pill-row">
                  <span className={`update-pill update-pill-${item.item_type}`}>
                    {item.item_type === "report" ? "Report" : "Community"}
                  </span>
                  {item.category && (
                    <span className="pill">{item.category}</span>
                  )}
                  {item.item_type === "report" && item.status && (
                    <span className="pill">{formatLabel(item.status)}</span>
                  )}
                  {item.item_type === "report" && item.urgency && (
                    <span
                      className={`update-urgency update-urgency-${item.urgency}`}
                    >
                      {formatLabel(item.urgency)}
                    </span>
                  )}
                </div>
              </div>

              <div className="social-body">
                <h3 className="social-title">{item.title}</h3>
                {item.content && <p className="social-text">{item.content}</p>}
              </div>

              {mediaItems.length > 0 && <MediaGrid items={mediaItems} />}

              <div className="update-meta">
                {item.location && (
                  <span className="update-chip">Location: {item.location}</span>
                )}
                {item.item_type === "report" && item.species && (
                  <span className="update-chip">Species: {item.species}</span>
                )}
                {item.item_type === "report" && item.reporter_name && (
                  <span className="update-chip">
                    Reporter: {item.reporter_name}
                  </span>
                )}
                {item.item_type === "community" && tags.length > 0 && (
                  <span className="update-chip">
                    Tags: {tags.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>

              <div className="social-stats">
                <span>{item.reaction_count || 0} reactions</span>
                <span>{itemComments.length} comments</span>
              </div>

              <div className="social-footer">
                <div className="social-actions">
                  <button
                    className="social-action"
                    type="button"
                    onClick={() => reactToItem(item)}
                  >
                    {likedItems.has(key) ? (
                      <Heart size={16} className="fill-red-500 text-red-500" />
                    ) : (
                      <Heart size={16} />
                    )}
                    React
                  </button>
                  <button
                    className="social-action"
                    type="button"
                    onClick={() => openComments(item)}
                  >
                    <MessageCircle size={16} />
                    Comment
                  </button>
                  <button className="social-action" type="button">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
                <div className="social-admin">
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => openDelete(item)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {!isCommentsOpen && threads.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {threads.slice(0, 2).map(({ root }) => (
                      <div
                        key={root.id}
                        className="bg-muted/30 rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs">
                            {root.author_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(root.created_at)}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-sm line-clamp-2">
                          {root.body}
                        </div>
                      </div>
                    ))}
                  </div>
                  {threads.length > 2 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline mt-2 font-medium"
                      onClick={() => openComments(item)}
                    >
                      View all {itemComments.length} comments
                    </button>
                  )}
                </div>
              )}

              {isCommentsOpen && (
                <div className="comment-list">
                  {threads.map(({ root, replies }) => (
                    <div key={root.id} className="comment-item">
                      <div className="comment-meta">
                        <span className="comment-head">
                          <span className="comment-avatar">
                            {getInitials(root.author_name || "Anonymous")}
                          </span>
                          <span className="comment-author-name">
                            {root.author_name || "Anonymous"}
                          </span>
                          <span className="comment-type-badge comment">
                            Comment
                          </span>
                        </span>
                        <span className="comment-time">
                          {formatDate(root.created_at)}
                        </span>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() =>
                            setReplyTarget((prev) => ({
                              ...prev,
                              [key]: root.id,
                            }))
                          }
                        >
                          Reply
                        </button>
                      </div>
                      <div className="comment-body">{root.body}</div>
                      {replies.length > 0 && (
                        <div className="comment-replies">
                          {replies.map((reply) => (
                            <div key={reply.id} className="comment-reply">
                              <div className="comment-meta">
                                <span className="comment-head">
                                  <span className="comment-avatar reply">
                                    {getInitials(
                                      reply.author_name || "Anonymous",
                                    )}
                                  </span>
                                  <span className="comment-author-name">
                                    {reply.author_name || "Anonymous"}
                                  </span>
                                  <span className="comment-type-badge reply">
                                    Reply
                                  </span>
                                </span>
                                <span className="comment-time">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <div className="comment-body">{reply.body}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <form
                    className="comment-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitComment(item);
                    }}
                  >
                    <textarea
                      placeholder="Write a comment"
                      value={commentDraft[key] || ""}
                      onChange={(e) =>
                        setCommentDraft((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                    <Button type="submit" size="sm">
                      Post comment
                    </Button>
                  </form>
                  {replyTarget[key] && (
                    <form
                      className="comment-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitComment(item, replyTarget[key]);
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
                              [key]: null,
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
      <Dialog
        open={createOpen}
        title="Create new post"
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
            <Button type="submit" form="create-update-form" disabled={saving}>
              {saving ? (
                <PawLoader label="Saving" size="sm" />
              ) : (
                "Publish update"
              )}
            </Button>
          </div>
        }
      >
        <form
          id="create-update-form"
          className="form-grid"
          onSubmit={handleCreate}
        >
          <Dropdown
            label="Update type"
            value={draftType}
            onChange={(value) => setDraftType(value as UpdateItemType)}
            options={[
              { label: "Report", value: "report" },
              { label: "Community", value: "community" },
            ]}
          />
          <label>
            Title
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Lost golden retriever near Elm St."
              required
            />
          </label>
          <label>
            Details
            <textarea
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              rows={4}
              placeholder={
                draftType === "report"
                  ? "Share the key details for this report."
                  : "Share the update or request for help."
              }
              required={draftType === "community"}
            />
          </label>
          <div className="field-row">
            <Dropdown
              label="Category"
              value={categoryDraft}
              onChange={setCategoryDraft}
              options={[
                { label: "Select category", value: "" },
                ...categoryOptionsForDraft.map((category) => ({
                  label: category,
                  value: category,
                })),
              ]}
            />
            <label>
              Location
              <input
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                placeholder="Neighborhood or city"
              />
            </label>
          </div>

          {draftType === "report" && (
            <>
              <div className="field-row">
                <Dropdown
                  label="Status"
                  value={statusDraft}
                  onChange={setStatusDraft}
                  options={STATUS_OPTIONS}
                />
                <Dropdown
                  label="Urgency"
                  value={urgencyDraft}
                  onChange={setUrgencyDraft}
                  options={URGENCY_OPTIONS}
                />
              </div>
              <div className="field-row">
                <label>
                  Species
                  <input
                    value={speciesDraft}
                    onChange={(e) => setSpeciesDraft(e.target.value)}
                    placeholder="Dog, Cat, Bird"
                  />
                </label>
                <label>
                  Reporter name
                  <input
                    value={reporterNameDraft}
                    onChange={(e) => setReporterNameDraft(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>
            </>
          )}

          {draftType === "community" && (
            <>
              <div className="field-row">
                <label>
                  Organizer name
                  <input
                    value={authorNameDraft}
                    onChange={(e) => setAuthorNameDraft(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Tags
                  <input
                    value={tagsDraft}
                    onChange={(e) => setTagsDraft(e.target.value)}
                    placeholder="volunteer, foster, adoption"
                  />
                </label>
              </div>
              <label>
                Image URL
                <input
                  value={imageUrlDraft}
                  onChange={(e) => setImageUrlDraft(e.target.value)}
                  placeholder="https://"
                />
              </label>
            </>
          )}

          <label>
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFilesDraft(Array.from(e.target.files || []))}
            />
          </label>

          {previewUrls.length > 0 && (
            <MediaGrid
              items={previewUrls.map((src, index) => ({
                id: `${src}-${index}`,
                src: src.startsWith("/uploads/")
                  ? `${DEFAULT_API_ROOT}${src}`
                  : src,
                alt: "Preview",
              }))}
            />
          )}

          {formError && <p className="error">{formError}</p>}
        </form>
      </Dialog>
      <Dialog
        open={editOpen}
        title="Edit update"
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
              form="edit-update-form"
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
        {activeItem && (
          <form
            id="edit-update-form"
            className="form-grid"
            onSubmit={handleEdit}
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
              Details
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
              />
            </label>
            <div className="field-row">
              <Dropdown
                label="Category"
                value={editCategory}
                onChange={setEditCategory}
                options={[
                  { label: "Select category", value: "" },
                  ...categoryOptionsForEdit.map((category) => ({
                    label: category,
                    value: category,
                  })),
                ]}
              />
              <label>
                Location
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </label>
            </div>

            {activeItem.item_type === "report" && (
              <>
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
              </>
            )}

            {activeItem.item_type === "community" && (
              <>
                <div className="field-row">
                  <label>
                    Organizer name
                    <input
                      value={editAuthorName}
                      onChange={(e) => setEditAuthorName(e.target.value)}
                    />
                  </label>
                  <label>
                    Tags
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Image URL
                  <input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                  />
                </label>
              </>
            )}

            <label>
              Add more images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setEditFiles(Array.from(e.target.files || []))}
              />
            </label>

            {editExistingImages.length > 0 && (
              <div className="form-grid">
                <label>Existing images</label>
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
                      ? `${DEFAULT_API_ROOT}${image.url}`
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

            {editPreviewUrls.length > 0 && (
              <MediaGrid
                items={editPreviewUrls.map((src, index) => ({
                  id: `${src}-${index}`,
                  src: src.startsWith("/uploads/")
                    ? `${DEFAULT_API_ROOT}${src}`
                    : src,
                  alt: "Preview",
                }))}
              />
            )}
            {formError && <p className="error">{formError}</p>}
          </form>
        )}
      </Dialog>
      <Dialog
        open={deleteOpen}
        title="Delete update"
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
        <p>Are you sure you want to remove this update?</p>
      </Dialog>
    </section>
  );
}
