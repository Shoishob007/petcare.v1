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
  Dog, // Using Dog instead of PawPrint
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import Dropdown from "./Dropdown";
import { clearAuthSession, getAuthUser } from "../lib/auth";

export default function MainNav() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");
  const [userMenuAction, setUserMenuAction] = useState("");
  const [mobileUserMenuAction, setMobileUserMenuAction] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const user = getAuthUser();
    setIsAuthenticated(Boolean(user));
    setUserRole((user?.role || "user").toLowerCase());
  }, [pathname]);

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/feed", label: "Updates", icon: MessageCircle },
    { href: "/sickness", label: "Pet Health", icon: Activity },
    { href: "/care-teams", label: "Care Teams", icon: Heart },
  ];

  const getIconColor = (isActive: boolean) => {
    return isActive
      ? "text-primary"
      : "text-muted-foreground group-hover:text-foreground";
  };

  const userMenuOptions = [
    { label: "Account", value: "account" },
    ...(userRole === "admin" ? [{ label: "Users", value: "users" }] : []),
    { label: "Logout", value: "logout" },
  ];

  function handleUserMenuSelection(value: string, isMobile = false) {
    if (isMobile) {
      setMobileUserMenuAction("");
    } else {
      setUserMenuAction("");
    }
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
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg md:text-xl group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white">
            <Dog className="w-4 h-4" />
          </div>
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
          {isAuthenticated && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide px-2">
              {userRole}
            </span>
          )}
          {isAuthenticated ? (
            <div className="min-w-[180px]">
              <Dropdown
                label=""
                value={userMenuAction}
                onChange={(value) => handleUserMenuSelection(value, false)}
                options={userMenuOptions}
                placeholder="Account menu"
              />
            </div>
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
                <Dog className="w-5 h-5 text-primary" />
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
                <div className="mb-3">
                  <Dropdown
                    label=""
                    value={mobileUserMenuAction}
                    onChange={(value) => {
                      setOpen(false);
                      handleUserMenuSelection(value, true);
                    }}
                    options={userMenuOptions}
                    placeholder="Account menu"
                  />
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
