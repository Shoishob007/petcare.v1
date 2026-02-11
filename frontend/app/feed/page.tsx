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

  return (
    <main className="min-h-screen bg-background">
      <MainNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Community Feed
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Stay connected with your pet community. Discover reports, health
            tips, and care updates from neighbors and professionals.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search posts, people, locations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFeed(true)}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />

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

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "post" : "posts"}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredItems.map((item) => (
              <Card
                key={`${item.item_type}-${item.id}`}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image Section */}
                <div className="relative w-full h-48 bg-muted overflow-hidden group">
                  {(item.images.length > 0 || item.image_url) && (
                    <img
                      src={
                        item.images.length > 0
                          ? `${API_ROOT}${item.images[0].url}`
                          : item.image_url?.startsWith("/uploads/")
                            ? `${API_ROOT}${item.image_url}`
                            : item.image_url || ""
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {item.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                      +{item.images.length - 1}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <Link
                      href={
                        item.item_type === "report" ? "/reports" : "/community"
                      }
                      className="text-white text-sm font-medium hover:underline"
                    >
                      View {item.item_type === "report" ? "Report" : "Post"}
                    </Link>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <div className="mb-2">
                    <Badge
                      variant={
                        item.item_type === "report" ? "default" : "secondary"
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
                    <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{item.reaction_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
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
      </div>

      <PageSection
        title="How to use the feed"
        description="Get the most out of community sharing"
        className="max-w-7xl mx-auto px-4 py-12 mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">📸 Share Clear Photos</h3>
            <p className="text-sm text-muted-foreground">
              Use high-quality images to help identify pets and verify issues
              quickly.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">🏷️ Use Categories</h3>
            <p className="text-sm text-muted-foreground">
              Tag posts correctly so community members can find what they're
              looking for.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">⚡ Mark Urgency</h3>
            <p className="text-sm text-muted-foreground">
              Clearly indicate priority levels in your report descriptions.
            </p>
          </Card>
        </div>
      </PageSection>

      <SiteFooter />
    </main>
  );
}
