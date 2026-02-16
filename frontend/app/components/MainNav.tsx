"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  Heart,
  MessageCircle,
  Home,
  Activity,
  LogOut,
  User,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  clearAuthSession,
  getAuthUser,
  resolveAuthImageUrl,
  type AuthUser,
} from "../lib/auth";
import { Avatar } from "./shared/Avatar";
import BrandMark from "./BrandMark";

export default function MainNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const syncUser = () => {
      setUser(getAuthUser());
    };
    syncUser();
    window.addEventListener("petcare-auth-updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("petcare-auth-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [pathname]);

  const isAuthenticated = Boolean(user);
  const userRole = (user?.role || "user").toLowerCase();
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const userDisplayName = fullName || user?.username || user?.email || "User";
  const userImage = resolveAuthImageUrl(
    user?.profile_image_url || user?.avatar_url || user?.image_url,
  );

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/feed", label: "Feed", icon: MessageCircle },
    { href: "/sickness", label: "Pet Health", icon: Activity },
    { href: "/care-teams", label: "Care Teams", icon: Heart },
  ];

  const getIconColor = (isActive: boolean) => {
    return isActive
      ? "text-primary"
      : "text-muted-foreground group-hover:text-foreground";
  };

  function handleUserMenuSelection(value: string) {
    if (!value) return;

    if (value === "account") {
      window.location.href = "/account";
      return;
    }
    if (value === "users" && userRole === "admin") {
      window.location.href = "/users";
      return;
    }
    if (value === "logout") {
      clearAuthSession();
      window.location.href = "/login";
    }
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg md:text-xl group"
        >
          <BrandMark size="md" />
          <span className="hidden sm:inline group-hover:text-primary transition-colors">
            PetCare Hub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group inline-flex items-center justify-center rounded-md text-sm h-10 px-4 py-2 transition-all duration-200 ${
                  isActive
                    ? "font-bold text-primary scale-105"
                    : "font-medium text-muted-foreground hover:text-foreground hover:scale-105"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-2 transition-all ${getIconColor(isActive)}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Open account menu"
                >
                  <Avatar
                    src={userImage}
                    name={userDisplayName}
                    size="sm"
                    className="ring-2 ring-primary/20 shadow-sm"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="font-semibold leading-tight">{userDisplayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                    {userRole}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleUserMenuSelection("account")}>
                  <User className="h-4 w-4" />
                  Account
                </DropdownMenuItem>
                {userRole === "admin" ? (
                  <DropdownMenuItem onSelect={() => handleUserMenuSelection("users")}>
                    <Users className="h-4 w-4" />
                    Users
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleUserMenuSelection("logout")}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/register">
                <Button variant="outline" size="sm">
                  Register
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <button
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Menu Sheet */}
          <SheetContent side="left" className="w-full sm:w-80 p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <BrandMark size="sm" />
                Menu
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-1 px-6 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm transition-all duration-200 ${
                      isActive
                        ? "font-bold text-primary scale-105"
                        : "font-medium text-muted-foreground hover:text-foreground hover:scale-105"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-all ${getIconColor(isActive)}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t px-6 py-4">
              {isAuthenticated && (
                <div className="mb-4 rounded-xl border border-border bg-card/70 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={userImage}
                      name={userDisplayName}
                      size="md"
                      className="ring-2 ring-primary/20 shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-semibold leading-tight">{userDisplayName}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {userRole}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        handleUserMenuSelection("account");
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Button>
                    {userRole === "admin" ? (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => {
                          setOpen(false);
                          handleUserMenuSelection("users");
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Users
                      </Button>
                    ) : null}
                    <Button
                      className="w-full justify-start"
                      variant="ghost"
                      onClick={() => {
                        setOpen(false);
                        handleUserMenuSelection("logout");
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-3">
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <Link href="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full" variant="outline">
                        Register
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button className="w-full" variant="outline">
                        Login
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
