import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";

type AuthFrameProps = {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    footerText: string;
    footerCtaLabel: string;
    footerCtaHref: string;
};

export default function AuthFrame({
    title,
    subtitle,
    children,
    footerText,
    footerCtaLabel,
    footerCtaHref,
}: AuthFrameProps) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-6 md:px-6 md:py-10">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
            </div>

            <div className="relative mx-auto grid w-full max-w-6xl items-stretch gap-6 rounded-[2rem] border border-outline-variant/30 bg-white/85 p-3 shadow-[var(--shadow-editorial)] md:grid-cols-[1.1fr_1fr]">
                <section className="hidden rounded-[1.5rem] bg-gradient-to-br from-[#0238b3] via-[#0046ff] to-[#1f7cf0] p-10 text-white md:block">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                        <Sparkles className="h-3.5 w-3.5" />
                        PetCare Hub
                    </div>

                    <h2 className="mt-8 max-w-sm font-headline text-4xl font-extrabold leading-tight">
                        Intelligent care operations for modern pet communities.
                    </h2>
                    <p className="mt-4 max-w-md text-white/85">
                        Coordinate reports, social updates, direct messages, and teams from a single secure workspace.
                    </p>

                    <ul className="mt-8 space-y-3 text-sm">
                        <li className="flex items-center gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-white/90" />
                            Secure role-based access and moderation workflows
                        </li>
                        <li className="flex items-center gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-white/90" />
                            Rich media-ready posting and professional feed layouts
                        </li>
                        <li className="flex items-center gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-white/90" />
                            Real-time collaboration for care teams and responders
                        </li>
                    </ul>
                </section>

                <section className="rounded-[1.5rem] bg-surface-container-lowest p-6 md:p-8">
                    <h1 className="font-headline text-3xl font-extrabold text-on-surface md:text-4xl">{title}</h1>
                    <p className="mt-2 text-sm text-on-surface-variant md:text-base">{subtitle}</p>

                    <div className="mt-7">{children}</div>

                    <p className="mt-7 text-sm text-on-surface-variant">
                        {footerText} <Link href={footerCtaHref} className="font-bold text-primary">{footerCtaLabel}</Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
