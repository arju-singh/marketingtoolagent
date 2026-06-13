
import { motion } from "framer-motion";

// A faux results-dashboard rendered as real JSX (sharper than a screenshot) for the hero showcase.
const SKILLS = [
  { name: "Master Marketing Plan", on: true },
  { name: "Landing Copy", on: true },
  { name: "CRO Audit", on: false },
  { name: "SEO Audit", on: false },
  { name: "Lifecycle Emails", on: false },
  { name: "Launch Plan", on: false },
];

export default function DashboardPreview() {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-left">
      {/* sidebar */}
      <aside className="rounded-lg bg-white/[0.03] p-2">
        <div className="px-1 pb-2 text-[9px] uppercase tracking-wide text-white/30">Deliverables</div>
        {SKILLS.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`mb-0.5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] ${
              s.on ? "bg-accent/15 text-white" : "text-white/45"
            }`}
          >
            <span>{s.on ? "📄" : <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/15" />}</span>
            <span className="truncate">{s.name}</span>
          </motion.div>
        ))}
      </aside>

      {/* article */}
      <div className="rounded-lg bg-white/[0.02] p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] text-white/30">claude-opus-4-8</span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] text-white/40">Copy markdown</span>
        </div>
        <div className="h-3 w-2/3 rounded bg-white/15" />
        <div className="mt-3 space-y-1.5">
          {[100, 92, 96, 70, 88, 60].map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="h-2 rounded bg-white/[0.08]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Hero", "FAQ", "CTA"].map((t) => (
            <div key={t} className="rounded-md border border-white/10 bg-white/[0.03] p-2">
              <div className="text-[9px] text-accent2">{t}</div>
              <div className="mt-1 h-1.5 w-full rounded bg-white/10" />
              <div className="mt-1 h-1.5 w-3/4 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
