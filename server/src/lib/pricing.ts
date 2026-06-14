// Freemium model: the first generation is free; every run after that needs a plan.
// NOTE: keep this file in sync with client/src/lib/pricing.ts — the server uses `price`
// to create the Razorpay order, and `id`/`name` to attribute the plan.
export const FREE_RUNS = 1;
export const CURRENCY = "₹"; // INR

export interface Tier {
  id: "starter" | "pro" | "agency";
  price: number;
  name: string;
  tagline: string;
  /** Who the plan is for — shown under the name. */
  bestFor: string;
  /** Headline quota, rendered prominently on the card. */
  projects: string;
  /** Detailed, specific inclusions rendered as a checklist. */
  features: string[];
  popular?: boolean;
}

// Every paid plan includes these — shown once below the cards instead of repeating per card.
export const ALL_PLANS_INCLUDE: string[] = [
  "Grounded in your real repo + live site",
  "Markdown + .zip export, copy-ready",
  "Runs saved to your history",
  "One-time payment — no subscription, cancel nothing",
];

export const TIERS: Tier[] = [
  {
    id: "starter",
    price: 777,
    name: "Starter",
    tagline: "One more project, the core playbooks.",
    bestFor: "For a single launch or side project",
    projects: "3 projects",
    features: [
      "3 project analyses",
      "6 goal bundles — CRO, SEO, content, ads, measurement, growth",
      "Up to 10 skills per project",
      "Markdown + .zip export",
      "30-day run history",
      "Email support",
    ],
  },
  {
    id: "pro",
    price: 888,
    name: "Pro",
    tagline: "The full agency suite, every skill unlocked.",
    bestFor: "For founders shipping seriously",
    popular: true,
    projects: "25 projects",
    features: [
      "25 project analyses",
      "All 8 goal bundles + Full Agency Audit",
      "All 52 marketing skills, unlimited per project",
      "Markdown, .zip + combined-doc export",
      "Unlimited run history",
      "Priority generation queue",
      "Email support",
    ],
  },
  {
    id: "agency",
    price: 999,
    name: "Agency",
    tagline: "Priority deep analysis, white-label, many clients.",
    bestFor: "For studios, agencies & freelancers",
    projects: "Unlimited projects",
    features: [
      "Everything in Pro",
      "Unlimited project analyses",
      "Priority Mythos 5 deep analysis",
      "White-label / unbranded exports",
      "Multi-project client workspace",
      "Priority support",
    ],
  },
];

export const tierById = (id: string) => TIERS.find((t) => t.id === id) || null;
