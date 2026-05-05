"use client";

import { motion } from "motion/react";

type AnimatedStateProps = {
    title: string;
    message: string;
    tone?: "info" | "warning" | "calm";
    emoji?: string;
    compact?: boolean;
};

export default function AnimatedState({
    title,
    message,
    tone = "info",
    emoji = "🐾",
    compact = false,
}: AnimatedStateProps) {
    const accentClass =
        tone === "warning"
            ? "from-[#ffd7b6] to-[#ffeade]"
            : tone === "calm"
                ? "from-[#c7efe8] to-[#e7faf6]"
                : "from-[#dbe7ff] to-[#eff4ff]";

    return (
        <div
            className={`relative overflow-hidden rounded-3xl border border-outline-variant/35 bg-gradient-to-br ${accentClass} ${compact ? "p-4" : "p-6"}`}
        >
            <motion.div
                className="pointer-events-none absolute -left-12 -top-10 h-36 w-36 rounded-full bg-white/45"
                animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
                transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
            />
            <motion.div
                className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-primary/10"
                animate={{ scale: [1.05, 0.9, 1.05], opacity: [0.22, 0.4, 0.22] }}
                transition={{ repeat: Infinity, duration: 2.9, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex items-center gap-4">
                <motion.div
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm"
                    animate={{ y: [0, -5, 0], rotate: [0, -4, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                >
                    <span>{emoji}</span>
                    <motion.span
                        className="absolute inset-0 rounded-2xl border border-primary/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0, 0.25] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                    />
                </motion.div>

                <div>
                    <p className="font-headline text-lg font-bold text-on-surface">{title}</p>
                    <p className="mt-0.5 text-sm text-on-surface-variant">{message}</p>
                </div>
            </div>
        </div>
    );
}
