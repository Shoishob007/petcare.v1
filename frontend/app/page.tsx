"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  MessageSquare,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import MainNav from "./components/MainNav";
import SiteFooter from "./components/SiteFooter";
import Dialog from "./components/Dialog";
import PawLoader from "./components/PawLoader";
import { useToast } from "./components/Toast";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { MEDIA } from "./lib/media";
import { apiFetch } from "./lib/api";
import { getAuthToken, getAuthUser } from "./lib/auth";

type HomeStat = {
  label: string;
  value: string;
};

type HomeFeature = {
  icon: string;
  title: string;
  description: string;
};

type HomeAIPathway = {
  title: string;
  description: string;
  disclaimer: string;
};

type HomePageContent = {
  badge: string;
  title_prefix: string;
  title_highlight: string;
  description: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  stats: HomeStat[];
  features: HomeFeature[];
  ai_pathway: HomeAIPathway;
};

const DEFAULT_HOME_CONTENT: HomePageContent = {
  badge: "✨ Neighborhood Pet Safety",
  title_prefix: "Your Pet Community,",
  title_highlight: "Connected & Safe",
  description:
    "Report sightings instantly. Connect with veterinarians and pet professionals. Keep your pets safe and your community informed—all in one platform designed for pet lovers.",
  primary_cta_label: "Create Your First Post",
  primary_cta_href: "/feed#updates-board",
  secondary_cta_label: "Explore Community Feed",
  secondary_cta_href: "/feed",
  stats: [
    { label: "Active Users", value: "2,847+" },
    { label: "Pets Helped", value: "1,234+" },
    { label: "Reports Posted", value: "5,678+" },
    { label: "Communities", value: "12+" },
  ],
  features: [
    {
      icon: "Shield",
      title: "Lost & Found Reports",
      description:
        "Create detailed reports with photos, location, and pet details to help bring pets home safely.",
    },
    {
      icon: "Heart",
      title: "Health & Wellness",
      description:
        "Share health concerns, get professional vet advice, and track your pet's medical history.",
    },
    {
      icon: "Users",
      title: "Care Community",
      description:
        "Connect with local pet professionals, groomers, trainers, and fellow pet enthusiasts.",
    },
    {
      icon: "MessageSquare",
      title: "Real-time Feed",
      description:
        "Comment, react, and get instant notifications when there's activity on your posts.",
    },
    {
      icon: "Zap",
      title: "Smart Alerts",
      description:
        "Set location-based alerts to stay informed about pet incidents in your neighborhood.",
    },
    {
      icon: "Users",
      title: "Professional Network",
      description:
        "Find verified veterinarians, groomers, trainers, and pet sitters in your area.",
    },
  ],
  ai_pathway: {
    title: "AI Readiness for Sickness Insights",
    description:
      "We structure incoming pet symptom/case data so future AI models can support early detection and triage workflows.",
    disclaimer:
      "AI outputs are assistive only and must not replace licensed veterinarian diagnosis or medication decisions.",
  },
};

const ICON_MAP = {
  Shield,
  Heart,
  Users,
  MessageSquare,
  Zap,
} as const;

const parseStatsDraft = (value: string): HomeStat[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, entry] = line.split("|").map((part) => part.trim());
      return { label: label || "Label", value: entry || "0" };
    });

const parseFeaturesDraft = (value: string): HomeFeature[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [icon, title, description] = line.split("|").map((part) => part.trim());
      return {
        icon: icon || "Users",
        title: title || "Feature",
        description: description || "Description",
      };
    });

