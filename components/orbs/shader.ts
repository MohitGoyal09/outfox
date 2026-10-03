import { d, std, tgpu } from "typegpu";

export const rot2 = tgpu.fn(
  [d.f32],
  d.mat2x2f
)((angle) => {
  "use gpu";
  const c = std.cos(angle);
  const s = std.sin(angle);
  return d.mat2x2f(d.vec2f(c, -s), d.vec2f(s, c));
});

export const luma = tgpu.fn(
  [d.vec3f],
  d.f32
)((col) => std.dot(col, d.vec3f(0.299, 0.587, 0.114)));

export const EDGE_FADE_MAX = 0.985;

export const edgeFade = tgpu.fn(
  [d.f32, d.f32],
  d.f32
)(
  (fadeStart, radius) =>
    1 - std.smoothstep(std.min(fadeStart, EDGE_FADE_MAX), 1, radius)
);
