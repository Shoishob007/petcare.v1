"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { EmptyState, PageSection } from "../components/shared";
import { useToast } from "../components/Toast";
import MediaGrid from "../components/MediaGrid";

type FeedImage = {
  id: string;
  url: string;
  created_at: string;
};

type FeedItem = {
  item_type: "report" | "community";
  id: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  location?: string | null;
  created_at: string;
  images: FeedImage[];
  image_url?: string | null;
  reaction_count?: number;
};

type FeedComment = {
  id: string;
  body: string;
  author_name?: string | null;
  parent_id?: string | null;
  created_at: string;
};

const API_ROOT = "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT}/api/v1`;
const PAGE_SIZE = 12;

export default function FeedPage() {
  const toast = useToast();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentsByItem, setCommentsByItem] = useState<
    Record<string, FeedComment[]>
  >({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>(
    {},
  );
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const categoryOptions = [
    { label: "All categories", value: "all" },
    { label: "Lost", value: "Lost" },
    { label: "Found", value: "Found" },
    { label: "Sighting", value: "Sighting" },
    { label: "Health", value: "Health" },
    { label: "Care", value: "Care" },
  ];

  async function fetchFeed(reset = false) {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        offset: currentOffset.toString(),
        limit: PAGE_SIZE.toString(),
        filter_type: typeFilter === "all" ? "" : typeFilter,
        filter_category: categoryFilter === "all" ? "" : categoryFilter,
        query,
      });

      const res = await fetch(`${API_BASE}/feed?${params}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load feed");
      }

      const data = (await res.json()) as FeedItem[];

      if (reset) {
        setItems(data);
        setOffset(PAGE_SIZE);
        // Prefetch comments for first few items
        data.slice(0, 5).forEach((item) => {
          fetchComments(item).catch(() => {});
        });
      } else {
        setItems((prev) => [...prev, ...data]);
        setOffset((prev) => prev + PAGE_SIZE);
      }

      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Error loading feed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchFeed(true);
  }, [typeFilter, categoryFilter, query]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (typeFilter !== "all" && item.item_type !== typeFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      if (
        query &&
        !item.title.toLowerCase().includes(query.toLowerCase()) &&
        !item.summary?.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, typeFilter, categoryFilter, query]);

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

  const buildThreads = (comments: FeedComment[]) => {
    const repliesByParent: Record<string, FeedComment[]> = {};
    const roots: FeedComment[] = [];
    comments.forEach((comment) => {
      if (comment.parent_id) {
        repliesByParent[comment.parent_id] =
          repliesByParent[comment.parent_id] || [];
        repliesByParent[comment.parent_id].push(comment);
      } else {
        roots.push(comment);
      }
    });

    const sortByDate = (a: FeedComment, b: FeedComment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    roots.sort(sortByDate);
    Object.values(repliesByParent).forEach((list) => list.sort(sortByDate));

    return roots.map((root) => ({
      root,
      replies: repliesByParent[root.id] || [],
    }));
  };

  const getItemKey = (item: FeedItem) => `${item.item_type}:${item.id}`;

  const getCommentsUrl = (item: FeedItem) =>
    item.item_type === "report"
      ? `${API_BASE}/reports/${item.id}/comments`
      : `${API_BASE}/community-posts/${item.id}/comments`;

  async function fetchComments(item: FeedItem) {
    const res = await fetch(getCommentsUrl(item), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load comments (${res.status})`);
    }
    const data = (await res.json()) as FeedComment[];
    setCommentsByItem((prev) => ({ ...prev, [getItemKey(item)]: data }));
  }

  async function toggleComments(item: FeedItem) {
    const itemKey = getItemKey(item);
    const open = !commentsOpen[itemKey];
    setCommentsOpen((prev) => ({ ...prev, [itemKey]: open }));
    if (!open) {
      setReplyTarget((prev) => ({ ...prev, [itemKey]: null }));
    }
    if (open && !commentsByItem[itemKey]) {
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

  async function submitComment(item: FeedItem, parentId?: string | null) {
    const itemKey = getItemKey(item);
    const draftKey = parentId ? `${itemKey}:${parentId}` : itemKey;
    const draft = parentId ? replyDraft[draftKey] : commentDraft[itemKey];
    if (!draft?.trim()) return;

    try {
      const res = await fetch(getCommentsUrl(item), {
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
      const created = (await res.json()) as FeedComment;
      setCommentsByItem((prev) => ({
        ...prev,
        [itemKey]: [...(prev[itemKey] || []), created],
      }));
      if (parentId) {
        setReplyDraft((prev) => ({ ...prev, [draftKey]: "" }));
        setReplyTarget((prev) => ({ ...prev, [itemKey]: null }));
      } else {
        setCommentDraft((prev) => ({ ...prev, [itemKey]: "" }));
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Error posting comment";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function toggleReaction(item: FeedItem) {
    const itemKey = getItemKey(item);
    const isLiked = likedItems.has(itemKey);

    try {
      const endpoint =
        item.item_type === "report"
          ? `${API_BASE}/reports/${item.id}/reactions`
          : `${API_BASE}/community-posts/${item.id}/reactions`;

      const res = await fetch(endpoint, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(
          `Failed to ${isLiked ? "unlike" : "like"} (${res.status})`,
        );
      }

      // Toggle liked state
      setLikedItems((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(itemKey);
        } else {
          newSet.add(itemKey);
        }
        return newSet;
      });

      // Update reaction count in items
      setItems((prev) =>
        prev.map((i) =>
          getItemKey(i) === itemKey
            ? {
                ...i,
                reaction_count: (i.reaction_count || 0) + (isLiked ? -1 : 1),
              }
            : i,
        ),
      );
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Error toggling reaction";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        {/* Hero Section */}
        <header className="community-hero">
          <div className="community-hero-content">
            <div>
              <p className="eyebrow">Your unified feed</p>
              <h1>Stay updated on reports, posts, and community moments.</h1>
              <p className="subtext">
                Keep track of lost pets, sightings, care updates, and
                neighborhood support all in one place.
              </p>
            </div>
            <div className="community-hero-actions">
              <Button type="button" onClick={() => fetchFeed(true)}>
                {loading && filteredItems.length === 0
                  ? "Refreshing..."
                  : "Refresh feed"}
              </Button>
            </div>
          </div>
        </header>

        {/* Info Panels */}
        <section className="panel-spaced two-column">
          <div className="panel">
            <div className="panel-header">
              <h2>Feed highlights</h2>
              <p>What you'll discover here.</p>
            </div>
            <div className="resource-list">
              <div className="support-card">
                <strong>Lost & found reports</strong>
                <span>Track urgent pet recovery efforts in your area.</span>
              </div>
              <div className="support-card">
                <strong>Community updates</strong>
                <span>
                  Connect with neighbors on care tips and wellness advice.
                </span>
              </div>
              <div className="support-card">
                <strong>Sighting alerts</strong>
                <span>
                  Get notified when help is needed or progress is made.
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Staying organized</h2>
              <p>Use filters to focus your search.</p>
            </div>
            <ul className="feature-list">
              <li>Search by location, pet type, or keywords.</li>
              <li>Filter by report type to find what matters most to you.</li>
              <li>Engage through comments and shares to help neighbors.</li>
            </ul>
          </div>
        </section>

        <section className="panel panel-spaced">
          <div className="panel-header">
            <div>
              <h2>Latest updates</h2>
              <p className="subtext">{filteredItems.length} posts shown</p>
            </div>
            <div className="feed-filters">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="report">Reports</option>
                <option value="community">Community</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts"
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading feed...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredItems.length === 0 && (
            <EmptyState
              icon="📭"
              title="No posts found"
              description="Try adjusting your filters or search terms"
              action={{
                label: "Create a Report",
                onClick: () => (window.location.href = "/reports"),
              }}
            />
          )}

          {/* Feed Grid */}
          {filteredItems.length > 0 && (
            <div className="feed-list">
              {filteredItems.map((item) => {
                const itemKey = getItemKey(item);
                const itemComments = commentsByItem[itemKey] || [];
                const isCommentsOpen = commentsOpen[itemKey];
                const replyKey = replyTarget[itemKey]
                  ? `${itemKey}:${replyTarget[itemKey]}`
                  : itemKey;
                const threads = buildThreads(itemComments);
                const mediaItems = item.images.length
                  ? item.images.map((image) => ({
                      id: image.id,
                      src: `${API_ROOT}${image.url}`,
                      alt: item.title,
                    }))
                  : item.image_url
                    ? [
                        {
                          id: `${item.id}-image`,
                          src: item.image_url.startsWith("/uploads/")
                            ? `${API_ROOT}${item.image_url}`
                            : item.image_url,
                          alt: item.title,
                        },
                      ]
                    : [];

                return (
                  <Card
                    key={`${item.item_type}-${item.id}`}
                    className="self-start overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {mediaItems.length > 0 && (
                      <div className="px-4 pt-4">
                        <MediaGrid items={mediaItems} />
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="p-4">
                      <div className="mb-2">
                        <Badge
                          variant={
                            item.item_type === "report"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {item.item_type === "report"
                            ? "🚨 Report"
                            : "💬 Community"}
                        </Badge>
                      </div>

                      <h3 className="font-semibold line-clamp-2 mb-2 text-base">
                        {item.title}
                      </h3>

                      {item.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.summary}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                        {item.location && (
                          <Badge variant="outline" className="text-xs">
                            📍 {item.location}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mb-4">
                        {formatDate(item.created_at)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t text-muted-foreground text-sm">
                        <button
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                          onClick={() => toggleReaction(item)}
                        >
                          {likedItems.has(itemKey) ? (
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                          <span>{item.reaction_count || 0}</span>
                        </button>
                        <button
                          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                          onClick={() => toggleComments(item)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>
                            {isCommentsOpen ? "Hide" : "Comments"} (
                            {itemComments.length})
                          </span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Comment Preview - Always show if comments exist */}
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
                              onClick={() => toggleComments(item)}
                            >
                              View all {itemComments.length} comments →
                            </button>
                          )}
                        </div>
                      )}

                      {isCommentsOpen && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                          {threads.length > 0 && (
                            <div className="comment-list">
                              {threads.map(({ root, replies }) => (
                                <div key={root.id} className="comment-item">
                                  <div className="comment-meta">
                                    <span>
                                      {root.author_name || "Anonymous"}
                                    </span>
                                    <span>{formatDate(root.created_at)}</span>
                                    <button
                                      className="icon-button"
                                      type="button"
                                      onClick={() =>
                                        setReplyTarget((prev) => ({
                                          ...prev,
                                          [itemKey]: root.id,
                                        }))
                                      }
                                    >
                                      Reply
                                    </button>
                                  </div>
                                  <div>{root.body}</div>
                                  {replies.length > 0 && (
                                    <div className="comment-replies">
                                      {replies.map((reply) => (
                                        <div
                                          key={reply.id}
                                          className="comment-reply"
                                        >
                                          <div className="comment-meta">
                                            <span>
                                              {reply.author_name || "Anonymous"}
                                            </span>
                                            <span>
                                              {formatDate(reply.created_at)}
                                            </span>
                                          </div>
                                          <div>{reply.body}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <form
                            className="comment-form"
                            onSubmit={(event) => {
                              event.preventDefault();
                              submitComment(item);
                            }}
                          >
                            <textarea
                              placeholder="Write a comment"
                              value={commentDraft[itemKey] || ""}
                              onChange={(event) =>
                                setCommentDraft((prev) => ({
                                  ...prev,
                                  [itemKey]: event.target.value,
                                }))
                              }
                            />
                            <Button type="submit" size="sm">
                              Post comment
                            </Button>
                          </form>

                          {replyTarget[itemKey] && (
                            <form
                              className="comment-form"
                              onSubmit={(event) => {
                                event.preventDefault();
                                submitComment(item, replyTarget[itemKey]);
                              }}
                            >
                              <textarea
                                placeholder="Write a reply"
                                value={replyDraft[replyKey] || ""}
                                onChange={(event) =>
                                  setReplyDraft((prev) => ({
                                    ...prev,
                                    [replyKey]: event.target.value,
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
                                      [itemKey]: null,
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mb-12">
              <Button
                onClick={() => fetchFeed(false)}
                disabled={loadingMore}
                size="lg"
                variant="outline"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}

          {!hasMore && filteredItems.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You're all caught up! 🎉</p>
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
