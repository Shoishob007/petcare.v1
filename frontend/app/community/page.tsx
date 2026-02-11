"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import Dropdown from "../components/Dropdown";
import MainNav from "../components/MainNav";
import MediaGrid from "../components/MediaGrid";
import SiteFooter from "../components/SiteFooter";
import { useToast } from "../components/Toast";

type CommunityPost = {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  author_name?: string | null;
  image_url?: string | null;
  reaction_count: number;
  images: CommunityPostImage[];
  created_at: string;
};

type CommunityPostImage = {
  id: string;
  url: string;
  created_at: string;
};

type CommunityComment = {
  id: string;
  post_id: string;
  body: string;
  author_name?: string | null;
  parent_id?: string | null;
  created_at: string;
};

const API_ROOT = "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT}/api/v1`;

const CATEGORY_OPTIONS = [
  { label: "Select category", value: "" },
  { label: "Volunteer", value: "Volunteer" },
  { label: "Tip", value: "Tip" },
  { label: "Update", value: "Update" },
  { label: "Adoption", value: "Adoption" },
  { label: "Event", value: "Event" },
];

export default function CommunityPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, CommunityComment[]>
  >({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>(
    {},
  );

  async function fetchPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/community-posts`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load posts (${res.status})`);
      }
      const data = (await res.json()) as CommunityPost[];
      setPosts(data);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function uploadPostImages(postId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    const res = await fetch(`${API_BASE}/community-posts/${postId}/images`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Failed to upload images (${res.status})`);
    }
    return (await res.json()) as CommunityPostImage[];
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/community-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category: category.trim() || undefined,
          author_name: authorName.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to create post (${res.status})`);
      }
      let created = (await res.json()) as CommunityPost;
      if (imageFiles.length > 0) {
        const uploaded = await uploadPostImages(created.id, imageFiles);
        created = { ...created, images: uploaded };
      }
      setPosts((prev) => [created, ...prev]);
      setTitle("");
      setBody("");
      setCategory("");
      setAuthorName("");
      setImageUrl("");
      setImageFiles([]);
      setCreateOpen(false);
      toast.success("Post created successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(post: CommunityPost) {
    setActivePost(post);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditCategory(post.category || "");
    setEditAuthorName(post.author_name || "");
    setEditImageUrl(post.image_url || "");
    setEditImageFiles([]);
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activePost) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/community-posts/${activePost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          body: editBody.trim(),
          category: editCategory.trim() || undefined,
          author_name: editAuthorName.trim() || undefined,
          image_url: editImageUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update post (${res.status})`);
      }
      let updated = (await res.json()) as CommunityPost;
      if (editImageFiles.length > 0) {
        const uploaded = await uploadPostImages(updated.id, editImageFiles);
        updated = { ...updated, images: uploaded };
      }
      setPosts((prev) =>
        prev.map((post) => (post.id === updated.id ? updated : post)),
      );
      setEditOpen(false);
      toast.success("Post updated successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  function openDelete(post: CommunityPost) {
    setActivePost(post);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!activePost) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/community-posts/${activePost.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete post (${res.status})`);
      }
      setPosts((prev) => prev.filter((post) => post.id !== activePost.id));
      setDeleteOpen(false);
      toast.success("Post deleted successfully!");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  }

  async function reactToPost(postId: string) {
    try {
      const res = await fetch(
        `${API_BASE}/community-posts/${postId}/reactions`,
        {
          method: "POST",
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to react (${res.status})`);
      }
      const updated = (await res.json()) as CommunityPost;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === updated.id
            ? { ...post, reaction_count: updated.reaction_count }
            : post,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function fetchComments(postId: string) {
    const res = await fetch(`${API_BASE}/community-posts/${postId}/comments`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to load comments (${res.status})`);
    }
    const data = (await res.json()) as CommunityComment[];
    setCommentsByPost((prev) => ({ ...prev, [postId]: data }));
  }

  async function toggleComments(postId: string) {
    const open = !commentsOpen[postId];
    setCommentsOpen((prev) => ({ ...prev, [postId]: open }));
    if (open && !commentsByPost[postId]) {
      try {
        await fetchComments(postId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
  }

  async function submitComment(postId: string, parentId?: string | null) {
    const draftKey = parentId ? `${postId}:${parentId}` : postId;
    const draft = parentId ? replyDraft[draftKey] : commentDraft[postId];
    if (!draft?.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE}/community-posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: draft.trim(),
            parent_id: parentId || undefined,
          }),
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to add comment (${res.status})`);
      }
      const created = (await res.json()) as CommunityComment;
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      if (parentId) {
        setReplyDraft((prev) => ({ ...prev, [draftKey]: "" }));
        setReplyTarget((prev) => ({ ...prev, [postId]: null }));
      } else {
        setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editPreviewUrls, setEditPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls.length > 0 ? urls : imageUrl ? [imageUrl] : []);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles, imageUrl]);

  useEffect(() => {
    const urls = editImageFiles.map((file) => URL.createObjectURL(file));
    setEditPreviewUrls(
      urls.length > 0 ? urls : editImageUrl ? [editImageUrl] : [],
    );
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [editImageFiles, editImageUrl]);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(posts.map((post) => post.category).filter(Boolean) as string[]),
    );
    categories.sort();
    return [{ label: "All categories", value: "all" }].concat(
      categories.map((cat) => ({ label: cat, value: cat })),
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false;
      }
      if (!normalized) return true;
      const haystack = `${post.title} ${post.body}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [posts, query, categoryFilter]);

  return (
    <main className="page">
      <header className="hero">
        <MainNav />
        <div className="page-header">
          <p className="eyebrow">Community support</p>
          <h1>Share updates, coordinate volunteers, and keep hope high.</h1>
          <p className="subtext">
            This is the living community board for help requests, reunions, and
            wellness tips.
          </p>
          <div className="hero-actions">
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New community post
            </Button>
            <Button variant="ghost" type="button" onClick={fetchPosts}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </header>

      <section className="panel-spaced two-column">
        <div className="panel">
          <div className="panel-header">
            <h2>Community resources</h2>
            <p>Quick references the neighborhood relies on.</p>
          </div>
          <div className="resource-list">
            <div className="support-card">
              <strong>Emergency care</strong>
              <span>Contact your local 24/7 veterinary ER.</span>
            </div>
            <div className="support-card">
              <strong>Lost pet checklist</strong>
              <span>
                Share recent photos, update microchip info, alert shelters.
              </span>
            </div>
            <div className="support-card">
              <strong>Foster support</strong>
              <span>We match volunteers with short-term care needs.</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Guidelines</h2>
            <p>Keep updates easy to act on.</p>
          </div>
          <ul className="feature-list">
            <li>Include a clear title and call-to-action.</li>
            <li>Add a photo so volunteers can recognize pets quickly.</li>
            <li>Tag posts with categories to improve filtering.</li>
          </ul>
        </div>
      </section>

      <section className="panel panel-spaced">
        <div className="panel-header">
          <div>
            <h2>Latest community posts</h2>
            <p className="subtext">{filteredPosts.length} updates shown</p>
          </div>
          <div className="feed-filters">
            <Dropdown
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
            />
            <label className="field">
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts"
              />
            </label>
          </div>
        </div>
        {loading && posts.length === 0 && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        <div className="feed-list">
          {filteredPosts.map((post) => {
            const postComments = commentsByPost[post.id] || [];
            const isCommentsOpen = commentsOpen[post.id];
            const replyKey = replyTarget[post.id]
              ? `${post.id}:${replyTarget[post.id]}`
              : post.id;
            return (
              <article key={post.id} className="social-card">
                <div className="social-header">
                  <div>
                    <h3>{post.title}</h3>
                    <div className="social-meta">
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="pill">{post.category || "Update"}</span>
                </div>
                <p>{post.body}</p>
                {post.images?.length > 0 && (
                  <MediaGrid
                    items={post.images.map((image) => ({
                      id: image.id,
                      src: `${API_ROOT}${image.url}`,
                      alt: "Community post",
                    }))}
                  />
                )}
                {!post.images?.length && post.image_url && (
                  <MediaGrid
                    items={[
                      {
                        src: post.image_url.startsWith("/uploads/")
                          ? `${API_ROOT}${post.image_url}`
                          : post.image_url,
                        alt: "Community post",
                      },
                    ]}
                  />
                )}
                <div className="report-meta">
                  {post.author_name && <span>{post.author_name}</span>}
                </div>
                <div className="social-actions">
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => reactToPost(post.id)}
                  >
                    React
                  </Button>
                  <span>{post.reaction_count || 0} reactions</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => toggleComments(post.id)}
                  >
                    {isCommentsOpen ? "Hide comments" : "Comments"}
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    type="button"
                    onClick={() => openEdit(post)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => openDelete(post)}
                  >
                    Delete
                  </Button>
                </div>
                {isCommentsOpen && (
                  <div className="comment-list">
                    {postComments.map((comment) => (
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
                                [post.id]: comment.id,
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
                        submitComment(post.id);
                      }}
                    >
                      <textarea
                        placeholder="Write a comment"
                        value={commentDraft[post.id] || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                      />
                      <Button type="submit" size="sm">
                        Post comment
                      </Button>
                    </form>
                    {replyTarget[post.id] && (
                      <form
                        className="comment-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitComment(post.id, replyTarget[post.id]);
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
                                [post.id]: null,
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
      </section>

      <Dialog
        open={createOpen}
        title="Create community post"
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
            <Button type="submit" form="create-post-form" disabled={saving}>
              {saving ? "Posting..." : "Post update"}
            </Button>
          </div>
        }
      >
        <form
          id="create-post-form"
          className="form-grid"
          onSubmit={handleSubmit}
        >
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Volunteer walkers needed this weekend"
              required
            />
          </label>
          <label>
            Details
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Share the details and how people can help."
              required
            />
          </label>
          <div className="field-row">
            <Dropdown
              label="Category"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
            />
            <label>
              Your name
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>
          <label>
            Image URL
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
          <label>
            Or upload images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            />
          </label>
          {previewUrls.length > 0 && (
            <MediaGrid
              items={previewUrls.map((src, index) => ({
                id: `${src}-${index}`,
                src: src.startsWith("/uploads/") ? `${API_ROOT}${src}` : src,
                alt: "Preview",
              }))}
            />
          )}
          {error && <p className="error">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={editOpen}
        title="Edit community post"
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
              form="edit-post-form"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        }
      >
        <form
          id="edit-post-form"
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
            Details
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              required
            />
          </label>
          <div className="field-row">
            <Dropdown
              label="Category"
              value={editCategory}
              onChange={setEditCategory}
              options={CATEGORY_OPTIONS}
            />
            <label>
              Your name
              <input
                value={editAuthorName}
                onChange={(e) => setEditAuthorName(e.target.value)}
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
          <label>
            Or upload new images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setEditImageFiles(Array.from(e.target.files || []))
              }
            />
          </label>
          {editPreviewUrls.length > 0 && (
            <MediaGrid
              items={editPreviewUrls.map((src, index) => ({
                id: `${src}-${index}`,
                src: src.startsWith("/uploads/") ? `${API_ROOT}${src}` : src,
                alt: "Preview",
              }))}
            />
          )}
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        title="Delete community post"
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
        <p>Are you sure you want to remove this community post?</p>
      </Dialog>

      <SiteFooter />
    </main>
  );
}
