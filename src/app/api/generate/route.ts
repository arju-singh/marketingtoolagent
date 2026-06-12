import { NextRequest, NextResponse } from "next/server";
import { runSkills } from "@/lib/anthropic";
import { resolveSkillKeys, type GoalKey } from "@/lib/skills";
import { checkEntitlement, recordRunServer } from "@/lib/entitlementServer";
import type { ProductContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface GenerateBody {
  context: ProductContext;
  skills?: string[];
  goals?: GoalKey[];
  everything?: boolean;
}

export async function POST(req: NextRequest) {
  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.context?.summary) {
    return NextResponse.json({ error: "Missing product context. Run ingest first." }, { status: 400 });
  }

  const keys = resolveSkillKeys(body);
  if (!keys.length) {
    return NextResponse.json({ error: "Select at least one skill, goal, or 'everything'." }, { status: 400 });
  }

  const ent = await checkEntitlement(req);
  if (ent.enforced && !ent.allowed) {
    return NextResponse.json({ error: "Free run used. A plan is required to continue.", paywall: true }, { status: 402 });
  }

  try {
    const deliverables = await runSkills(keys, body.context);
    if (deliverables.some((d) => d.ok)) await recordRunServer(ent.uid);
    return NextResponse.json({ deliverables });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
