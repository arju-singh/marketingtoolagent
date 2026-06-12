// Shared types for the ingest -> generate pipeline.

export interface RepoFacts {
  owner: string;
  name: string;
  url: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  license: string | null;
  lastPush: string | null;
  readme: string; // truncated markdown
  packages: string[]; // dependency names sniffed from package.json / requirements
  features: string[]; // bullet-y lines extracted from the README
}

export interface SiteFacts {
  url: string;
  reachable: boolean;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  h1s: string[];
  headings: string[]; // h2/h3
  ctas: string[]; // button / prominent link text
  wordCount: number;
  hasSchema: boolean;
  schemaTypes: string[];
  hasViewport: boolean;
  hasCanonical: boolean;
  internalLinks: number;
  imagesMissingAlt: number;
  bodyExcerpt: string; // first chunk of visible copy
}

// The unified object every marketing skill consumes (the `product-marketing` output).
export interface ProductContext {
  createdAt: string;
  inputs: { githubUrl: string; domain: string };
  repo: RepoFacts | null;
  site: SiteFacts | null;
  // Derived positioning, filled by the ingest route.
  summary: {
    productName: string;
    oneLiner: string;
    audience: string;
    category: string;
    techStack: string[];
    keyFeatures: string[];
  };
  notes: string[]; // ingest warnings (e.g. "repo private", "site unreachable")
}

export interface Deliverable {
  skill: string;
  title: string;
  goal: string;
  markdown: string;
  model: string;
  ok: boolean;
  error?: string;
}
