import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminAuth, adminReady } from "@/lib/firebaseAdmin";
import { activatePlanServer } from "@/lib/entitlementServer";
import { tierById } from "@/lib/pricing";

export const runtime = "nodejs";

// Verifies a Razorpay payment signature, then activates the plan for the signed-in user.
// This is the ONLY place a plan becomes active server-side — clients can't forge it.
export async function POST(req: NextRequest) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    tier?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tier = tierById(body.tier || "");
  if (!tier) return NextResponse.json({ error: "Unknown tier" }, { status: 400 });

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payments not configured" }, { status: 500 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // HMAC-SHA256(order_id|payment_id) with the key secret must match the signature.
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const ok =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!ok) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

  // Attribute the plan to the signed-in user.
  const auth = getAdminAuth();
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!adminReady() || !auth || !token) {
    // Payment verified but we can't persist server-side (Firebase Admin missing).
    return NextResponse.json({ ok: true, persisted: false, tier: tier.id });
  }
  try {
    const { uid } = await auth.verifyIdToken(token);
    await activatePlanServer(uid, tier.id);
    return NextResponse.json({ ok: true, persisted: true, tier: tier.id });
  } catch {
    return NextResponse.json({ ok: true, persisted: false, tier: tier.id });
  }
}
