import Link from "next/link";
import Reveal from "@/components/Reveal";
import Marquee from "@/components/Marquee";
import Stats from "@/components/Stats";
import ScrollStory from "@/components/ScrollStory";
import SkillGrid from "@/components/SkillGrid";
import HeroShowcase from "@/components/HeroShowcase";
import { GOALS } from "@/lib/skills";

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
        <Link href="/app" className="btn-ghost !py-2 !text-sm">Open the tool</Link>
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
            <Link href="/app" className="btn-primary">Generate my marketing →</Link>
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

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <h2 className="text-5xl font-bold">Ship marketing tonight.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            One paste in. A dashboard of paste-ready deliverables out.
          </p>
          <Link href="/app" className="btn-primary mt-8">Open the tool →</Link>
        </Reveal>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 text-center text-sm text-white/30">
        MarketStack · Next.js + Tailwind + Framer Motion · GSAP ScrollTrigger + Lenis · Node + Firebase · Claude
      </footer>
    </main>
  );
}
