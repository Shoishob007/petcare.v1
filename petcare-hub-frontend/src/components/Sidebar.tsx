"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home as HomeIcon,
  Rss,
  ShieldAlert,
  Library,
  Users,
  MessageSquare,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import {
  clearAuthSession,
  getAuthUser,
  resolveAuthImageUrl,
  type AuthUser,
} from '@/lib/auth';

const navItems = [
  { label: 'Home', href: '/', icon: HomeIcon, mobileLabel: 'Home' },
  { label: 'Community', href: '/feed', icon: Rss, mobileLabel: 'Feed' },
  { label: 'Reports', href: '/safety', icon: ShieldAlert, mobileLabel: 'Reports' },
  { label: 'Health', href: '/health', icon: Library, mobileLabel: 'Health' },
  { label: 'Teams', href: '/teams', icon: Users, mobileLabel: 'Teams' },
  { label: 'Messages', href: '/messages', icon: MessageSquare, mobileLabel: 'Chat' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getAuthUser());
    sync();
    window.addEventListener('petcare-auth-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('petcare-auth-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isAdmin = (user?.role || 'user').toLowerCase() === 'admin';
  const displayName = useMemo(() => {
    if (!user) return 'Guest';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username || user.email;
  }, [user]);

  const avatar = resolveAuthImageUrl(
    user?.profile_image_url || user?.avatar_url || user?.image_url,
  );

  const visibleItems = isAdmin
    ? [...navItems, { label: 'Admin', href: '/admin', icon: LayoutDashboard, mobileLabel: 'Admin' }]
    : navItems;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-outline-variant/30 bg-surface lg:flex">
        <div className="p-6 pb-4">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-lowest p-4 shadow-[var(--shadow-editorial)]">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary text-on-primary shadow-[var(--shadow-float)]">
                <span className="font-headline text-sm font-extrabold tracking-wide">PH</span>
                <span className="pointer-events-none absolute -right-1 -top-1 h-4 w-4 rounded-full bg-secondary/90" />
              </div>
              <div>
                <h1 className="font-headline text-xl font-extrabold text-on-surface">PetCare Hub</h1>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Care Operations Console</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-outline-variant/35 bg-surface px-3.5 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">One Workspace</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Reports, community, messaging, and care-team workflows under one professional shell.
              </p>
            </div>
          </div>
        </div>

        <nav className="hide-scrollbar flex-1 space-y-1 overflow-y-auto px-4 pb-5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary text-on-primary shadow-[var(--shadow-float)]"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "" : "text-on-surface-variant group-hover:text-on-surface")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-outline-variant/30 p-4">
          <Link
            href="/safety"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-tertiary px-4 py-3 text-sm font-bold text-on-tertiary"
          >
            <ClipboardCheck className="h-4 w-4" />
            Create Report
          </Link>

          <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/35 bg-white/70 px-3 py-2.5">
            {avatar ? (
              <img src={avatar} alt={displayName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                {(user?.role || 'guest').toUpperCase()}
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                window.location.href = '/login';
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          ) : (
            <Link href="/login" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
              <User className="w-5 h-5" />
              <span>Login</span>
            </Link>
          )}
        </div>

      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-outline-variant/30 bg-white/95 p-2 shadow-[var(--shadow-editorial)] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {visibleItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl py-2 text-[11px] font-semibold",
                  isActive ? "bg-primary text-on-primary" : "text-on-surface-variant",
                )}
              >
                <item.icon className="mb-1 h-4 w-4" />
                {item.mobileLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
