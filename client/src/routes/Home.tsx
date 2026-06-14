import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";
import Marquee from "@/components/Marquee";
import Stats from "@/components/Stats";
import ScrollStory from "@/components/ScrollStory";
import SkillGrid from "@/components/SkillGrid";
import HeroShowcase from "@/components/HeroShowcase";
import { GOALS } from "@/lib/skills";
import { TIERS, CURRENCY, ALL_PLANS_INCLUDE } from "@/lib/pricing";

const MARQUEE = [
  "CRO audit", "Landing copy", "SEO audit", "AI search (GEO)", "Lifecycle emails",
  "Ad creative", "Launch plan", "Pricing strategy", "Referral loops", "Schema markup",
  "Competitor pages", "90-day GTM plan", "Lead magnets", "Social content", "Analytics plan",
];

export default function Home() {
  return (
    <main className="grid-bg min-h-screen">
      {/* NAV */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold">Market<span className="gradient-text">Stack</span></span>
        <div className="flex items-center gap-2">
          <a href="#pricing" className="btn-ghost !py-2 !text-sm">Pricing</a>
          <Link to="/app" className="btn-ghost !py-2 !text-sm">Open the tool</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="noise relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        {/* ambient light blobs */}
        <div className="orb -top-20 left-10 h-72 w-72 bg-accent/30" />
        <div className="orb right-0 top-10 h-64 w-64 bg-accent2/25" />
        <Reveal>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-accent2" /> An AI marketing agency powered by Claude Mythos 5
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Your repo + domain →<br /> a <span className="gradient-text">full marketing suite</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Paste a GitHub repo and your live site. Get CRO, SEO, copy, emails, ads, a launch plan
            and a 90-day go-to-market — 41+ marketing skills, every one grounded in your real product.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/app" className="btn-primary">Generate my marketing →</Link>
            <a href="#skills" className="btn-ghost">See all 41 skills</a>
          </div>
        </Reveal>

        {/* product mockup showcase */}
        <HeroShowcase />
      </section>

      {/* MARQUEE */}
      <Marquee items={MARQUEE} />

      {/* STATS */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <Stats />
      </section>

      {/* PINNED SCROLL STORY — centerpiece */}
      <ScrollStory />

      {/* GOALS */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="text-center text-4xl font-bold">Pick a goal. Get the playbook.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-white/55">
            Each goal runs a curated bundle of skills — or hit “Generate everything” for the full suite.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GOALS.map((g, i) => (
            <Reveal key={g.key} delay={(i % 3) * 0.06}>
              <div className="glass h-full rounded-2xl p-6">
                <div className="text-3xl">{g.emoji}</div>
                <div className="mt-3 text-xl font-semibold">{g.label}</div>
                <div className="mt-1 text-white/55">{g.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ALL SKILLS */}
      <section id="skills" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="text-center text-4xl font-bold">41+ marketing skills, on tap</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-white/55">
            Modeled on the open marketing-skills library. Every skill reads your product first, then executes.
          </p>
        </Reveal>
        <div className="mt-12">
          <SkillGrid />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-accent2" /> First project free — no card required
          </div>
          <h2 className="text-center text-4xl font-bold">Simple, one-time pricing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-white/55">
            Your first analysis is on us. After that, pick a plan that fits — pay once, keep every deliverable.
            No subscriptions, no recurring charges.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.06}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-7 ${
                  t.popular
                    ? "border-accent bg-accent/10 shadow-[0_0_40px_-12px] shadow-accent/40 md:-mt-4 md:mb-[-1rem]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}

                {/* header */}
                <div className="text-xl font-semibold">{t.name}</div>
                <div className="mt-1 text-sm text-white/45">{t.bestFor}</div>

                {/* price */}
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold">{CURRENCY}{t.price.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-white/45">one-time</span>
                </div>
                <div className="mt-1 text-sm text-white/55">{t.tagline}</div>

                {/* headline quota */}
                <div
                  className={`mt-5 rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                    t.popular ? "bg-accent/20 text-white" : "bg-white/5 text-white/80"
                  }`}
                >
                  {t.projects}
                </div>

                {/* features */}
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-white/70">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-accent2">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* cta */}
                <Link
                  to="/app"
                  className={`mt-7 rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                    t.popular
                      ? "bg-accent text-white hover:opacity-90"
                      : "border border-white/15 text-white/90 hover:bg-white/5"
                  }`}
                >
                  Get {t.name} →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* all plans include */}
        <Reveal delay={0.1}>
          <div className="glass mt-10 rounded-2xl p-6">
            <div className="text-center text-sm font-semibold uppercase tracking-wide text-white/50">
              Every plan includes
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ALL_PLANS_INCLUDE.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="mt-0.5 shrink-0 text-accent2">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-white/35">
            Prices in INR, inclusive of taxes. Secure checkout via Razorpay — UPI, cards & netbanking.
            Your plan follows your account across devices once you sign in.
          </p>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <h2 className="text-5xl font-bold">Ship marketing tonight.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            One paste in. A dashboard of paste-ready deliverables out.
          </p>
          <Link to="/app" className="btn-primary mt-8">Open the tool →</Link>
        </Reveal>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 text-center text-sm text-white/30">
        MarketStack · Next.js + Tailwind + Framer Motion · GSAP ScrollTrigger + Lenis · Node + Supabase · Claude
      </footer>
    </main>
  );
}
