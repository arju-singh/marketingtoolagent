import * as cheerio from "cheerio";
import type { SiteFacts } from "./types";

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/+$/, "");
}

export async function crawlSite(domain: string): Promise<SiteFacts> {
  const url = normalizeUrl(domain);
  const base: SiteFacts = {
    url,
    reachable: false,
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    h1s: [],
    headings: [],
    ctas: [],
    wordCount: 0,
    hasSchema: false,
    schemaTypes: [],
    hasViewport: false,
    hasCanonical: false,
    internalLinks: 0,
    imagesMissingAlt: 0,
    bodyExcerpt: "",
  };

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MarketingSkillsBot/1.0 (+https://example.com)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ...base, reachable: false };
    html = await res.text();
  } catch {
    return base;
  }

  const $ = cheerio.load(html);

  const meta = (sel: string) => $(sel).attr("content")?.trim() || null;

  const h1s = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 6);

  const headings = $("h2, h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 25);

  const ctas = [
    ...$("button, a.button, a.btn, [class*='cta'], [role='button']")
      .map((_, el) => $(el).text().trim())
      .get(),
  ]
    .filter((t) => t.length > 1 && t.length < 40)
    .slice(0, 15);

  const schemaTypes = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text());
      const types = Array.isArray(json) ? json.map((j) => j["@type"]) : [json["@type"]];
      types.flat().filter(Boolean).forEach((t) => schemaTypes.add(String(t)));
    } catch {
      /* ignore */
    }
  });

  $("script, style, noscript, svg").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const host = new URL(url).hostname;
  const internalLinks = $("a[href]")
    .map((_, el) => $(el).attr("href") || "")
    .get()
    .filter((h) => h.startsWith("/") || h.includes(host)).length;

  const imagesMissingAlt = $("img").filter((_, el) => !$(el).attr("alt")).length;

  return {
    ...base,
    reachable: true,
    title: $("title").first().text().trim() || null,
    description: meta('meta[name="description"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    h1s,
    headings,
    ctas: [...new Set(ctas)],
    wordCount: bodyText.split(" ").filter(Boolean).length,
    hasSchema: schemaTypes.size > 0,
    schemaTypes: [...schemaTypes],
    hasViewport: $('meta[name="viewport"]').length > 0,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    internalLinks,
    imagesMissingAlt,
    bodyExcerpt: bodyText.slice(0, 2500),
  };
}
