import { MEDIA } from "./media";

export const NAV_LINKS = [
  { label: "Feed", href: "/feed" },
  { label: "Reports + Community", href: "/feed" },
  { label: "Sickness Guide", href: "/sickness" },
  { label: "Care Teams", href: "/care-teams" },
  { label: "Community", href: "/feed" },
];

export const SECTION_CONTENT = {
  reports: {
    eyebrow: "Reports center",
    title: "Structured reporting that moves faster and feels calmer.",
    description:
      "Capture the right details once and let neighbors respond with confidence. Reports stay clean, searchable, and ready for action.",
    badge: "Reports that move fast",
    stats: [
      { value: "2 min", label: "Average report time" },
      { value: "24/7", label: "Always-on posts" },
      { value: "1 hub", label: "Care coordination" },
    ],
    features: [
      {
        title: "Unified intake",
        description:
          "Collect location, category, and notes in one polished flow.",
      },
      {
        title: "Clean history",
        description:
          "Every report stays organized so follow-ups are easy and clear.",
      },
      {
        title: "Instant sharing",
        description: "Keep everyone aligned with timely report visibility.",
      },
    ],
    detail: {
      title: "How reports work",
      description:
        "Create a report and we keep it visible in one shared feed so neighbors can respond quickly.",
      bullets: [
        "Add a clear title and description",
        "Include location and category details",
        "Refresh the list to see new posts",
      ],
    },
    ctaLabel: "Open a report",
    ctaHref: "/feed#updates-board",
    media: {
      hero: MEDIA.hero,
      cardOne: MEDIA.cardOne,
      cardTwo: MEDIA.cardTwo,
      cardOneText: "Polished intake that keeps reports tidy.",
      cardTwoText: "Friendly reminders with trusted visuals.",
      heroAlt: "Dog walking with owner in a park",
    },
  },
  "care-teams": {
    eyebrow: "Care teams",
    title: "Coordinate helpers, walkers, and fosters with clarity.",
    description:
      "Keep trusted people aligned with shared notes, schedules, and updates that feel premium and dependable.",
    badge: "Teams built on trust",
    stats: [
      { value: "3 steps", label: "Simple coordination" },
      { value: "One view", label: "Shared timeline" },
      { value: "Local", label: "Neighborhood support" },
    ],
    features: [
      {
        title: "Shared responsibility",
        description:
          "Assign care tasks so everyone knows what is happening next.",
      },
      {
        title: "Clear updates",
        description: "Post quick notes to keep shifts and routines consistent.",
      },
      {
        title: "Trusted partners",
        description:
          "Bring in neighbors or professionals without losing visibility.",
      },
    ],
    detail: {
      title: "Build a care circle",
      description:
        "Care teams keep routines smooth and communication respectful.",
      bullets: [
        "Track routine visits and handoffs",
        "Share updates in one place",
        "Stay aligned during transitions",
      ],
    },
    ctaLabel: "Start a report",
    ctaHref: "/feed",
    media: {
      hero: MEDIA.hero,
      cardOne: MEDIA.cardOne,
      cardTwo: MEDIA.cardTwo,
      cardOneText: "Team notes that feel calm and consistent.",
      cardTwoText: "Comfort first for pets and people.",
      heroAlt: "Dog walking with owner in a park",
    },
  },
  community: {
    eyebrow: "Community",
    title: "A pet-first community hub with professional polish.",
    description:
      "Share sightings, celebrate reunions, and keep pet stories moving in one welcoming space.",
    badge: "Neighbors who care",
    stats: [
      { value: "Daily", label: "Community updates" },
      { value: "Shared", label: "Collective effort" },
      { value: "Local", label: "Neighborhood focus" },
    ],
    features: [
      {
        title: "Neighborhood stories",
        description:
          "Spotlight reunions and share helpful tips that build trust.",
      },
      {
        title: "Supportive network",
        description: "Bring people together with clear, consistent messaging.",
      },
      {
        title: "Actionable posts",
        description:
          "Every update helps someone respond quickly and confidently.",
      },
    ],
    detail: {
      title: "Keep the community close",
      description:
        "Create a steady stream of updates that keeps pets safe and families informed.",
      bullets: [
        "Post sightings and tips",
        "Highlight positive reunions",
        "Encourage quick, thoughtful responses",
      ],
    },
    ctaLabel: "Browse reports",
    ctaHref: "/feed",
    media: {
      hero: MEDIA.hero,
      cardOne: MEDIA.cardOne,
      cardTwo: MEDIA.cardTwo,
      cardOneText: "Stories that keep everyone hopeful.",
      cardTwoText: "Cozy spaces for pet updates.",
      heroAlt: "Dog walking with owner in a park",
    },
  },
};
