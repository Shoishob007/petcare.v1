"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "./Button";
import { NAV_LINKS } from "../lib/site-content";

export default function MainNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="brand-mark">PetCare</span>
        <span className="brand-sub">Hub</span>
      </Link>
      <div className="nav-links">
        {NAV_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="nav-actions">
        <button className="nav-toggle" type="button" onClick={() => setOpen(true)}>
          Menu
        </button>
        <Link className="nav-cta" href="/reports">
          Start a report
        </Link>
      </div>
      <div
        className={`nav-overlay${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      >
        <div className="nav-panel" onClick={(event) => event.stopPropagation()}>
          <div className="panel-header">
            <strong>Navigate</strong>
            <button className="icon-button" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <div className="nav-actions">
            <Button type="button" onClick={() => setOpen(false)}>
              Back to page
            </Button>
            <Link className="ghost" href="/reports" onClick={() => setOpen(false)}>
              Start a report
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
