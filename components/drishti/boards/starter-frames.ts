export const STARTER_FRAME_TITLES = ["Hooks", "Offers", "Creatives", "To test"] as const;
export const STARTER_FRAME_W = 320;
export const STARTER_FRAME_H = 720;
export const STARTER_FRAME_GAP = 40;

export type StarterFrame = { title: string; x: number; y: number; w: number; h: number };

export function starterFrames(): StarterFrame[] {
  return STARTER_FRAME_TITLES.map((title, i) => ({
    title,
    x: i * (STARTER_FRAME_W + STARTER_FRAME_GAP),
    y: 0,
    w: STARTER_FRAME_W,
    h: STARTER_FRAME_H,
  }));
}
