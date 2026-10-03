import { d, std, tgpu } from "typegpu";

import { luma, rot2 } from "@/components/orbs/shader";


export const orb19Params = d.struct({
  anim: d.f32,
  c_body: d.vec3f,
  c_high: d.vec3f,
  c_low: d.vec3f,
  c_sheen: d.vec3f,
  inputVol: d.f32,
  outputVol: d.f32,
  p_bead: d.f32,
  p_bulge: d.f32,
  p_contrast: d.f32,
  p_edge: d.f32,
  p_floorLevel: d.f32,
  p_gain: d.f32,
  p_grow: d.f32,
  p_jitter: d.f32,
  p_light: d.f32,
  p_radius: d.f32,
  p_rim: d.f32,
  p_saturation: d.f32,
  p_scale: d.f32,
  p_skew: d.f32,
  p_slide: d.f32,
  p_speed: d.f32,
  p_swirl: d.f32,
  p_vary: d.f32,
  res: d.vec2f,
  time: d.f32,
});

const layout = tgpu
  .bindGroupLayout({
    params: { uniform: orb19Params },
  })
  .$idx(0);

const hash = tgpu.fn(
  [d.vec2f],
  d.f32
)((p) =>
  std.fract(std.sin(std.dot(p, d.vec2f(127.1, 311.7))) * 43_758.545_312_3)
);

const foamRender = tgpu.fn(
  [d.vec2f, d.f32, d.f32, d.f32],
  d.vec3f
)((fragCoord, foamGrow, foamJitter, foamGain) => {
  "use gpu";
  const u = layout.$.params;
  const uv = fragCoord.mul(2).sub(u.res).div(std.min(u.res.x, u.res.y));
  const R = std.max(u.p_radius, 0.001);

  const pl = uv.div(R);
  const z = std.sqrt(std.max(1 - std.dot(pl, pl), 0));

  const t = u.p_speed;

  let p = pl.div(z + 1 + u.p_bulge).mul(u.p_scale);

  const sw = u.p_swirl;
  p = std.mul(rot2(sw), p);
  p = p.add(d.vec2f(u.p_slide, u.p_slide * 0.7));

  const cell = std.ceil(p);
  const f = p.sub(cell);

  let cover = d.f32();
  let bestRel = d.f32(1e9);
  let bestDelta = d.vec2f();
  let bestRad = d.f32(1);
  let bestId = d.vec2f();

  for (const gy of std.range(3)) {
    for (const gx of std.range(3)) {
      const g = d.vec2f(d.f32(gx) - 1, d.f32(gy) - 1);
      const id = cell.add(g);

      const rad =
        std.dot(std.cos(id.sub(t)), std.sin(id.yx.mul(u.p_skew).add(t))) *
          u.p_vary +
        foamGrow;
      const jit = std.cos(id.yx.add(t)).mul(foamJitter);
      const delta = f.sub(g).sub(jit);
      const dist = std.length(delta);

      cover = std.max(cover, std.clamp((rad - dist) * u.p_edge, 0, 1));

      const rel = dist / std.max(rad, 1e-4);
      if (rel < bestRel) {
        bestRel = rel;
        bestDelta = d.vec2f(delta);
        bestRad = rad;
        bestId = d.vec2f(id);
      }
    }
  }

  const rr = std.max(bestRad, 1e-4);
  const dome = std.clamp(1 - std.dot(bestDelta, bestDelta) / (rr * rr), 0, 1);
  const bn = std.normalize(d.vec3f(bestDelta.div(rr), std.sqrt(dome) + 0.001));

  const key = std.normalize(d.vec3f(-0.45, 0.55, 0.72));
  const beadLam = std.clamp(std.dot(bn, key), 0, 1);

  const beadCol = std.mix(u.c_low, u.c_high, hash(bestId.add(0.5)));

  const shade = std.mix(1, 0.45 + 0.85 * beadLam, u.p_bead);
  let col = beadCol.mul(shade * foamGain * cover);

  col = col.add(u.c_body.mul(u.p_floorLevel));

  col = std.pow(std.max(col, d.vec3f()), d.vec3f(u.p_contrast));

  const lum = luma(col);
  col = std.mix(d.vec3f(lum), col, u.p_saturation);

  const n = d.vec3f(pl, z);
  const lambert = std.clamp(std.dot(n, key), 0, 1);
  col = col.mul(0.55 + u.p_light * lambert);

  const fres = 1 - z;
  const fresCubed = fres * fres * fres;
  col = col.add(u.c_sheen.mul(u.p_rim * fresCubed));

  return col;
});

const orb19Fragment = tgpu
  .fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
  })((input) => {
    "use gpu";
    const u = layout.$.params;
    const fragCoord = input.uv.mul(u.res);
    const orbUv = fragCoord.mul(2).sub(u.res).div(std.min(u.res.x, u.res.y));

    const foamGrow = u.p_grow * (1 + 0.35 * u.outputVol);
    const foamJitter = u.p_jitter * (1 + 0.5 * u.inputVol);
    const foamGain = u.p_gain * (0.85 + 0.4 * u.outputVol);

    const mask = std.smoothstep(
      0.012,
      -0.012,
      std.length(orbUv) - std.max(u.p_radius, 0.001)
    );

    if (mask <= 0) {
      return d.vec4f();
    }

    const col = foamRender(fragCoord, foamGrow, foamJitter, foamGain);

    const a = mask;
    return d.vec4f(std.max(col, d.vec3f()).mul(a), a);
  })
  .$name("orb19Fragment");

export const orb19Shader = tgpu.resolve([orb19Fragment]);
