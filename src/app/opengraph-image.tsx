import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "DecisionReady AI — Evidence-backed Hiring Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #F8FAFC 0%, #ECFDF5 55%, #FFFFFF 100%)",
          padding: 64,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #16A34A, #22C55E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            DR
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0F172A" }}>
            DecisionReady AI
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Evidence-backed Hiring Intelligence
          </div>
          <div style={{ fontSize: 24, color: "#475569", maxWidth: 820 }}>
            Decision Readiness for structured debriefs — never Hire or Reject.
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#064E3B", fontWeight: 600 }}>
          decisionready.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
