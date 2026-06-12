import { NextRequest, NextResponse } from "next/server";
import { ingestRepo } from "@/lib/github";
import { crawlSite } from "@/lib/crawl";
import { buildProductContext } from "@/lib/productContext";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { githubUrl?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const githubUrl = (body.githubUrl || "").trim();
  const domain = (body.domain || "").trim();

  if (!githubUrl && !domain) {
    return NextResponse.json({ error: "Provide at least a GitHub URL or a domain." }, { status: 400 });
  }

  // Run both ingests in parallel; tolerate either side failing.
  const [repoResult, siteResult] = await Promise.allSettled([
    githubUrl ? ingestRepo(githubUrl) : Promise.resolve(null),
    domain ? crawlSite(domain) : Promise.resolve(null),
  ]);

  const repo = repoResult.status === "fulfilled" ? repoResult.value : null;
  const site = siteResult.status === "fulfilled" ? siteResult.value : null;

  const ctx = buildProductContext(githubUrl, domain, repo, site);
  if (repoResult.status === "rejected") {
    ctx.notes.push(`GitHub: ${repoResult.reason?.message || "failed"}`);
  }

  return NextResponse.json({ context: ctx });
}
