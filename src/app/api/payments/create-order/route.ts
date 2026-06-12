import { NextRequest, NextResponse } from "next/server";
import { tierById } from "@/lib/pricing";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

async function uidFrom(req: NextRequest): Promise<string | null> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth();
  if (!token || !auth) return null;
  try {
    return (await auth.verifyIdToken(token)).uid;
  } catch {
    return null;
  }
}

// Creates a Razorpay order for the chosen tier. When Razorpay keys aren't set,
// returns { simulated: true } so the dev/demo flow still completes without a gateway.
export async function POST(req: NextRequest) {
  let body: { tier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const tier = tierById(body.tier || "");
  if (!tier) return NextResponse.json({ error: "Unknown tier" }, { status: 400 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ simulated: true, tier: tier.id });
  }

  const amount = tier.price * 100; // paise
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  // Embed who this is for, so the webhook can activate the plan without the browser.
  const uid = await uidFrom(req);

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `ms_${tier.id}_${Date.now()}`,
        notes: { tier: tier.id, uid: uid || "" },
      }),
    });
    const order = await res.json();
    if (!res.ok) return NextResponse.json({ error: order?.error?.description || "Order failed" }, { status: 502 });
    return NextResponse.json({ orderId: order.id, amount, keyId, tier: tier.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Order failed" }, { status: 502 });
  }
}
