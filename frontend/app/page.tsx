import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MessageSquare,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import MainNav from "./components/MainNav";
import SiteFooter from "./components/SiteFooter";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { MEDIA } from "./lib/media";

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: "Lost & Found Reports",
      description:
        "Create detailed reports with photos, location, and pet details to help bring pets home safely.",
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Share health concerns, get professional vet advice, and track your pet's medical history.",
    },
    {
      icon: Users,
      title: "Care Community",
      description:
        "Connect with local pet professionals, groomers, trainers, and fellow pet enthusiasts.",
    },
    {
      icon: MessageSquare,
      title: "Real-time Feed",
      description:
        "Comment, react, and get instant notifications when there's activity on your posts.",
    },
    {
      icon: Zap,
      title: "Smart Alerts",
      description:
        "Set location-based alerts to stay informed about pet incidents in your neighborhood.",
    },
    {
      icon: Users,
      title: "Professional Network",
      description:
        "Find verified veterinarians, groomers, trainers, and pet sitters in your area.",
    },
  ];

  const stats = [
    { label: "Active Users", value: "2,847+" },
    { label: "Pets Helped", value: "1,234+" },
    { label: "Reports Posted", value: "5,678+" },
    { label: "Communities", value: "12+" },
  ];

  return (
    <main className="flex flex-col page-shell">
      <MainNav />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                    ✨ Neighborhood Pet Safety
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  Your Pet Community,
                  <span className="text-primary"> Connected & Safe</span>
                </h1>
              </div>

              <p className="text-xl text-muted-foreground max-w-md leading-relaxed">
                Report sightings instantly. Connect with veterinarians and pet
                professionals. Keep your pets safe and your community
                informed—all in one platform designed for pet lovers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/feed#updates-board">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Your First Post
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Explore Community Feed
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="hero-media">
              <div className="hero-image">
                <img
                  src={MEDIA.hero}
                  alt="Pet owner walking a dog in the neighborhood"
                  loading="eager"
                />
                <div className="image-badge">Community-ready reports</div>
              </div>
              <div className="hero-cards">
                <div className="image-card">
                  <img
                    src={MEDIA.cardOne}
                    alt="Pet wellness check"
                    loading="lazy"
                  />
                  <p>Share updates with photos and clear details.</p>
                </div>
                <div className="image-card">
                  <img
                    src={MEDIA.cardTwo}
                    alt="Cozy pet recovery moment"
                    loading="lazy"
                  />
                  <p>Keep care moments close and easy to find.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform for pet safety, health coordination, and
              community connection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              Ready to Join Your Pet Community?
            </h2>
            <p className="text-xl text-muted-foreground">
              Start sharing reports, connecting with professionals, and keeping
              your neighborhood pets safe.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/feed#updates-board">
              <Button size="lg">Create a Post</Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="outline">
                Browse Feed
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
