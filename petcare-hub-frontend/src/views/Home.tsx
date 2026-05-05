"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Activity,
    Heart,
    MessageSquare,
    Shield,
    Users,
    Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type HomeStat = {
    label: string;
    value: string;
};

type HomeFeature = {
    icon: string;
    title: string;
    description: string;
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
};

type FeedItem = {
    id: string;
    item_type: "report" | "community";
    title: string;
    summary?: string | null;
    category?: string | null;
    created_at: string;
    reaction_count: number;
};

const DEFAULT_HOME_CONTENT: HomePageContent = {
    badge: "Pet Operations Workspace",
    title_prefix: "Coordinate care with",
    title_highlight: "confidence",
    description:
        "Unify community updates, safety reports, care teams, and communication in one polished operational platform.",
    primary_cta_label: "Open Feed",
    primary_cta_href: "/feed",
    secondary_cta_label: "Open Reports",
    secondary_cta_href: "/safety",
    stats: [
        { label: "Community Stream", value: "Active" },
        { label: "Care Coordination", value: "Ready" },
    ],
    features: [
        {
            icon: "Shield",
            title: "Safety Reports",
            description: "Instantly capture and review neighborhood safety incidents.",
        },
        {
            icon: "Users",
            title: "Care Teams",
            description: "Coordinate trusted caregivers with role-based access.",
        },
        {
            icon: "Heart",
            title: "Pet Wellness",
            description: "Track symptom entries and community support actions.",
        },
    ],
};

const ICONS = {
    Shield,
    Users,
    Heart,
    MessageSquare,
    Zap,
    Activity,
} as const;

export default function Home() {
    const [content, setContent] = useState<HomePageContent>(DEFAULT_HOME_CONTENT);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [contentRes, feedRes] = await Promise.all([
                    apiFetch("/homepage-content", { cache: "no-store" }),
                    apiFetch("/feed?limit=5", { cache: "no-store" }),
                ]);

                if (contentRes.ok) {
                    const payload = (await contentRes.json()) as HomePageContent;
                    setContent(payload);
                }

                if (feedRes.ok) {
                    const feedPayload = (await feedRes.json()) as FeedItem[];
                    setFeed(feedPayload || []);
                }
            } catch {
                setContent(DEFAULT_HOME_CONTENT);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const features = useMemo(() => content.features || [], [content.features]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
            <section className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                    <span className="inline-flex px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">
                        {content.badge}
                    </span>

                    <h1 className="font-headline text-5xl lg:text-6xl font-extrabold leading-tight">
                        {content.title_prefix} <span className="text-primary">{content.title_highlight}</span>
                    </h1>

                    <p className="text-on-surface-variant text-lg leading-relaxed">
                        {content.description}
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <Link href={content.primary_cta_href} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">
                            {content.primary_cta_label}
                        </Link>
                        <Link href={content.secondary_cta_href} className="border border-outline-variant/30 px-6 py-3 rounded-xl font-bold">
                            {content.secondary_cta_label}
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        {content.stats.map((stat) => (
                            <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20">
                                <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
                                <p className="text-xs uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/15 shadow-sm">
                    <h2 className="font-headline text-2xl font-bold mb-3">Operations Pulse</h2>
                    <p className="text-on-surface-variant mb-4">
                        Stay on top of urgent reports, social engagement, and message activity from one central command area.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-surface-container-high p-3">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Status</p>
                            <p className="mt-1 font-bold">All Systems Ready</p>
                        </div>
                        <div className="rounded-xl bg-surface-container-high p-3">
                            <p className="text-xs uppercase tracking-widest text-on-surface-variant">Moderation</p>
                            <p className="mt-1 font-bold">Role-Based Control</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="font-headline text-3xl font-bold mb-6">Platform Features</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feature) => {
                        const Icon = ICONS[feature.icon as keyof typeof ICONS] || Activity;
                        return (
                            <article key={feature.title} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/15">
                                <Icon className="w-6 h-6 text-primary mb-3" />
                                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed">{feature.description}</p>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-headline text-3xl font-bold">Latest Activity</h2>
                    <Link href="/feed" className="text-primary font-bold">View all</Link>
                </div>

                {loading ? <p className="text-on-surface-variant">Loading latest updates...</p> : null}
                {!loading && feed.length === 0 ? <p className="text-on-surface-variant">No updates yet.</p> : null}

                <div className="space-y-3">
                    {feed.map((item) => (
                        <article key={`${item.item_type}-${item.id}`} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/15">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                                        {item.item_type} {item.category ? `• ${item.category}` : ""}
                                    </p>
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                </div>
                                <span className="text-xs text-on-surface-variant">
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                            </div>
                            {item.summary ? (
                                <p className="text-on-surface-variant mt-2 line-clamp-2">{item.summary}</p>
                            ) : null}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
