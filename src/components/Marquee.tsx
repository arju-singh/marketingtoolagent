"use client";

// CSS-keyframe marquee. The track is rendered twice; translating it -50% loops seamlessly.
export default function Marquee({ items }: { items: string[] }) {
  const track = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden py-4">
      <div className="flex w-max animate-marquee gap-4 whitespace-nowrap">
        {track.map((item, i) => (
          <span
            key={i}
            className="glass rounded-full px-5 py-2 text-sm text-white/70"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
