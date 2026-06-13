import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";

import { ingestRepo } from "./lib/github.js";
import { crawlSite } from "./lib/crawl.js";
import { buildProductContext } from "./lib/productContext.js";
import { runSkills, runSkillsStreaming } from "./lib/anthropic.js";
import { resolveSkillKeys, SKILLS_BY_KEY } from "./lib/skills.js";
import { checkEntitlement, recordRunServer, activatePlanServer } from "./lib/entitlementServer.js";
import { verifyUid, bearerFromHeader } from "./lib/supabaseAdmin.js";
import { tierById } from "./lib/pricing.js";
import type { ProductContext, Deliverable } from "./lib/types.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));

const tok = (req: express.Request) => bearerFromHeader(req.headers.authorization);

// ── Razorpay webhook: needs the RAW body for HMAC, so register before express.json ──
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !keyId || !keySecret) return res.status(500).json({ error: "Webhook not configured" });

  const raw = (req.body as Buffer).toString("utf8");
  const signature = String(req.headers["x-razorpay-signature"] || "");
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return res.status(400).json({ error: "Invalid signature" });

  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> };
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: "Bad payload" });
  }
  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return res.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity as { order_id?: string; notes?: Record<string, string> } | undefined;
  const order = event.payload?.order?.entity as { id?: string; notes?: Record<string, string> } | undefined;
  const orderId = order?.id || payment?.order_id;
  let notes = order?.notes || payment?.notes;
  if ((!notes?.uid || !notes?.tier) && orderId) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const o = (await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: { authorization: `Basic ${auth}` },
      }).then((r) => r.json())) as { notes?: Record<string, string> };
      notes = o?.notes || notes;
    } catch {
      /* ignore */
    }
  }
  const uid = notes?.uid;
  const tier = tierById(notes?.tier || "");
  if (uid && tier) {
    await activatePlanServer(uid, tier.id);
    return res.json({ ok: true, activated: tier.id });
  }
  return res.json({ ok: true, activated: false });
});

app.use(express.json({ limit: "4mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Ingest: GitHub repo + live site → ProductContext ──
app.post("/api/ingest", async (req, res) => {
  const githubUrl = (req.body?.githubUrl || "").trim();
  const domain = (req.body?.domain || "").trim();
  if (!githubUrl && !domain) return res.status(400).json({ error: "Provide at least a GitHub URL or a domain." });

  const [repoR, siteR] = await Promise.allSettled([
    githubUrl ? ingestRepo(githubUrl) : Promise.resolve(null),
    domain ? crawlSite(domain) : Promise.resolve(null),
  ]);
  const repo = repoR.status === "fulfilled" ? repoR.value : null;
  const site = siteR.status === "fulfilled" ? siteR.value : null;
  const ctx = buildProductContext(githubUrl, domain, repo, site);
  if (repoR.status === "rejected") ctx.notes.push(`GitHub: ${repoR.reason?.message || "failed"}`);
  res.json({ context: ctx });
});

interface GenBody { context: ProductContext; skills?: string[]; goals?: string[]; everything?: boolean }

// ── Generate (batch) ──
app.post("/api/generate", async (req, res) => {
  const body = req.body as GenBody;
  if (!body?.context?.summary) return res.status(400).json({ error: "Missing product context. Run ingest first." });
  const keys = resolveSkillKeys(body as never);
  if (!keys.length) return res.status(400).json({ error: "Select at least one skill, goal, or 'everything'." });

  const ent = await checkEntitlement(tok(req));
  if (ent.enforced && !ent.allowed) return res.status(402).json({ error: "Free run used. A plan is required.", paywall: true });

  try {
    const deliverables = await runSkills(keys, body.context);
    if (deliverables.some((d) => d.ok)) await recordRunServer(ent.uid);
    res.json({ deliverables });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Generation failed" });
  }
});

// ── Generate (streaming NDJSON) ──
app.post("/api/generate/stream", async (req, res) => {
  const body = req.body as GenBody;
  if (!body?.context?.summary) return res.status(400).json({ error: "Missing product context. Run ingest first." });
  const keys = resolveSkillKeys(body as never);
  if (!keys.length) return res.status(400).json({ error: "Select at least one skill, goal, or 'everything'." });

  const ent = await checkEntitlement(tok(req));
  if (ent.enforced && !ent.allowed) return res.status(402).json({ error: "Free run used. A plan is required.", paywall: true });

  res.setHeader("content-type", "application/x-ndjson; charset=utf-8");
  res.setHeader("cache-control", "no-cache, no-transform");
  const send = (obj: unknown) => res.write(JSON.stringify(obj) + "\n");
  send({ type: "start", skills: keys.map((k) => ({ key: k, name: SKILLS_BY_KEY[k].name })) });

  const collected: Deliverable[] = [];
  try {
    await runSkillsStreaming(keys, body.context, (d) => {
      collected.push(d);
      send({ type: "deliverable", deliverable: d });
    });
    if (collected.some((d) => d.ok)) await recordRunServer(ent.uid);
    send({ type: "done" });
  } catch (err) {
    send({ type: "error", error: err instanceof Error ? err.message : String(err) });
  } finally {
    res.end();
  }
});

// ── Payments: create order ──
app.post("/api/payments/create-order", async (req, res) => {
  const tier = tierById(req.body?.tier || "");
  if (!tier) return res.status(400).json({ error: "Unknown tier" });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.json({ simulated: true, tier: tier.id });

  const amount = tier.price * 100;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const uid = await verifyUid(tok(req));
  try {
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR", receipt: `ms_${tier.id}_${Date.now()}`, notes: { tier: tier.id, uid: uid || "" } }),
    });
    const order = (await r.json()) as { id?: string; error?: { description?: string } };
    if (!r.ok) return res.status(502).json({ error: order?.error?.description || "Order failed" });
    res.json({ orderId: order.id, amount, keyId, tier: tier.id });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Order failed" });
  }
});

// ── Payments: verify ──
app.post("/api/payments/verify", async (req, res) => {
  const tier = tierById(req.body?.tier || "");
  if (!tier) return res.status(400).json({ error: "Unknown tier" });
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return res.status(500).json({ error: "Payments not configured" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment fields" });
  }
  const expected = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const ok =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!ok) return res.status(400).json({ error: "Signature verification failed" });

  const uid = await verifyUid(tok(req));
  if (!uid) return res.json({ ok: true, persisted: false, tier: tier.id });
  await activatePlanServer(uid, tier.id);
  res.json({ ok: true, persisted: true, tier: tier.id });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`MarketStack API on http://localhost:${port}`));
