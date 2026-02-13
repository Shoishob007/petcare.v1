"use client";

import MainNav from "../components/MainNav";
import SiteFooter from "../components/SiteFooter";
import UpdatesBoard from "../components/UpdatesBoard";

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="community-hero">
          <div className="community-hero-content">
            <div>
              <p className="eyebrow">Community hub</p>
              <h1>Volunteer, report, and share care updates in one place.</h1>
              <p className="subtext">
                This unified board keeps reports and community updates together,
                so neighbors can act faster and stay aligned.
              </p>
            </div>
          </div>
        </header>

        <section className="panel-spaced two-column">
          <div className="panel">
            <div className="panel-header">
              <h2>Community resources</h2>
              <p>Quick references the neighborhood relies on.</p>
            </div>
            <div className="resource-list">
              <div className="support-card">
                <strong>Emergency care</strong>
                <span>Contact your local 24/7 veterinary ER.</span>
              </div>
              <div className="support-card">
                <strong>Lost pet checklist</strong>
                <span>
                  Share recent photos, update microchip info, alert shelters.
                </span>
              </div>
              <div className="support-card">
                <strong>Foster support</strong>
                <span>We match volunteers with short-term care needs.</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Guidelines</h2>
              <p>Keep updates easy to act on.</p>
            </div>
            <ul className="feature-list">
              <li>Use clear titles and specific locations.</li>
              <li>Tag updates to help neighbors filter quickly.</li>
              <li>Update status when the situation changes.</li>
            </ul>
          </div>
        </section>

        <div id="updates-board">
          <UpdatesBoard
            defaultType="community"
            title="Latest community and report updates"
            subtitle="Switch filters to review reports, volunteer requests, and progress updates."
          />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
