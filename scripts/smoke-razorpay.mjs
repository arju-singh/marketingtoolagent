// Razorpay webhook smoke test — confirms the /api/payments/webhook signature check
// and plan-activation path without touching the real Razorpay API.
//
// Usage:
//   RAZORPAY_WEBHOOK_SECRET=testsecret BASE_URL=http://127.0.0.1:8787 \
//     node scripts/smoke-razorpay.mjs [uid] [tier]
//
// The Express server must be started with the SAME RAZORPAY_WEBHOOK_SECRET (plus dummy
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET so the route is "configured"):
//   RAZORPAY_WEBHOOK_SECRET=testsecret RAZORPAY_KEY_ID=x RAZORPAY_KEY_SECRET=y npm --prefix server start
import crypto from "node:crypto";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";
const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const uid = process.argv[2] || "smoke-uid-123";
const tier = process.argv[3] || "pro";

if (!SECRET) {
  console.error("✗ Set RAZORPAY_WEBHOOK_SECRET (must match the running server).");
  process.exit(1);
}

const body = JSON.stringify({
  event: "order.paid",
  payload: {
    order: { entity: { id: "order_smoke123", notes: { uid, tier } } },
    payment: { entity: { order_id: "order_smoke123" } },
  },
});
const sign = crypto.createHmac("sha256", SECRET).update(body).digest("hex");

async function post(signature) {
  const res = await fetch(`${BASE}/api/payments/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": signature },
    body,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

let pass = true;

// 1. Valid signature → should ack (and activate when Firebase Admin is configured).
const ok = await post(sign);
const activated = ok.json.activated;
const validPass = ok.status === 200 && (activated === tier || activated === false);
console.log(`valid signature   → ${ok.status} ${JSON.stringify(ok.json)}  ${validPass ? "✓" : "✗"}`);
if (activated === false) console.log("  (note: activated:false means Firebase Admin isn't configured — signature path still verified)");
pass &&= validPass;

// 2. Tampered signature → must be rejected.
const bad = await post("deadbeefdeadbeef");
const badPass = bad.status === 400;
console.log(`tampered signature → ${bad.status} ${JSON.stringify(bad.json)}  ${badPass ? "✓" : "✗"}`);
pass &&= badPass;

console.log(pass ? "\n✅ webhook smoke test passed" : "\n❌ webhook smoke test failed");
process.exit(pass ? 0 : 1);
