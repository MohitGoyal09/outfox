const HEX6 = /^#[0-9a-f]{6}$/i;
export const PALETTE_FALLBACK = { paper: "#f6f7f4", ink: "#15171b" };

export function readPalette() {
  const paper = s.getPropertyValue("--bg").trim();
  const ink = s.getPropertyValue("--text-primary").trim();
  return { paper: HEX6.test(paper) ? paper : PALETTE_FALLBACK.paper, ink: HEX6.test(ink) ? ink : PALETTE_FALLBACK.ink };
}

export const PHOTO_PAPER = "#FFFFFF";
export const HERO_INK = "#D69696";
