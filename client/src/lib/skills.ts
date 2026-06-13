// The marketing-skills catalog, modeled on github.com/blurred-machine/marketingskills.
// Each entry teaches Claude one marketing job. `focus` becomes the skill's system prompt;
// the runner always prepends the shared product-marketing context object.

export type GoalKey =
  | "analysis"
  | "conversion"
  | "content"
  | "seo"
  | "paid"
  | "measurement"
  | "growth"
  | "strategy";

export interface Skill {
  key: string;
  name: string;
  category: string;
  goal: GoalKey;
  blurb: string; // shown in the UI grid
  focus: string; // appended to the system prompt
  needs: ("repo" | "site")[]; // which inputs make this skill most useful
}

export const GOALS: { key: GoalKey; label: string; emoji: string; desc: string }[] = [
  { key: "analysis", label: "Full agency analysis", emoji: "🧠", desc: "Deep multi-angle audit of your whole project" },
  { key: "conversion", label: "More conversions", emoji: "🎯", desc: "Turn visitors into signups & paying users" },
  { key: "content", label: "Content & copy", emoji: "✍️", desc: "Page copy, emails, social, visuals" },
  { key: "seo", label: "Traffic & SEO", emoji: "🔍", desc: "Rank in Google and AI search" },
  { key: "paid", label: "Paid & ads", emoji: "📣", desc: "Ad campaigns and creative at scale" },
  { key: "measurement", label: "Measurement", emoji: "📊", desc: "Analytics and experiments" },
  { key: "growth", label: "Growth loops", emoji: "🚀", desc: "Referrals, churn, community, lead magnets" },
  { key: "strategy", label: "Strategy & revenue", emoji: "💰", desc: "Plan, price, launch, position" },
];

