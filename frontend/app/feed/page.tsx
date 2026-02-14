"use client";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import UpdatesBoard from "../components/UpdatesBoard";

export default function FeedPage() {
  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="community-hero">
          <div className="community-hero-content">
            <div>
              <p className="eyebrow">Unified updates hub</p>
              <h1>Reports and community posts in one powerful stream.</h1>
              <p className="subtext">
                Create, filter, react, comment, and manage everything from one
                shared board.
              </p>
            </div>
          </div>
        </header>

        <div id="updates-board">
          <UpdatesBoard
            defaultType="all"
            title="Unified community and reports board"
            subtitle="One feature-rich container for reports, community updates, reactions, comments, edits, and media uploads."
          />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
