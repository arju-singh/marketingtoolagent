"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TIERS, CURRENCY, type Tier } from "@/lib/pricing";
import { useAuth } from "@/lib/auth";

// Minimal shape of the Razorpay checkout we use.
interface RazorpayInstance { open: () => void }
interface RazorpayOptions {
  key: string; order_id: string; amount: number; currency: string;
  name: string; description: string;
  handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void }; theme?: { color?: string };
}
declare global {
  interface Window { Razorpay?: new (o: RazorpayOptions) => RazorpayInstance }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Shown when the free run is used up. onPaid(tier) fires after a verified (or simulated) payment.
export default function Paywall({ onPaid, onClose }: { onPaid: (tier: Tier) => void; onClose: () => void }) {
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, enabled: authEnabled, signIn, token } = useAuth();
  // When Supabase is on, require sign-in so the plan is attributed to a real user.
  const needSignIn = authEnabled && !user;

  async function buy(tier: Tier) {
    setError(null);
    setPaying(tier.id);
    try {
      const tok = await token().catch(() => null);
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (tok) headers.authorization = `Bearer ${tok}`;

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({ tier: tier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");

      // No gateway configured → demo unlock.
      if (data.simulated) {
        onPaid(tier);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) throw new Error("Could not load checkout");

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: "INR",
        name: "MarketStack",
        description: `${tier.name} plan`,
        theme: { color: "#6d5efc" },
        modal: { ondismiss: () => setPaying(null) },
        handler: async (resp) => {
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers,
            body: JSON.stringify({ ...resp, tier: tier.id }),
          });
          const vd = await v.json();
          if (v.ok && vd.ok) onPaid(tier);
          else {
            setError("Payment verification failed.");
            setPaying(null);
          }
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaying(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="glass max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-wide text-accent2">Your free run is used</div>
          <h2 className="mt-2 text-3xl font-bold">Keep your agency running</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/55">
            The first project analysis is on us. To generate more, pick a plan — billed once.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        {needSignIn ? (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <div className="text-lg font-semibold">Sign in to continue</div>
            <p className="mt-2 text-sm text-white/55">
              So your plan stays with your account across devices, sign in before paying.
            </p>
            <button onClick={() => signIn()} className="btn-primary mt-6">Sign in with Google</button>
          </div>
        ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                t.popular ? "border-accent bg-accent/10" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold">
                  Most popular
                </span>
              )}
              <div className="text-lg font-semibold">{t.name}</div>
              <div className="mt-1 text-sm text-white/50">{t.tagline}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{CURRENCY}{t.price}</span>
                <span className="text-sm text-white/40">one-time</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-white/70">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-accent2">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => buy(t)}
                disabled={!!paying}
                className={`mt-6 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-50 ${
                  t.popular ? "bg-accent text-white" : "border border-white/15 text-white/90 hover:bg-white/5"
                }`}
              >
                {paying === t.id ? "Processing…" : `Pay ${CURRENCY}${t.price} & continue`}
              </button>
            </div>
          ))}
        </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={onClose} className="text-sm text-white/40 hover:text-white/70">Maybe later</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
