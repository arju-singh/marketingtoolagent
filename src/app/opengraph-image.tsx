import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MarketStack — your repo + domain → a full marketing suite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(900px 500px at 80% -10%, rgba(109,94,252,0.45), transparent), radial-gradient(700px 500px at 0% 120%, rgba(21,211,168,0.3), transparent)",
          color: "#f7f7f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#15d3a8" }} />
          Powered by Claude Mythos 5 · 41+ marketing skills
        </div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, marginTop: 28, lineHeight: 1.05 }}>
          Your repo + domain →
        </div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, color: "#9d8cff", lineHeight: 1.05 }}>
          a full marketing suite
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.6)", marginTop: 28, maxWidth: 900 }}>
          CRO · SEO · copy · emails · ads · launch · a 90-day go-to-market — grounded in your real product.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
          {["Full Agency Audit", "Landing copy", "Ad creative", "90-day plan"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 24,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 30, fontWeight: 700 }}>MarketStack</div>
      </div>
    ),
    { ...size }
  );
}
