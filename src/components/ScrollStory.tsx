"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const STEPS = [
  { n: "01", title: "Paste your repo + domain", body: "Drop a GitHub URL and your live site. That's the entire input." },
  { n: "02", title: "We ingest your product", body: "We read your README, features, stack, copy, meta tags, schema and SEO signals into one ProductContext." },
  { n: "03", title: "41+ marketing skills run", body: "CRO, SEO, copy, emails, ads, launch, pricing — each grounded in your real product, powered by Claude." },
  { n: "04", title: "Get everything you need", body: "A dashboard of paste-ready deliverables and a 90-day marketing plan. Export and ship." },
];

const bar = (w: string, c = "bg-white/10") => <div className={`h-2 rounded ${c}`} style={{ width: w }} />;

// Rich per-step mockup content shown in the browser window on the right.
function StepVisual({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="space-y-3">
        {["github.com/you/project", "yourproject.com"].map((v, k) => (
          <div key={k} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/70">{v}</div>
        ))}
        <div className="mt-1 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold">Ingest my product →</div>
      </div>
    );
  if (i === 1)
    return (
      <div className="space-y-2.5 text-sm">
        {["12 features extracted", "tech stack: React, Node, Supabase", "SEO crawl complete", "ProductContext built"].map((t, k) => (
          <div key={k} className="flex items-center gap-2 text-white/70">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-accent2/20 text-[10px] text-accent2">✓</span>
            {t}
          </div>
        ))}
      </div>
    );
  if (i === 2)
    return (
      <div className="space-y-2 text-sm">
        {[["cro", "done"], ["seo-audit", "done"], ["copywriting", "done"], ["ads", "running"], ["launch", "queued"]].map(([s, st], k) => (
          <div key={k} className="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-1.5">
            <span className="font-mono text-white/70">{s}</span>
            <span className={`rounded px-2 py-0.5 text-[10px] ${st === "done" ? "bg-accent2/15 text-accent2" : st === "running" ? "bg-amber-400/15 text-amber-300" : "bg-white/10 text-white/40"}`}>{st}</span>
          </div>
        ))}
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full w-3/5 bg-gradient-to-r from-accent to-accent2" /></div>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {["Landing copy", "Email flows", "Ad sets", "90-day GTM plan"].map((t, k) => (
        <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[11px] text-accent2">📄 {t}</div>
          <div className="mt-2 space-y-1">{bar("100%")}{bar("75%")}</div>
        </div>
      ))}
    </div>
  );
}

// The pinned scroll-story: the section pins while content scrubs through the 4 steps.
// This is the "award-level" centerpiece.
export default function ScrollStory() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".story-panel");
      const total = panels.length;

      // Pin the whole section for `total` screens of scroll.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${total * 100}%`,
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) {
          gsap.set(panel, { autoAlpha: 1, y: 0 });
        } else {
          tl.fromTo(
            panel,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, duration: 0.4 }
          );
        }
        if (i < total - 1) {
          tl.to(panel, { autoAlpha: 0, y: -40, duration: 0.4 }, "+=0.4");
        }
        // Progress bar fill.
        tl.to(".story-progress-fill", { scaleX: (i + 1) / total, duration: 0.1 }, "<");
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-screen overflow-hidden">
      {/* progress bar */}
      <div className="absolute left-0 top-0 z-20 h-1 w-full bg-white/5">
        <div className="story-progress-fill h-full origin-left scale-x-0 bg-gradient-to-r from-accent to-accent2" />
      </div>

      <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-2">
        {/* left: stacked panels */}
        <div className="relative h-64">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="story-panel absolute inset-0 flex flex-col justify-center"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <div className="font-mono text-sm text-accent2">{s.n}</div>
              <h3 className="mt-3 text-3xl font-bold md:text-4xl">{s.title}</h3>
              <p className="mt-4 max-w-md text-white/60">{s.body}</p>
            </div>
          ))}
        </div>

        {/* right: synced browser-window mock that morphs per step */}
        <div className="relative h-80">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="story-panel keep-dark glow-ring absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14]"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-1 flex-1 rounded-md bg-black/30 px-3 py-1 text-xs text-white/35">
                  marketstack.app/app · step {s.n}
                </div>
              </div>
              <div className="p-5">
                <StepVisual i={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
