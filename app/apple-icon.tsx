import { ImageResponse } from "next/og";
import { BRAND_INK, BRAND_PAPER, markSvg } from "@/lib/brandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const mark = `data:image/svg+xml;utf8,${encodeURIComponent(markSvg({ color: BRAND_INK }))}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_PAPER }}>
        <img src={mark} width={116} height={116} alt="" />
      </div>
    ),
    size,
  );
}