export const SKILLS: Skill[] = [
  // Flagship analysis
  { key: "agency-audit", name: "Full Agency Audit", category: "Analysis", goal: "analysis", needs: ["repo", "site"],
    blurb: "A complete agency-grade teardown of your project.",
    focus: "Act as the lead strategist delivering a comprehensive agency audit of this project. Cover, with headers: (1) Positioning & one-line pitch, (2) ICP & segments, (3) The wedge — what to own, (4) Competitive landscape (3 likely competitors + the gap), (5) Funnel & conversion read of the live site, (6) SEO & discoverability read, (7) Messaging & copy critique with rewrites, (8) The 3 highest-leverage growth moves (impact×effort), (9) 30/60/90-day roadmap, (10) The North Star metric & what to instrument. Be specific to THIS product, cite real features/copy, and end with the single most important thing to do this week." },

  // Conversion
  { key: "cro", name: "CRO Audit", category: "Conversion", goal: "conversion", needs: ["site"],
    blurb: "Audit landing pages & funnels for conversion lift.",
    focus: "Run a conversion-rate-optimization audit of the live site. Find friction in the hero, value prop, social proof, and CTA. Output a prioritized list of changes (impact x effort), each with the exact before/after copy or layout fix." },
  { key: "signup", name: "Signup Flow", category: "Conversion", goal: "conversion", needs: ["site"],
    blurb: "Reduce friction in registration & account creation.",
    focus: "Design an optimal signup flow for this product: field order, social auth, progressive profiling, error states, and the first 'aha' moment. Give concrete copy for each step." },
  { key: "onboarding", name: "Onboarding", category: "Conversion", goal: "conversion", needs: ["repo"],
    blurb: "Post-signup activation to the aha moment.",
    focus: "Design a post-signup activation sequence (checklist, empty states, tooltips, day-1/3/7 emails) that drives users to the product's core value as fast as possible." },
  { key: "popups", name: "Popups & Modals", category: "Conversion", goal: "conversion", needs: ["site"],
    blurb: "Exit-intent and inline overlays that convert.",
    focus: "Propose 3 high-converting popups (exit-intent, scroll, inline) with trigger rules, copy, and offer. Avoid dark patterns." },
  { key: "paywalls", name: "Paywalls", category: "Conversion", goal: "conversion", needs: ["repo"],
    blurb: "In-app upgrade moments that feel earned.",
    focus: "Design in-app upgrade moments and paywall copy tied to real feature value, with framing variants to A/B test." },

  // Content & Copy
  { key: "copywriting", name: "Landing Copy", category: "Content", goal: "content", needs: ["repo", "site"],
    blurb: "Full landing-page copy from your real features.",
    focus: "Write complete landing-page copy: hero headline + subhead (3 variants), value props, feature sections, social proof framing, FAQ, and final CTA. Ground every claim in the repo's real features." },
  { key: "copy-editing", name: "Copy Editing", category: "Content", goal: "content", needs: ["site"],
    blurb: "Sharpen the copy already on your site.",
    focus: "Edit the existing site copy for clarity, specificity, and momentum. Show a before/after table for each weak section and explain the principle behind each edit." },
  { key: "cold-email", name: "Cold Email", category: "Content", goal: "content", needs: ["repo"],
    blurb: "B2B outreach sequence (3–5 touches).",
    focus: "Write a 4-email B2B cold outreach sequence for a relevant ICP. Strong subject lines, one ask per email, personalization tokens, and a soft breakup." },
  { key: "emails", name: "Lifecycle Emails", category: "Content", goal: "content", needs: ["repo"],
    blurb: "Welcome, activation & re-engagement flows.",
    focus: "Build a lifecycle email program: welcome series, activation nudges, feature education, and win-back. For each email give subject, preview text, and body." },
  { key: "social", name: "Social Content", category: "Content", goal: "content", needs: ["repo"],
    blurb: "Launch-week posts for X / LinkedIn.",
    focus: "Create a 7-post social pack (X + LinkedIn) covering launch, a build-in-public angle, a feature spotlight, and a customer-outcome story. Include hooks." },
  { key: "image", name: "Visual Briefs", category: "Content", goal: "content", needs: ["repo"],
    blurb: "OG images, hero & social-card art direction.",
    focus: "Write art-direction briefs for the OG image, hero visual, and 3 social cards: composition, copy overlay, palette, and a ready-to-use image-gen prompt for each." },
  { key: "sms", name: "SMS Campaigns", category: "Content", goal: "content", needs: ["repo"],
    blurb: "Compliant SMS/MMS sequences.",
    focus: "Plan an opt-in SMS program: 5 messages under 160 chars each, with compliance (STOP/HELP) and timing." },

  // SEO
  { key: "seo-audit", name: "SEO Audit", category: "SEO", goal: "seo", needs: ["site"],
    blurb: "Technical + on-page SEO diagnosis.",
    focus: "Audit technical + on-page SEO from the crawled facts (title, meta, headings, schema, canonical, viewport, alt text, internal links). Output ranked fixes with the exact tag/markup to change." },
  { key: "ai-seo", name: "AI Search (GEO)", category: "SEO", goal: "seo", needs: ["site", "repo"],
    blurb: "Get cited by ChatGPT, Perplexity & AI Overviews.",
    focus: "Optimize for AI answer engines: the questions this product should be the cited answer to, content blocks to add, and an llms.txt outline." },
  { key: "programmatic-seo", name: "Programmatic SEO", category: "SEO", goal: "seo", needs: ["repo"],
    blurb: "Templated pages that scale to hundreds.",
    focus: "Design a programmatic SEO play: a page template, the data dimensions to fill it, an example URL pattern, and 10 sample target keywords." },
  { key: "site-architecture", name: "Site Architecture", category: "SEO", goal: "seo", needs: ["site"],
    blurb: "Information architecture & internal linking.",
    focus: "Propose an information architecture: top-nav, page hierarchy, hub-and-spoke content clusters, and an internal-linking plan." },
  { key: "competitors", name: "Comparison Pages", category: "SEO", goal: "seo", needs: ["repo"],
    blurb: "'vs competitor' pages that win the search.",
    focus: "Draft a 'vs [competitor]' comparison page: positioning angle, an honest comparison table, and the migration/switch CTA. Identify 3 likely competitors." },
  { key: "schema", name: "Schema Markup", category: "SEO", goal: "seo", needs: ["site"],
    blurb: "JSON-LD structured data to add.",
    focus: "Generate the JSON-LD structured data this site is missing (Organization, SoftwareApplication, FAQ, Breadcrumb as relevant), ready to paste." },
  { key: "aso", name: "App Store (ASO)", category: "SEO", goal: "seo", needs: ["repo"],
    blurb: "Title, subtitle & keyword field.",
    focus: "Write App Store / Play Store listing copy: title, subtitle, keyword field, and the first 3 lines of the description." },
  { key: "content-strategy", name: "Content Strategy", category: "SEO", goal: "seo", needs: ["repo"],
    blurb: "A topic cluster + 90-day calendar.",
    focus: "Build a content strategy: 3 topic clusters, 12 article titles mapped to funnel stage and search intent, and a 90-day publishing cadence." },

  // Paid
  { key: "ads", name: "Paid Campaigns", category: "Paid", goal: "paid", needs: ["repo"],
    blurb: "Google/Meta campaign structure & targeting.",
    focus: "Design a paid acquisition plan: channel mix, campaign/ad-set structure, audience targeting, budget split, and the core offer for each channel." },
  { key: "ad-creative", name: "Ad Creative", category: "Paid", goal: "paid", needs: ["repo"],
    blurb: "Bulk ad variations (hooks + angles).",
    focus: "Generate 10 ad variations across 3 angles (pain, outcome, social proof). For each: primary text, headline, and a visual concept." },

  // Measurement
  { key: "analytics", name: "Analytics Plan", category: "Measurement", goal: "measurement", needs: ["repo"],
    blurb: "Event tracking & North Star metric.",
    focus: "Define a measurement plan: North Star metric, the activation event, a tracking-event schema (name + properties), and the funnel to instrument." },
  { key: "ab-testing", name: "A/B Test Plan", category: "Measurement", goal: "measurement", needs: ["site"],
    blurb: "Prioritized experiment backlog.",
    focus: "Propose a prioritized A/B testing backlog: 6 experiments with hypothesis, variant, primary metric, and an ICE score." },

  // Growth
  { key: "churn-prevention", name: "Churn Prevention", category: "Growth", goal: "growth", needs: ["repo"],
    blurb: "Spot and rescue at-risk users.",
    focus: "Build a churn-prevention playbook: risk signals to watch, intervention triggers, save-offer ladder, and cancel-flow copy." },
  { key: "referrals", name: "Referral Program", category: "Growth", goal: "growth", needs: ["repo"],
    blurb: "A double-sided referral loop.",
    focus: "Design a double-sided referral program: incentive structure, the share moment, messaging, and anti-abuse guardrails." },
  { key: "free-tools", name: "Free Tools", category: "Growth", goal: "growth", needs: ["repo"],
    blurb: "Marketing micro-tools as a top-of-funnel.",
    focus: "Pitch 3 free micro-tools/calculators adjacent to the product that attract the ICP, with the lead-capture and SEO angle for each." },
  { key: "co-marketing", name: "Co-Marketing", category: "Growth", goal: "growth", needs: ["repo"],
    blurb: "Partner & integration plays.",
    focus: "Identify partner/integration co-marketing opportunities: candidate partners, the joint offer, and an outreach pitch." },
  { key: "community-marketing", name: "Community", category: "Growth", goal: "growth", needs: ["repo"],
    blurb: "Where your users already gather.",
    focus: "Map the communities (subreddits, Discords, forums, Slack groups) where the ICP gathers, and a non-spammy engagement plan for each." },
  { key: "lead-magnets", name: "Lead Magnets", category: "Growth", goal: "growth", needs: ["repo"],
    blurb: "Gated assets worth an email.",
    focus: "Design 3 lead magnets (template, guide, checklist) tied to the product's value, with landing-page copy and the nurture follow-up." },

  // Strategy
  { key: "marketing-plan", name: "Master Marketing Plan", category: "Strategy", goal: "strategy", needs: ["repo", "site"],
    blurb: "The orchestrated 90-day go-to-market.",
    focus: "Synthesize a 90-day go-to-market plan: positioning, ICP, channel priorities, a week-by-week roadmap, and the metrics to watch. Reference the other deliverables as the execution detail." },
  { key: "marketing-psychology", name: "Psychology Levers", category: "Strategy", goal: "strategy", needs: ["site"],
    blurb: "Behavioral levers to apply, ethically.",
    focus: "Identify the behavioral-science levers (social proof, scarcity, anchoring, loss aversion) this product should use, with an ethical, concrete application of each." },
  { key: "launch", name: "Launch Plan", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "Product Hunt / Show HN launch kit.",
    focus: "Build a launch kit: Product Hunt tagline + first comment, Show HN title + post, launch-day checklist, and the asset list." },
  { key: "pricing", name: "Pricing Strategy", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "Tiers, anchors & packaging.",
    focus: "Recommend a pricing & packaging model: tier names, the value metric, feature gating, anchor price, and the pricing-page copy." },
  { key: "revops", name: "RevOps / Lifecycle", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "Lead lifecycle & handoff stages.",
    focus: "Map the lead lifecycle: stages (lead→MQL→SQL→customer), the criteria for each, and the automation between them." },
  { key: "sales-enablement", name: "Sales Enablement", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "One-pager, demo script & objection handling.",
    focus: "Create sales collateral: a one-pager outline, a 5-minute demo script, and an objection-handling table." },
  { key: "prospecting", name: "Prospecting", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "ICP definition & target list criteria.",
    focus: "Define the ICP precisely (firmographics, triggers, titles) and the criteria/sources for building a target prospect list." },
  { key: "competitor-profiling", name: "Competitor Profiling", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "Who you're really up against.",
    focus: "Profile 3 likely competitors: positioning, pricing posture, strengths, and the wedge this product can own." },
  { key: "customer-research", name: "Customer Research", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "Interview guide & survey questions.",
    focus: "Produce a customer-research kit: a jobs-to-be-done interview guide and a 6-question survey to validate the positioning." },
  { key: "directory-submissions", name: "Directories", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "Where to list for backlinks & traffic.",
    focus: "List the most relevant directories/marketplaces to submit to (with the ready-to-paste short + long description for each)." },
  { key: "marketing-ideas", name: "Growth Ideas", category: "Strategy", goal: "strategy", needs: ["repo"],
    blurb: "10 scrappy ideas ranked by leverage.",
    focus: "Brainstorm 10 scrappy, specific growth ideas for this exact product, ranked by leverage (impact vs effort) with a one-line how-to each." },
];

