import Link from "next/link";
import MainNav from "./components/MainNav";
import ReportsSection from "./components/ReportsSection";
import SiteFooter from "./components/SiteFooter";
import { MEDIA } from "./lib/media";

export default function Home() {
  return (
    <main className="page">
      <header className="hero">
        <MainNav />

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Neighborhood pet safety</p>
            <h1>
              A professional care hub for fast reports, safe returns, and
              calmer neighborhoods.
            </h1>
            <p className="subtext">
              Report sightings, share details, and keep everyone in the loop
              with a polished workflow designed for busy pet parents.
            </p>
            <div className="hero-actions">
              <a className="primary" href="#report-form">
                Create a report
              </a>
              <Link className="ghost" href="/reports">
                View reports
              </Link>
            </div>
            <div className="stats">
              <div>
                <strong>2 min</strong>
                <span>Average report time</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Always-on community</span>
              </div>
              <div>
                <strong>1 hub</strong>
                <span>Care, alerts, reunions</span>
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
              <div className="image-badge">Trusted neighborhood care</div>
            </div>
            <div className="hero-cards">
              <div className="image-card">
                <img
                  src={MEDIA.cardOne}
                  alt="Golden retriever puppy in warm light"
                  loading="lazy"
                />
                <p>Gentle reminders for first-time pet parents.</p>
              </div>
              <div className="image-card">
                <img
                  src={MEDIA.cardTwo}
                  alt="Cat resting on a lap with a cozy blanket"
                  loading="lazy"
                />
                <p>Comfort focused, community powered.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="value-grid">
        <div className="value-card">
          <h3>Instant alerts</h3>
          <p>
            Submit reports with consistent, structured data that keeps everyone
            aligned and makes follow-ups painless.
          </p>
        </div>
        <div className="value-card">
          <h3>Care coordination</h3>
          <p>
            Location, category, and description in one clean view so neighbors
            can respond quickly.
          </p>
        </div>
        <div className="value-card">
          <h3>Professional feel</h3>
          <p>
            Build trust with a premium look that feels like a modern pet care
            studio, not a basic form.
          </p>
        </div>
      </section>

      <ReportsSection />

      <section className="cta">
        <div>
          <h2>Keep every pet story moving toward a happy ending.</h2>
          <p>
            PetCare Hub is your polished, reliable space for reports, neighbor
            updates, and care coordination.
          </p>
        </div>
        <Link className="primary" href="/reports">
          Open a report
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
