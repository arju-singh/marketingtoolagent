import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { activatePlanServer } from "@/lib/entitlementServer";
import { tierById } from "@/lib/pricing";

export const runtime = "nodejs";

// Razorpay → us. Activates a plan even if the browser closed mid-redirect.
// Subscribe to `payment.captured` (and/or `order.paid`) in the Razorpay dashboard,
// pointing at /api/payments/webhook, with RAZORPAY_WEBHOOK_SECRET set.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !keyId || !keySecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Verify against the RAW body — re-serializing JSON would change the bytes and break the MAC.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Resolve the order id from whichever event we got.
  const payment = event.payload?.payment?.entity as { order_id?: string; notes?: Record<string, string> } | undefined;
  const order = event.payload?.order?.entity as { id?: string; notes?: Record<string, string> } | undefined;
  const orderId = order?.id || payment?.order_id;

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: event.event }); // ack unrelated events
  }

  // Prefer notes already on the payload; otherwise fetch the order for its notes.
  let notes = order?.notes || payment?.notes;
  if ((!notes?.uid || !notes?.tier) && orderId) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const o = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: { authorization: `Basic ${auth}` },
      }).then((r) => r.json());
      notes = o?.notes || notes;
    } catch {
      /* fall through */
    }
  }

  const uid = notes?.uid;
  const tier = tierById(notes?.tier || "");
  if (uid && tier) {
    await activatePlanServer(uid, tier.id);
    return NextResponse.json({ ok: true, activated: tier.id });
  }
  // Verified but not attributable (no uid in notes) — ack so Razorpay doesn't retry forever.
  return NextResponse.json({ ok: true, activated: false });
}
