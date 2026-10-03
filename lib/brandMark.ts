
export const BRAND_INK = "#17191D";
export const BRAND_PAPER = "#F6F7F4";

export const MARK_VIEWBOX = 48;
export const MARK_STROKE = 4.5;
export const MARK_CLAIM = { cx: 15.4, cy: 32.6, r: 7 } as const;
export const MARK_SOURCE = { cx: 33.4, cy: 14.6, r: 8.5 } as const;
export const MARK_LINK = { x1: 20.35, y1: 27.65, x2: 29.16, y2: 18.84 } as const;

export function markShapes(): string {
  const { cx: c1x, cy: c1y, r: c1r } = MARK_CLAIM;
  const { cx: c2x, cy: c2y, r: c2r } = MARK_SOURCE;
  const { x1, y1, x2, y2 } = MARK_LINK;
  return (
    `<circle cx="${c1x}" cy="${c1y}" r="${c1r}" fill="none" stroke="currentColor" stroke-width="${MARK_STROKE}"/>` +
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="${MARK_STROKE}"/>` +
    `<circle cx="${c2x}" cy="${c2y}" r="${c2r}" fill="currentColor"/>`
  );
}

export type MarkSvgOptions = {
  color?: string;
  darkColor?: string;
  tile?: boolean;
};

export function markSvg({ color = BRAND_INK, darkColor, tile = false }: MarkSvgOptions = {}): string {
  const style = darkColor
    ? `<style>svg{color:${color}}@media (prefers-color-scheme:dark){svg{color:${darkColor}}}</style>`
    : "";
  const body = tile
    ? `<rect width="48" height="48" rx="10" fill="${BRAND_PAPER}"/><g transform="translate(6 6) scale(0.75)">${markShapes()}</g>`
    : markShapes();
  const colorAttr = darkColor ? "" : ` color="${color}"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}"${colorAttr}>` +
    `${style}${body}</svg>`
  );
}
