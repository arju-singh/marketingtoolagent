import { Octokit } from "@octokit/rest";
import type { RepoFacts } from "./types";

const octokit = new Octokit(
  process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {}
);

/** Parse owner/repo from any GitHub URL or "owner/repo" shorthand. */
export function parseRepo(input: string): { owner: string; repo: string } | null {
  const cleaned = input.trim().replace(/\.git$/, "");
  const m =
    cleaned.match(/github\.com[/:]([^/]+)\/([^/?#]+)/i) ||
    cleaned.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

function extractFeatures(readme: string): string[] {
  const features: string[] = [];
  const lines = readme.split("\n");
  let inFeatureBlock = false;
  for (const line of lines) {
    if (/^#{1,3}\s*(features|what|why|highlights|capabilit)/i.test(line)) {
      inFeatureBlock = true;
      continue;
    }
    if (/^#{1,3}\s/.test(line)) inFeatureBlock = false;
    const bullet = line.match(/^\s*[-*+]\s+(.*)/);
    if (bullet) {
      const text = bullet[1].replace(/[*_`[\]]/g, "").replace(/\(.*?\)/g, "").trim();
      if (text.length > 8 && text.length < 160) {
        if (inFeatureBlock) features.unshift(text);
        else features.push(text);
      }
    }
  }
  return [...new Set(features)].slice(0, 12);
}

function sniffPackages(files: Record<string, string>): string[] {
  const names = new Set<string>();
  const pkg = files["package.json"];
  if (pkg) {
    try {
      const json = JSON.parse(pkg);
      Object.keys({ ...json.dependencies, ...json.devDependencies }).forEach((d) =>
        names.add(d)
      );
    } catch {
      /* ignore malformed package.json */
    }
  }
  const reqs = files["requirements.txt"];
  if (reqs) {
    reqs
      .split("\n")
      .map((l) => l.split(/[=<>!~ ]/)[0].trim())
      .filter(Boolean)
      .forEach((d) => names.add(d));
  }
  return [...names].slice(0, 40);
}

async function getFile(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const res = await octokit.repos.getContent({ owner, repo, path });
    const data = res.data as { content?: string; encoding?: string };
    if (data.content) {
      return Buffer.from(data.content, (data.encoding as BufferEncoding) || "base64").toString(
        "utf8"
      );
    }
  } catch {
    /* file missing */
  }
  return null;
}

export async function ingestRepo(githubUrl: string): Promise<RepoFacts> {
  const parsed = parseRepo(githubUrl);
  if (!parsed) throw new Error(`Could not parse a GitHub repo from "${githubUrl}".`);
  const { owner, repo } = parsed;

  const { data: meta } = await octokit.repos.get({ owner, repo });

  let readme = "";
  try {
    const r = await octokit.repos.getReadme({ owner, repo });
    readme = Buffer.from(r.data.content, "base64").toString("utf8");
  } catch {
    readme = meta.description || "";
  }

  const [pkg, reqs] = await Promise.all([
    getFile(owner, repo, "package.json"),
    getFile(owner, repo, "requirements.txt"),
  ]);
  const packages = sniffPackages({
    ...(pkg ? { "package.json": pkg } : {}),
    ...(reqs ? { "requirements.txt": reqs } : {}),
  });

  let topics: string[] = [];
  try {
    const t = await octokit.repos.getAllTopics({ owner, repo });
    topics = t.data.names || [];
  } catch {
    /* topics optional */
  }

  return {
    owner,
    name: repo,
    url: meta.html_url,
    description: meta.description,
    homepage: meta.homepage || null,
    stars: meta.stargazers_count,
    language: meta.language,
    topics,
    license: meta.license?.spdx_id || null,
    lastPush: meta.pushed_at,
    readme: readme.slice(0, 8000),
    packages,
    features: extractFeatures(readme),
  };
}
