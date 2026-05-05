"use client";

import { Bell, LogOut, Menu, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  clearAuthSession,
  getAuthUser,
  resolveAuthImageUrl,
  type AuthUser,
} from '@/lib/auth';

export default function Header() {
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

  const displayName = useMemo(() => {
    if (!user) return '';
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username || user.email;
  }, [user]);

  const avatar = resolveAuthImageUrl(
    user?.profile_image_url || user?.avatar_url || user?.image_url,
  );

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <header className="bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-outline-variant/10">
      <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-extrabold text-primary tracking-tight font-headline">PetCare Hub</Link>
          <nav className="hidden md:flex items-center gap-6 font-headline font-bold text-sm">
            <Link href="/feed" className="text-on-surface hover:text-primary transition-colors">Feed</Link>
            <Link href="/safety" className="text-on-surface hover:text-primary transition-colors">Safety</Link>
            <Link href="/health" className="text-on-surface hover:text-primary transition-colors">Health</Link>
            <Link href="/teams" className="text-on-surface hover:text-primary transition-colors">Teams</Link>
            <Link href="/messages" className="text-on-surface hover:text-primary transition-colors">Chat</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/safety"
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              href="/messages"
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>

            {user ? (
              <>
                <div className="hidden lg:flex items-center gap-2 text-sm">
                  <span className="font-semibold text-on-surface">{displayName}</span>
                </div>
                <Link
                  href="/"
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container relative cursor-pointer ml-1"
                  title={displayName}
                >
                  {avatar ? (
                    <img
                      alt={displayName}
                      className="w-full h-full object-cover"
                      src={avatar}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthSession();
                    window.location.href = '/login';
                  }}
                  className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/30"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : isAuthPage ? null : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button className="lg:hidden p-2 text-on-surface-variant">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
