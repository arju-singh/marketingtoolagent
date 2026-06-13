import type { ProductContext, RepoFacts, SiteFacts } from "./types";

/** Derive a positioning summary from the raw repo + site facts. */
export function buildProductContext(
  githubUrl: string,
  domain: string,
  repo: RepoFacts | null,
  site: SiteFacts | null
): ProductContext {
  const notes: string[] = [];
  if (githubUrl && !repo) notes.push("GitHub repo could not be read (private, missing, or rate-limited).");
  if (domain && (!site || !site.reachable)) notes.push("Live site could not be crawled.");

  const productName =
    repo?.name ||
    site?.title?.split(/[|–-]/)[0].trim() ||
    (domain ? new URL(domain.startsWith("http") ? domain : "https://" + domain).hostname : "Your product");

  const oneLiner =
    repo?.description ||
    site?.description ||
    site?.ogDescription ||
    site?.h1s[0] ||
    "A product in need of a sharper one-liner.";

  const techStack = [...new Set([repo?.language, ...(repo?.packages || [])].filter(Boolean))] as string[];

  const keyFeatures = [...new Set([...(repo?.features || []), ...(site?.headings || [])])].slice(0, 12);

  const category =
    repo?.topics?.[0] ||
    (techStack.some((t) => /react|next|vue/i.test(t)) ? "Web app / SaaS" : "Software product");

  const audience = repo?.topics?.length
    ? `Teams interested in ${repo.topics.slice(0, 3).join(", ")}`
    : "Developers and product teams";

  return {
    createdAt: new Date().toISOString(),
    inputs: { githubUrl, domain },
    repo,
    site,
    summary: { productName, oneLiner, audience, category, techStack: techStack.slice(0, 15), keyFeatures },
    notes,
  };
}