export default function Home() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [content, setContent] = useState<HomePageContent>(DEFAULT_HOME_CONTENT);
  const [draft, setDraft] = useState<HomePageContent>(DEFAULT_HOME_CONTENT);
  const [authRefreshTick, setAuthRefreshTick] = useState(0);

  const authUser = useMemo(() => getAuthUser(), [authRefreshTick]);
  const isAdmin = (authUser?.role || "user").toLowerCase() === "admin";

  useEffect(() => {
    const syncAuthState = () => setAuthRefreshTick((prev) => prev + 1);
    window.addEventListener("petcare-auth-updated", syncAuthState);
    return () => window.removeEventListener("petcare-auth-updated", syncAuthState);
  }, []);

  useEffect(() => {
    const loadHomeContent = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/homepage-content", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load home content (${res.status})`);
        }
        const payload = (await res.json()) as HomePageContent;
        setContent(payload);
        setDraft(payload);
      } catch {
        setContent(DEFAULT_HOME_CONTENT);
        setDraft(DEFAULT_HOME_CONTENT);
      } finally {
        setLoading(false);
      }
    };

    loadHomeContent();
  }, []);

  const saveHomeContent = async () => {
    if (!isAdmin) return;
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login as admin to update homepage content.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/homepage-content", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Only admin users can edit homepage content.");
        }
        throw new Error(`Save failed (${res.status})`);
      }

      const updated = (await res.json()) as HomePageContent;
      setContent(updated);
      setDraft(updated);
      setEditorOpen(false);
      toast.success("Homepage content updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save homepage content.");
    } finally {
      setSaving(false);
    }
  };

  const statsDraftString = useMemo(
    () => draft.stats.map((entry) => `${entry.label}|${entry.value}`).join("\n"),
    [draft.stats],
  );

  const featuresDraftString = useMemo(
    () =>
      draft.features
        .map((feature) => `${feature.icon}|${feature.title}|${feature.description}`)
        .join("\n"),
    [draft.features],
  );

  return (
    <main className="flex flex-col page-shell">
      <MainNav />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                    {content.badge}
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  {content.title_prefix}
                  <span className="text-primary"> {content.title_highlight}</span>
                </h1>
              </div>

              <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
                {content.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={content.primary_cta_href}>
                  <Button size="lg" className="w-full sm:w-auto">
                    {content.primary_cta_label}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href={content.secondary_cta_href}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {content.secondary_cta_label}
                  </Button>
                </Link>
                {isAdmin && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setEditorOpen(true)}
                  >
                    Edit Homepage
                  </Button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border">
                {content.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="hero-media">
              <div className="hero-image">
                <img
                  src={MEDIA.hero}
                  alt="Pet owner walking a dog in the neighborhood"
                  loading="eager"
                />
                <div className="image-badge">Community-ready reports</div>
              </div>
              <div className="hero-cards">
                <div className="image-card">
                  <img
                    src={MEDIA.cardOne}
                    alt="Pet wellness check"
                    loading="lazy"
                  />
                  <p>Share updates with photos and clear details.</p>
                </div>
                <div className="image-card">
                  <img
                    src={MEDIA.cardTwo}
                    alt="Cozy pet recovery moment"
                    loading="lazy"
                  />
                  <p>Keep care moments close and easy to find.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform for pet safety, health coordination, and
              community connection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon as keyof typeof ICON_MAP] || Users;
              return (
                <Card
                  key={index}
                  className="p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 border border-border/80 bg-background/80">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold">{content.ai_pathway.title}</h2>
              <p className="text-muted-foreground">{content.ai_pathway.description}</p>
              <p className="text-sm text-muted-foreground">{content.ai_pathway.disclaimer}</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              Ready to Join Your Pet Community?
            </h2>
            <p className="text-xl text-muted-foreground">
              Start sharing reports, connecting with professionals, and keeping
              your neighborhood pets safe.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/feed#updates-board">
              <Button size="lg">Create a Post</Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="outline">
                Browse Feed
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Dialog
        open={editorOpen}
        title="Edit homepage content"
        onClose={() => setEditorOpen(false)}
        footer={
          <div className="form-actions">
            <Button variant="outline" type="button" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveHomeContent} disabled={saving}>
              {saving ? <PawLoader label="Saving" size="sm" /> : "Save"}
            </Button>
          </div>
        }
      >
        <div className="form-grid">
          <label>
            Badge
            <input
              value={draft.badge}
              onChange={(e) => setDraft((prev) => ({ ...prev, badge: e.target.value }))}
            />
          </label>
          <div className="field-row">
            <label>
              Title prefix
              <input
                value={draft.title_prefix}
                onChange={(e) => setDraft((prev) => ({ ...prev, title_prefix: e.target.value }))}
              />
            </label>
            <label>
              Title highlight
              <input
                value={draft.title_highlight}
                onChange={(e) => setDraft((prev) => ({ ...prev, title_highlight: e.target.value }))}
              />
            </label>
          </div>
          <label>
            Hero description
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <div className="field-row">
            <label>
              Primary CTA label
              <input
                value={draft.primary_cta_label}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, primary_cta_label: e.target.value }))
                }
              />
            </label>
            <label>
              Primary CTA href
              <input
                value={draft.primary_cta_href}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, primary_cta_href: e.target.value }))
                }
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              Secondary CTA label
              <input
                value={draft.secondary_cta_label}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, secondary_cta_label: e.target.value }))
                }
              />
            </label>
            <label>
              Secondary CTA href
              <input
                value={draft.secondary_cta_href}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, secondary_cta_href: e.target.value }))
                }
              />
            </label>
          </div>
          <label>
            Stats (one per line: Label|Value)
            <textarea
              rows={5}
              value={statsDraftString}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, stats: parseStatsDraft(e.target.value) }))
              }
            />
          </label>
          <label>
            Features (one per line: Icon|Title|Description)
            <textarea
              rows={6}
              value={featuresDraftString}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, features: parseFeaturesDraft(e.target.value) }))
              }
            />
          </label>
          <label>
            AI pathway title
            <input
              value={draft.ai_pathway.title}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  ai_pathway: { ...prev.ai_pathway, title: e.target.value },
                }))
              }
            />
          </label>
          <label>
            AI pathway description
            <textarea
              rows={3}
              value={draft.ai_pathway.description}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  ai_pathway: { ...prev.ai_pathway, description: e.target.value },
                }))
              }
            />
          </label>
          <label>
            AI disclaimer
            <textarea
              rows={2}
              value={draft.ai_pathway.disclaimer}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  ai_pathway: { ...prev.ai_pathway, disclaimer: e.target.value },
                }))
              }
            />
          </label>
        </div>
      </Dialog>

      <SiteFooter />
    </main>
  );
}
