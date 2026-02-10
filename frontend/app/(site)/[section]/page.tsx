import Link from "next/link";
import { notFound } from "next/navigation";
import MainNav from "../../components/MainNav";
import ReportsSection from "../../components/ReportsSection";
import SiteFooter from "../../components/SiteFooter";
import { SECTION_CONTENT } from "../../lib/site-content";

type SectionKey = keyof typeof SECTION_CONTENT;

const SECTION_KEYS = Object.keys(SECTION_CONTENT) as SectionKey[];

export function generateStaticParams() {
  return SECTION_KEYS.map((section) => ({ section }));
}

export default function SectionPage({
  params,
}: {
  params: { section: string };
}) {
  const key = params.section as SectionKey;
  const content = SECTION_CONTENT[key];

  if (!content) {
    notFound();
  }

  const showReports = key === "reports";

  return (
    <main className="page">
      <header className="hero">
        <MainNav />

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1>{content.title}</h1>
            <p className="subtext">{content.description}</p>
            <div className="hero-actions">
              <Link className="primary" href={content.ctaHref}>
                {content.ctaLabel}
              </Link>
              <Link className="ghost" href="/">
                Back to home
              </Link>
            </div>
            <div className="stats">
              {content.stats.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-image">
              <img
                src={content.media.hero}
                alt={content.media.heroAlt}
                loading="eager"
              />
              <div className="image-badge">{content.badge}</div>
            </div>
            <div className="hero-cards">
              <div className="image-card">
                <img
                  src={content.media.cardOne}
                  alt="Pet portrait in warm light"
                  loading="lazy"
                />
                <p>{content.media.cardOneText}</p>
              </div>
              <div className="image-card">
                <img
                  src={content.media.cardTwo}
                  alt="Cozy pet moment"
                  loading="lazy"
                />
                <p>{content.media.cardTwoText}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="value-grid">
        {content.features.map((feature) => (
          <div key={feature.title} className="value-card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </section>

      {showReports ? (
        <ReportsSection />
      ) : (
        <section className="panel panel-spaced">
          <div className="panel-header">
            <h2>{content.detail.title}</h2>
            <p>{content.detail.description}</p>
          </div>
          <ul className="feature-list">
            {content.detail.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </section>
      )}

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
