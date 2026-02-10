import Link from "next/link";
import { NAV_LINKS } from "../lib/site-content";

export default function MainNav() {
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
      <Link className="nav-cta" href="/reports">
        Start a report
      </Link>
    </nav>
  );
}
