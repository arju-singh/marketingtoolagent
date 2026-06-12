import Anthropic from "@anthropic-ai/sdk";
import type { ProductContext, Deliverable } from "./types";
import { SKILLS_BY_KEY } from "./skills";

// Mythos 5 is the flagship (Project Glasswing). If the org isn't enrolled it 400s/404s,
// so we fall back to Fable 5, then Opus 4.8. Override the primary via ANTHROPIC_MODEL.
const MODEL_CHAIN: string[] = [
  ...new Set([process.env.ANTHROPIC_MODEL || "claude-mythos-5", "claude-fable-5", "claude-opus-4-8"]),
];
// The model actually used is reported back on each deliverable.

function client() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
  }
  return new Anthropic();
}

// A model unavailable to this org (not enrolled, ZDR, retired) → try the next in the chain.
// A genuine generation error (rate limit, overload) is thrown so the caller can surface it.
function isModelUnavailable(err: unknown): boolean {
  if (err instanceof Anthropic.NotFoundError || err instanceof Anthropic.PermissionDeniedError) return true;
  if (err instanceof Anthropic.BadRequestError) {
    const m = (err.message || "").toLowerCase();
    return m.includes("model") || m.includes("retention") || m.includes("not available") || m.includes("access");
  }
  return false;
}

// Compact, cache-friendly context block. Stable across all skills in a run so the
// prompt prefix caches (see shared/prompt-caching.md): product context first, skill last.
function contextBlock(ctx: ProductContext): string {
  const { repo, site } = ctx;
  // Defensive defaults so a partial/malformed context can't crash a run.
  const summary = ctx.summary || ({} as ProductContext["summary"]);
  const techStack = summary.techStack || [];
  const keyFeatures = summary.keyFeatures || [];
  const lines: string[] = [
    `PRODUCT: ${summary.productName || "Unknown product"}`,
    `ONE-LINER: ${summary.oneLiner || "—"}`,
    `CATEGORY: ${summary.category || "—"}`,
    `AUDIENCE: ${summary.audience || "—"}`,
    `TECH STACK: ${techStack.join(", ") || "unknown"}`,
    `KEY FEATURES:\n${keyFeatures.map((f) => `  - ${f}`).join("\n") || "  - (none extracted)"}`,
  ];
  if (repo) {
    lines.push(
      `\nGITHUB: ${repo.url} (${repo.stars}★, ${repo.language || "?"})`,
      `REPO DESCRIPTION: ${repo.description || "—"}`,
      `README EXCERPT:\n${repo.readme.slice(0, 3500)}`
    );
  }
  if (site?.reachable) {
    lines.push(
      `\nLIVE SITE: ${site.url}`,
      `TITLE: ${site.title || "—"}`,
      `META DESCRIPTION: ${site.description || "—"}`,
      `H1s: ${site.h1s.join(" | ") || "—"}`,
      `HEADINGS: ${site.headings.slice(0, 12).join(" | ") || "—"}`,
      `CTAs: ${site.ctas.join(" | ") || "—"}`,
      `SEO SIGNALS: schema=${site.hasSchema ? site.schemaTypes.join(",") : "none"}, canonical=${site.hasCanonical}, viewport=${site.hasViewport}, imgs-missing-alt=${site.imagesMissingAlt}, words=${site.wordCount}`,
      `COPY EXCERPT:\n${site.bodyExcerpt.slice(0, 1500)}`
    );
  } else if (ctx.inputs?.domain) {
    lines.push(`\nLIVE SITE: ${ctx.inputs.domain} (could not be crawled)`);
  }
  return lines.join("\n");
}

const SYSTEM = `You are the lead strategist at an elite, full-service growth marketing agency. A new client has handed you their product — its GitHub repo and live site. Your job is to analyse the project from every angle and execute one specific engagement deliverable at agency quality.

Operate at senior-partner level:
- Analyse first, then write. Reason about the product's real positioning, ICP, wedge, competitive context, funnel, and the single biggest growth lever before producing output.
- Ground EVERYTHING in the client's actual features, copy, stack and audience. Never invent fake metrics, logos, or testimonials; mark any assumption or placeholder explicitly as [ASSUMPTION] / [PLACEHOLDER].
- Deliver work that is immediately usable and paste-ready: real headlines, real copy, concrete tables, prioritized checklists with impact×effort — not generic advice.
- Output clean GitHub-flavored Markdown. Open with an H2 title, then go straight to substance — no preamble, no "Here is".
- Where useful, end with a short "Why this works" note tying the deliverable to the product's specific situation.
Lead with the highest-leverage output for this engagement. This is billable work — make it worth it.`;

export async function runSkill(skillKey: string, ctx: ProductContext): Promise<Deliverable> {
  const skill = SKILLS_BY_KEY[skillKey];
  if (!skill) {
    return { skill: skillKey, title: skillKey, goal: "", markdown: "", model: MODEL_CHAIN[0], ok: false, error: "Unknown skill" };
  }

  const userPrompt = `=== PRODUCT CONTEXT ===
${contextBlock(ctx)}

=== ENGAGEMENT: ${skill.name} ===
${skill.focus}

Analyse the client's product, then produce the deliverable.`;

  // Flagship audits get more room to think and write.
  const maxTokens = skill.key === "agency-audit" ? 16000 : 9000;

  let lastError = "Generation failed";
  let anthropic: Anthropic;
  try {
    anthropic = client();
  } catch (err) {
    // e.g. missing API key — fail this skill gracefully so the stream survives.
    return { skill: skill.key, title: skill.name, goal: skill.goal, markdown: "", model: MODEL_CHAIN[0], ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  for (const model of MODEL_CHAIN) {
    try {
      // Mythos/Fable/Opus 4.x all use adaptive thinking + the effort param. The installed
      // SDK (0.65) predates these in its TS types, so the body is built loosely and cast.
      const params = {
        model,
        max_tokens: maxTokens,
        thinking: { type: "adaptive" },
        output_config: { effort: "high" },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
      };
      const stream = anthropic.messages.stream(params as unknown as Anthropic.MessageStreamParams);
      const msg = await stream.finalMessage();

      if (msg.stop_reason === "refusal") {
        lastError = "Model declined this request.";
        continue; // try the next model in the chain
      }
      const markdown = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return { skill: skill.key, title: skill.name, goal: skill.goal, markdown, model, ok: true };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (isModelUnavailable(err)) continue; // model not available to this org → next
      break; // real error (rate limit, overload, network) → stop and report
    }
  }

  return { skill: skill.key, title: skill.name, goal: skill.goal, markdown: "", model: MODEL_CHAIN[0], ok: false, error: lastError };
}

// Run skills with bounded concurrency so we don't hammer the rate limit.
export async function runSkills(skillKeys: string[], ctx: ProductContext, concurrency = 3): Promise<Deliverable[]> {
  const results: Deliverable[] = [];
  await runSkillsStreaming(skillKeys, ctx, (d) => results.push(d), concurrency);
  // Preserve the requested order in the output.
  return skillKeys.map((k) => results.find((r) => r.skill === k)!).filter(Boolean);
}

// Same as runSkills, but invokes `onResult` the moment each deliverable finishes —
// used by the streaming endpoint so the UI fills in progressively.
export async function runSkillsStreaming(
  skillKeys: string[],
  ctx: ProductContext,
  onResult: (d: Deliverable) => void,
  concurrency = 3
): Promise<void> {
  const queue = [...skillKeys];
  async function worker() {
    while (queue.length) {
      const key = queue.shift()!;
      onResult(await runSkill(key, ctx));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, skillKeys.length) }, worker));
}