export const SKILLS_BY_KEY = Object.fromEntries(SKILLS.map((s) => [s.key, s]));

/** Curated default bundles per goal (so 'pick a goal' returns a coherent set). */
export const GOAL_BUNDLES: Record<GoalKey, string[]> = {
  analysis: ["agency-audit", "competitor-profiling", "customer-research", "marketing-psychology"],
  conversion: ["cro", "signup", "onboarding", "copywriting"],
  content: ["copywriting", "emails", "social", "image"],
  seo: ["seo-audit", "ai-seo", "schema", "content-strategy"],
  paid: ["ads", "ad-creative", "marketing-psychology"],
  measurement: ["analytics", "ab-testing"],
  growth: ["referrals", "lead-magnets", "community-marketing", "churn-prevention"],
  strategy: ["marketing-plan", "pricing", "launch", "competitor-profiling"],
};

/** "Generate everything" -> a strong, non-redundant default set. */
export const EVERYTHING: string[] = [
  "agency-audit", "marketing-plan", "copywriting", "cro", "seo-audit", "ai-seo",
  "emails", "social", "ads", "ad-creative", "launch",
  "pricing", "analytics", "competitor-profiling", "content-strategy", "lead-magnets",
];

/** Resolve a request (everything | explicit skills | goal bundles) to an ordered, capped, deduped key list. */
export function resolveSkillKeys(opts: {
  everything?: boolean;
  skills?: string[];
  goals?: GoalKey[];
}): string[] {
  let keys: string[] = [];
  if (opts.everything) {
    keys = EVERYTHING;
  } else if (opts.skills?.length) {
    keys = opts.skills.filter((k) => SKILLS_BY_KEY[k]);
  } else if (opts.goals?.length) {
    keys = opts.goals.flatMap((g) => GOAL_BUNDLES[g] || []);
  }
  return [...new Set(keys)].slice(0, 18);
}
