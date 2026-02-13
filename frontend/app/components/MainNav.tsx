"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Heart,
  MessageCircle,
  Home,
  Users,
  Activity,
  AlertTriangle,
  Dog, // Using Dog instead of PawPrint
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

export default function MainNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/feed", label: "Feed", icon: MessageCircle },
    { href: "/community", label: "Community", icon: Users },
    { href: "/sickness", label: "Pet Health", icon: Activity },
    { href: "/reports", label: "Reports", icon: AlertTriangle },
    { href: "/care-teams", label: "Care Teams", icon: Heart },
  ];

  const getIconColor = (isActive: boolean) => {
    return isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground";
  };

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
          <Link href="/reports">
            <Button variant="default" size="sm" className="group">
              {/* <AlertTriangle className="w-4 h-4 mr-2 group-hover:animate-pulse" /> */}
              Start Report
            </Button>
          </Link>
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
              <Link
                href="/reports"
                onClick={() => setOpen(false)}
                className="w-full block"
              >
                <Button className="w-full mb-2 group" variant="default">
                  <AlertTriangle className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                  Start a Report
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Help your community by reporting pet-related issues
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}