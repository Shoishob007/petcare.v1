import Link from "next/link";
import { Heart, Mail, Smartphone } from "lucide-react";

export default function SiteFooter() {
  const footerLinks = [
    {
      section: "Product",
      links: [
        { label: "Updates", href: "/feed" },
        { label: "Reports + Community", href: "/feed" },
        { label: "Pet Health", href: "/sickness" },
        { label: "Care Teams", href: "/care-teams" },
      ],
    },
    {
      section: "Resources",
      links: [
        { label: "Pet Care Tips", href: "/feed" },
        { label: "Health Guide", href: "/sickness" },
        { label: "Safety", href: "/feed" },
        { label: "FAQ", href: "#" },
      ],
    },
    {
      section: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
      ],
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-sm font-bold">
                🐾
              </div>
              <span className="font-bold text-lg">PetCare Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your neighborhood community for pet safety, care coordination, and
              professional support.
            </p>
            <div className="flex gap-2 text-muted-foreground">
              <Heart className="w-4 h-4" />
              <span className="text-xs">
                Made with care for pets everywhere
              </span>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((column) => (
            <div key={column.section} className="space-y-4">
              <h3 className="font-semibold text-sm">{column.section}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact & Bottom Section */}
        <div className="py-8 border-t border-border space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                <span>hello@petcarehub.com</span>
              </div>
              <div className="hidden sm:flex w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Smartphone className="w-4 h-4" />
                <span>1-800-PET-CARE</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center sm:text-right text-xs text-muted-foreground space-y-1 sm:space-y-0">
              <p>© {currentYear} PetCare Hub. All rights reserved.</p>
              <p>
                Built with Nextjs, FastAPI, and ❤️ for pet communities
                worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
