import Link from "next/link";
import MainNav from "../components/MainNav";
import UpdatesBoard from "../components/UpdatesBoard";
import SiteFooter from "../components/SiteFooter";
import { MEDIA } from "../lib/media";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-background page-shell">
      <MainNav />

      <div className="page">
        <header className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Reports center</p>
              <h1>
                Track pet problems, sightings, and care updates in one feed.
              </h1>
              <p className="subtext">
                Upload images, log symptoms, and keep every report visible for
                neighbors and care teams to respond quickly.
              </p>
              <div className="hero-actions">
                <a className="primary" href="#report-form">
                  Create a report
                </a>
                <Link className="ghost" href="/feed">
                  Open the feed
                </Link>
              </div>
              <div className="stats">
                <div>
                  <strong>1 hub</strong>
                  <span>Reports + community</span>
                </div>
                <div>
                  <strong>Photo ready</strong>
                  <span>Image uploads enabled</span>
                </div>
                <div>
                  <strong>Live</strong>
                  <span>Stay aligned in real time</span>
                </div>
              </div>
            </div>

            <div className="hero-media">
              <div className="hero-image">
                <img
                  src={MEDIA.hero}
                  alt="Dog walking with owner in a park"
                  loading="eager"
                />
                <div className="image-badge">Reports with context</div>
              </div>
              <div className="hero-cards">
                <div className="image-card">
                  <img
                    src={MEDIA.cardOne}
                    alt="Golden retriever puppy in warm light"
                    loading="lazy"
                  />
                  <p>Photo uploads keep reports actionable.</p>
                </div>
                <div className="image-card">
                  <img
                    src={MEDIA.cardTwo}
                    alt="Cat resting on a lap with a cozy blanket"
                    loading="lazy"
                  />
                  <p>Clear details help the care team respond fast.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div id="report-form">
          <UpdatesBoard
            defaultType="report"
            title="Unified reports and community board"
            subtitle="Track urgent reports alongside community updates without switching screens."
          />
        </div>

        <section className="panel panel-spaced">
          <div className="panel-header">
            <h2>What makes reports effective</h2>
            <p>Use these quick guidelines to keep the feed useful.</p>
          </div>
          <ul className="feature-list">
            <li>Add images to show markings, collars, or symptoms.</li>
            <li>Include the exact location and time of last sighting.</li>
            <li>Update the status once the pet is safe.</li>
          </ul>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
