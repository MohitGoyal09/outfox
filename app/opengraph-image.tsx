import { ImageResponse } from "next/og";

export const alt = "Drishti: see every move your competitors make.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#14100F";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", color: INK, padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, border: `5px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: INK }} />
          </div>
          Drishti
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 980 }}>See every move your competitors make.</div>
        <div style={{ display: "flex", fontSize: 30, color: "#5E4957" }}>Competitor research for Indian D2C skincare and beauty brands</div>
      </div>
    ),
    { ...size },
  );
}
