import { NextRequest } from "next/server";
import { runSkillsStreaming } from "@/lib/anthropic";
import { resolveSkillKeys, SKILLS_BY_KEY, type GoalKey } from "@/lib/skills";
import { checkEntitlement, recordRunServer } from "@/lib/entitlementServer";
import type { ProductContext, Deliverable } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  context: ProductContext;
  skills?: string[];
  goals?: GoalKey[];
  everything?: boolean;
}

// Streams newline-delimited JSON (NDJSON):
//   {type:"start", skills:[{key,name}]}      once
//   {type:"deliverable", deliverable:{...}}  per skill, as it finishes
//   {type:"done"} | {type:"error", error}    terminal
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.context?.summary) {
    return Response.json({ error: "Missing product context. Run ingest first." }, { status: 400 });
  }

  const keys = resolveSkillKeys(body);
  if (!keys.length) {
    return Response.json({ error: "Select at least one skill, goal, or 'everything'." }, { status: 400 });
  }

  // Authoritative paywall gate (active only when Firebase Admin is configured).
  const ent = await checkEntitlement(req);
  if (ent.enforced && !ent.allowed) {
    return Response.json({ error: "Free run used. A plan is required to continue.", paywall: true }, { status: 402 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      send({ type: "start", skills: keys.map((k) => ({ key: k, name: SKILLS_BY_KEY[k].name })) });
      const collected: Deliverable[] = [];
      try {
        await runSkillsStreaming(keys, body.context, (d) => {
          collected.push(d);
          send({ type: "deliverable", deliverable: d });
        });
        // Count this run against the free quota server-side (signed-in users).
        if (collected.some((d) => d.ok)) await recordRunServer(ent.uid);
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
