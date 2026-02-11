"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Heart,
  MessageCircle,
  Home,
  Users,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "./ui/sheet";
import { NAV_LINKS } from "../lib/site-content";

export default function MainNav() {
  const [open, setOpen] = useState(false);

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/feed", label: "Feed", icon: MessageCircle },
    { href: "/community", label: "Community", icon: Users },
    { href: "/sickness", label: "Pet Health", icon: Stethoscope },
    { href: "/reports", label: "Reports", icon: AlertCircle },
    { href: "/care-teams", label: "Care Teams", icon: Heart },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg md:text-xl"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-sm font-bold">
            🐾
          </div>
          <span className="hidden sm:inline">PetCare Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/reports">
            <Button variant="default" size="sm">
              Start Report
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <button
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle menu</span>
          </button>

          {/* Mobile Menu Sheet */}
          <SheetContent side="left" className="w-full sm:w-80 p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
            </SheetHeader>

            <div className="space-y-1 px-6 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Icon className="w-5 h-5" />
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
                <Button className="w-full mb-2" variant="default">
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
