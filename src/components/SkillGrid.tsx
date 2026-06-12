"use client";

import { motion } from "framer-motion";
import { SKILLS } from "@/lib/skills";

const CATEGORY_COLORS: Record<string, string> = {
  Analysis: "text-rose-400",
  Conversion: "text-accent2",
  Content: "text-accent",
  SEO: "text-sky-400",
  Paid: "text-amber-400",
  Measurement: "text-pink-400",
  Growth: "text-emerald-400",
  Strategy: "text-violet-400",
};

export default function SkillGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SKILLS.map((s, i) => (
        <motion.div
          key={s.key}
          className="glass rounded-xl p-4 transition-colors hover:border-white/20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
        >
          <div className={`text-xs font-semibold uppercase tracking-wide ${CATEGORY_COLORS[s.category] || "text-white/60"}`}>
            {s.category}
          </div>
          <div className="mt-1 font-semibold">{s.name}</div>
          <div className="mt-1 text-sm text-white/55">{s.blurb}</div>
        </motion.div>
      ))}
    </div>
  );
}
