
import CountUp from "react-countup";
import { motion } from "framer-motion";

interface Stat {
  end: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

const STATS: Stat[] = [
  { end: 41, suffix: "+", label: "marketing skills available" },
  { end: 2, label: "inputs: GitHub + domain" },
  { end: 90, suffix: "-day", label: "go-to-market plan" },
  { end: 100, suffix: "%", label: "grounded in your real product" },
];

export default function Stats() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          className="glass rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        >
          <div className="text-4xl font-bold gradient-text md:text-5xl">
            {s.prefix}
            <CountUp end={s.end} duration={2} decimals={s.decimals || 0} enableScrollSpy scrollSpyOnce />
            {s.suffix}
          </div>
          <div className="mt-2 text-sm text-white/55">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
