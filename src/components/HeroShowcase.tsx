"use client";

import { motion } from "framer-motion";
import BrowserMockup from "./BrowserMockup";
import DashboardPreview from "./DashboardPreview";

const CHIPS = [
  { label: "CRO ✓", className: "-left-6 top-10 float-slow", color: "text-accent2" },
  { label: "SEO audit ✓", className: "-right-8 top-20 float-mid", color: "text-sky-400" },
  { label: "12 emails ✓", className: "-left-10 bottom-16 float-mid", color: "text-accent" },
  { label: "Launch kit ✓", className: "-right-6 bottom-10 float-slow", color: "text-amber-400" },
];

export default function HeroShowcase() {
  return (
    <div className="relative mx-auto mt-20 max-w-3xl px-6">
      {/* glow orb behind the mockup */}
      <div className="orb -top-10 left-1/2 h-72 w-72 -translate-x-1/2 bg-accent/40" />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
        style={{ perspective: 1200 }}
      >
        <BrowserMockup url="marketstack.app/app">
          <DashboardPreview />
        </BrowserMockup>

        {/* floating skill chips */}
        {CHIPS.map((c) => (
          <div
            key={c.label}
            className={`glass absolute hidden rounded-full px-3 py-1.5 text-xs font-medium md:block ${c.className} ${c.color}`}
          >
            {c.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
