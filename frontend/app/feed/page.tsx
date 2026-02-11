"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Dropdown from "../components/Dropdown";
import MainNav from "../components/MainNav";
import MediaGrid from "../components/MediaGrid";
import SiteFooter from "../components/SiteFooter";

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
const PAGE_SIZE = 8;

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  async function fetchFeed(reset = false) {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/feed?limit=${PAGE_SIZE}&offset=${currentOffset}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error(`Failed to load feed (${res.status})`);
      }
      const data = (await res.json()) as FeedItem[];
      setItems((prev) => (reset ? data : [...prev, ...data]));
      setOffset(currentOffset + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchFeed(true);
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(items.map((item) => item.category).filter(Boolean) as string[])
    );
    categories.sort();
    return [{ label: "All categories", value: "all" }].concat(
      categories.map((category) => ({ label: category, value: category }))
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== "all" && item.item_type !== typeFilter) {
        return false;
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (!normalized) return true;
      const haystack = `${item.title} ${item.summary ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, typeFilter, categoryFilter, query]);

  return (
    <main className="page">
      <header className="hero">
        <MainNav />
        <div className="page-header">
          <p className="eyebrow">Dashboard feed</p>
          <h1>One stream for reports, updates, and care coordination.</h1>
          <p className="subtext">
            Scan urgent issues, share community updates, and keep every pet
            story moving forward.
          </p>
          <div className="hero-actions">
            <Link className="primary" href="/reports#report-form">
              Add a report
            </Link>
            <Link className="ghost" href="/community">
              Community updates
            </Link>
          </div>
        </div>
      </header>

      <section className="panel panel-spaced">
        <div className="feed-toolbar">
          <div>
            <h2>Latest activity</h2>
            <p className="subtext">{items.length} updates loaded</p>
          </div>
          <div className="feed-filters">
            <Dropdown
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { label: "All", value: "all" },
                { label: "Reports", value: "report" },
                { label: "Community", value: "community" },
              ]}
            />
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
                placeholder="Search updates"
              />
            </label>
            <Button variant="ghost" size="sm" type="button" onClick={() => fetchFeed(true)}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {loading && items.length === 0 && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        <div className="feed-list">
          {filteredItems.map((item) => (
            <article key={`${item.item_type}-${item.id}`} className="social-card">
              <div className="social-header">
                <div>
                  <h3>{item.title}</h3>
                  <div className="social-meta">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <span className="pill">
                  {item.item_type === "report" ? "Report" : "Community"}
                </span>
              </div>
              <p>{item.summary || "No details provided yet."}</p>
              {item.images.length > 0 && (
                <MediaGrid
                  items={item.images.map((image) => ({
                    id: image.id,
                    src: `${API_ROOT}${image.url}`,
                    alt: "Post media",
                  }))}
                />
              )}
              {!item.images.length && item.image_url && (
                <MediaGrid
                  items={[
                    {
                      src: item.image_url.startsWith("/uploads/")
                        ? `${API_ROOT}${item.image_url}`
                        : item.image_url,
                      alt: "Post media",
                    },
                  ]}
                />
              )}
              <div className="report-meta">
                <span>{item.category || "General"}</span>
                {item.location && <span>{item.location}</span>}
              </div>
              <div className="social-actions">
                <span>{item.reaction_count || 0} reactions</span>
                <Link className="ghost" href={item.item_type === "report" ? "/reports" : "/community"}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="form-actions">
          {hasMore && (
            <Button
              variant="subtle"
              type="button"
              onClick={() => fetchFeed(false)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          )}
          {!hasMore && <p className="subtext">You are all caught up.</p>}
        </div>
      </section>

      <section className="panel panel-spaced">
        <div className="panel-header">
          <h2>How to use the feed</h2>
          <p>Keep posts actionable and easy to scan.</p>
        </div>
        <ul className="feature-list">
          <li>Tag urgency in report descriptions to prioritize responses.</li>
          <li>Add photos for faster recognition and verification.</li>
          <li>Use categories to keep updates organized.</li>
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}
