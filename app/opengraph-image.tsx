import { ImageResponse } from "next/og";

export const alt = "Drishti: every claim about your competitors, traced to its source.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLUM = "#2A1724";
const VERMILION = "#E4572E";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", color: PLUM, padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, border: `5px solid ${PLUM}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: VERMILION }} />
          </div>
          Drishti
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
          <div style={{ display: "flex" }}>Every claim about your competitors,</div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", background: VERMILION, color: "#ffffff", padding: "0 20px", marginLeft: -20 }}>traced to its source.</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#5E4957" }}>Competitor research for Indian D2C skincare and beauty brands</div>
      </div>
    ),
    { ...size },
  );
}
