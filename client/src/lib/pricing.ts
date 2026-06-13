// Freemium model: the first generation is free; every run after that needs a plan.
export const FREE_RUNS = 1;
export const CURRENCY = "₹"; // INR

export interface Tier {
  id: "starter" | "pro" | "agency";
  price: number;
  name: string;
  tagline: string;
  features: string[];
  popular?: boolean;
}

export const TIERS: Tier[] = [
  {
    id: "starter",
    price: 777,
    name: "Starter",
    tagline: "One more project, core skills.",
    features: [
      "1 additional project",
      "Goal bundles (CRO, SEO, content…)",
      "Markdown + .zip export",
      "Run saved to history",
    ],
  },
  {
    id: "pro",
    price: 888,
    name: "Pro",
    tagline: "The full agency suite, unlimited skills.",
    popular: true,
    features: [
      "All 41+ marketing skills",
      "Full Agency Audit included",
      "Unlimited skills per run",
      "All exports + history",
    ],
  },
  {
    id: "agency",
    price: 999,
    name: "Agency",
    tagline: "Priority Mythos analysis, many projects.",
    features: [
      "Everything in Pro",
      "Priority Mythos 5 deep analysis",
      "Multiple projects",
      "White-label exports",
    ],
  },
];

export const tierById = (id: string) => TIERS.find((t) => t.id === id) || null;
