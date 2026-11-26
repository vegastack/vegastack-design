#!/usr/bin/env node
// Agent faces: the one authority for the 18 preset characters and 9 palettes (operator, 27-11-2026,
// "Approve, go dark", plan `agent-faces/01-plan.md` in the web app). It writes:
//   packages/ui/registry/lib/agent-face-spec.ts   the shapes the `AgentFace` component draws
//   apps/docs/public/agent-face-spec.json         the same shapes and palette colours for the phone
// Coordinates are in a 100 × 100 box. A Pebble body is drawn at radius R = 35 around (50, 49); a
// Dot silhouette fills 92 units, centred. No preset's silhouette may read as a circle (a person) or
// a rounded square (a team or workspace): the guard below fails the build if one does.
//
//   node tooling/agent-face-spec.mjs           write both files
//   node tooling/agent-face-spec.mjs --check   fail if either file is stale
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const TAU = Math.PI * 2;
const R = 35;
const CX = 50;
const CY = 49;

// ---------- a path builder that records SVG and sampled points ----------
const fmt = (v) => {
  const s = (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
};
class Path {
  constructor(map = (x, y) => [x, y]) {
    this.map = map;
    this.d = [];
    this.pts = [];
    this.cur = null;
  }
  P(x, y) {
    return this.map(x, y);
  }
  moveTo(x, y) {
    const [X, Y] = this.P(x, y);
    this.d.push(`M${fmt(X)} ${fmt(Y)}`);
    this.pts.push([X, Y]);
    this.cur = [x, y];
    this.start = [x, y];
    return this;
  }
  lineTo(x, y) {
    const [X, Y] = this.P(x, y);
    this.d.push(`L${fmt(X)} ${fmt(Y)}`);
    this.pts.push([X, Y]);
    this.cur = [x, y];
    return this;
  }
  /** A circular arc in centre form (canvas `arc`), in unscaled units; joins from the current point. */
  arc(cx, cy, r, a0, a1, ccw = false) {
    const sx = cx + Math.cos(a0) * r;
    const sy = cy + Math.sin(a0) * r;
    if (!this.cur) this.moveTo(sx, sy);
    else if (Math.hypot(this.cur[0] - sx, this.cur[1] - sy) > 1e-6)
      this.lineTo(sx, sy);
    let sweep = a1 - a0;
    if (!ccw && sweep < 0) sweep += TAU;
    if (ccw && sweep > 0) sweep -= TAU;
    const steps = Math.max(2, Math.ceil(Math.abs(sweep) / (Math.PI / 24)));
    for (let i = 1; i <= steps; i++) {
      const a = a0 + (sweep * i) / steps;
      this.pts.push(this.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    const ex = cx + Math.cos(a1) * r;
    const ey = cy + Math.sin(a1) * r;
    const [EX, EY] = this.P(ex, ey);
    const rr = r * this.scale;
    // Split a full turn: an SVG arc can't start and end on the same point.
    if (Math.abs(Math.abs(sweep) - TAU) < 1e-6) {
      const mx = cx + Math.cos(a0 + sweep / 2) * r;
      const my = cy + Math.sin(a0 + sweep / 2) * r;
      const [MX, MY] = this.P(mx, my);
      this.d.push(
        `A${fmt(rr)} ${fmt(rr)} 0 0 ${ccw ? 0 : 1} ${fmt(MX)} ${fmt(MY)}`,
      );
    }
    this.d.push(
      `A${fmt(rr)} ${fmt(rr)} 0 ${Math.abs(sweep) > Math.PI && Math.abs(Math.abs(sweep) - TAU) > 1e-6 ? 1 : 0} ${ccw ? 0 : 1} ${fmt(EX)} ${fmt(EY)}`,
    );
    this.cur = [ex, ey];
    return this;
  }
  close() {
    this.d.push("Z");
    this.cur = null;
    return this;
  }
  get svg() {
    return this.d.join("");
  }
}
const pebble = () => {
  const p = new Path((x, y) => [CX + x * R, CY + y * R]);
  p.scale = R;
  return p;
};
/** Points (already in box units) → a closed polyline path. */
const polyPath = (pts) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`).join("") + "Z";

// ---------- shape helpers (unscaled: radius 1 ≈ R) ----------
function polar(fn, n = 144) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU;
    const r = fn(th);
    pts.push([Math.cos(th) * r, Math.sin(th) * r]);
  }
  return pts;
}
/** A rounded polygon (canvas `arcTo` corners), convex or not. */
function roundedPoly(p, pts, r) {
  const n = pts.length;
  const corners = pts.map((v, i) => {
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const u1 = norm([a[0] - v[0], a[1] - v[1]]);
    const u2 = norm([b[0] - v[0], b[1] - v[1]]);
    const ang = Math.acos(
      Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])),
    );
    const d = r / Math.tan(ang / 2);
    const t1 = [v[0] + u1[0] * d, v[1] + u1[1] * d];
    const t2 = [v[0] + u2[0] * d, v[1] + u2[1] * d];
    const bis = norm([u1[0] + u2[0], u1[1] + u2[1]]);
    const h = r / Math.sin(ang / 2);
    const c = [v[0] + bis[0] * h, v[1] + bis[1] * h];
    return { t1, t2, c };
  });
  corners.forEach(({ t1, t2, c }, i) => {
    const a0 = Math.atan2(t1[1] - c[1], t1[0] - c[0]);
    let a1 = Math.atan2(t2[1] - c[1], t2[0] - c[0]);
    let s = a1 - a0;
    while (s > Math.PI) s -= TAU;
    while (s < -Math.PI) s += TAU;
    if (i === 0) p.moveTo(t1[0], t1[1]);
    p.arc(c[0], c[1], r, a0, a0 + s, s < 0);
  });
  return p.close();
}
const norm = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
/** The outer silhouette of a union of axis-aligned ellipses `[cx, cy, rx, ry]` (exact rays, smoothed). */
function unionPts(comps, n = 180) {
  const rs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU;
    const co = Math.cos(th);
    const si = Math.sin(th);
    let best = 0;
    for (const [cx, cy, rx, ry] of comps) {
      const A = (co / rx) ** 2 + (si / ry) ** 2;
      const B = -2 * ((cx * co) / rx ** 2 + (cy * si) / ry ** 2);
      const C = (cx / rx) ** 2 + (cy / ry) ** 2 - 1;
      const d = B * B - 4 * A * C;
      if (d < 0) continue;
      const r = (-B + Math.sqrt(d)) / (2 * A);
      if (r > best) best = r;
    }
    rs[i] = best;
  }
  return smoothRays(rs);
}
/** The outer silhouette of any union of inside-tests, by bisection along rays from the origin. */
function rayPts(inside, n = 180, max = 2) {
  const rs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU;
    const co = Math.cos(th);
    const si = Math.sin(th);
    let r = max;
    while (r > 0 && !inside(co * r, si * r)) r -= 0.01;
    let lo = r;
    let hi = r + 0.01;
    for (let k = 0; k < 20; k++) {
      const m = (lo + hi) / 2;
      if (inside(co * m, si * m)) lo = m;
      else hi = m;
    }
    rs[i] = lo;
  }
  return smoothRays(rs);
}
function smoothRays(rs) {
  const n = rs.length;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const r =
      (rs[(i - 2 + n) % n] +
        2 * rs[(i - 1 + n) % n] +
        3 * rs[i] +
        2 * rs[(i + 1) % n] +
        rs[(i + 2) % n]) /
      9;
    const th = (i / n) * TAU;
    pts.push([Math.cos(th) * r, Math.sin(th) * r]);
  }
  return pts;
}
const inEllipse =
  (cx, cy, rx, ry, rot = 0) =>
  (x, y) => {
    const c = Math.cos(-rot);
    const s = Math.sin(-rot);
    const dx = x - cx;
    const dy = y - cy;
    const u = dx * c - dy * s;
    const v = dx * s + dy * c;
    return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
  };
const toPebble = (pts) => pts.map(([x, y]) => [CX + x * R, CY + y * R]);
function pebbleFromPts(pts) {
  const box = toPebble(pts);
  return { d: polyPath(box), pts: box };
}
function pebbleFromPath(build) {
  const p = pebble();
  build(p);
  return { d: p.svg, pts: p.pts };
}
const ellipsePath = (cx, cy, rx, ry) =>
  `M${fmt(CX + (cx - rx) * R)} ${fmt(CY + cy * R)}a${fmt(rx * R)} ${fmt(ry * R)} 0 1 0 ${fmt(2 * rx * R)} 0a${fmt(rx * R)} ${fmt(ry * R)} 0 1 0 ${fmt(-2 * rx * R)} 0Z`;
const cubePts = (k) => ({
  top: [0, -k],
  ur: [0.9 * k, -0.48 * k],
  lr: [0.9 * k, 0.52 * k],
  bot: [0, k],
  ll: [-0.9 * k, 0.52 * k],
  ul: [-0.9 * k, -0.48 * k],
  c: [0, 0.02 * k],
});
const polyD = (pts) => polyPath(toPebble(pts));
const RING = { rx: 1.18, ry: 0.3, tilt: -0.28 };
/** A ring's silhouette band, for a Dot outline that keeps it. */
const ringBand = (x, y) =>
  inEllipse(0, 0, RING.rx + 0.05, RING.ry + 0.1, RING.tilt)(x, y);

// ---------- the 18 presets ----------
// eye: x/y in R units from the body centre, sep half the distance between the eyes, s the size scale.
const PRESETS = [
  {
    id: "squish",
    name: "Squish",
    eyes: "tall",
    mouth: true,
    body: () =>
      pebbleFromPts(
        polar(
          (th) =>
            0.86 + 0.15 * Math.cos(4 * th + 0.5) + 0.04 * Math.sin(3 * th),
        ),
      ),
  },
  {
    id: "orbit",
    name: "Orbit",
    eyes: "tall",
    mouth: false,
    eye: { y: -0.08, sep: 0.24, s: 0.92 },
    ring: RING,
    body: () => pebbleFromPath((p) => p.arc(0, 0, 0.8, 0, TAU).close()),
    dot: () => rayPts((x, y) => x * x + y * y <= 0.64 || ringBand(x, y)),
  },
  {
    id: "arch",
    name: "Arch",
    eyes: "tall",
    mouth: true,
    eye: { y: -0.6, sep: 0.21, s: 0.82 },
    motion: "rock",
    body: () =>
      pebbleFromPath((p) => {
        const Ro = 1;
        const Ri = 0.3;
        const y0 = 0.08;
        const leg = 0.48;
        const cap = (Ro - Ri) / 2;
        p.moveTo(-Ro, y0 + leg).lineTo(-Ro, y0);
        p.arc(0, y0, Ro, Math.PI, TAU);
        p.lineTo(Ro, y0 + leg);
        p.arc((Ro + Ri) / 2, y0 + leg, cap, 0, Math.PI);
        p.lineTo(Ri, y0);
        p.arc(0, y0, Ri, 0, Math.PI, true);
        p.lineTo(-Ri, y0 + leg);
        p.arc(-(Ro + Ri) / 2, y0 + leg, cap, 0, Math.PI);
        p.close();
      }),
    // The Dot keeps the arch's outline without the opening, so its face has room.
    dotPath: () =>
      pebbleFromPath((p) => {
        p.moveTo(-1, 0.08);
        p.arc(0, 0.08, 1, Math.PI, TAU);
        p.lineTo(1, 0.62);
        p.arc(0.7, 0.62, 0.3, 0, Math.PI / 2);
        p.lineTo(-0.7, 0.92);
        p.arc(-0.7, 0.62, 0.3, Math.PI / 2, Math.PI);
        p.close();
      }),
  },
  {
    id: "prism",
    name: "Prism",
    eyes: "tall",
    mouth: false,
    eye: { x: 0.43, y: 0.22, sep: 0.19, s: 0.9 },
    body: () => {
      const k = 0.98;
      const c = cubePts(k);
      return pebbleFromPath((p) =>
        roundedPoly(p, [c.top, c.ur, c.lr, c.bot, c.ll, c.ul], k * 0.2),
      );
    },
    faces: () => {
      const c = cubePts(0.98);
      return [
        { d: polyD([c.top, c.ur, c.c, c.ul]), tone: "light" },
        { d: polyD([c.ul, c.c, c.bot, c.ll]), tone: "shade" },
      ];
    },
  },
  {
    id: "bloom",
    name: "Bloom",
    eyes: "tall",
    mouth: true,
    eye: { y: 0.02, sep: 0.24, s: 0.88 },
    motion: "spin",
    body: () =>
      pebbleFromPts(
        polar(
          (th) =>
            0.7 + 0.31 * Math.pow(Math.abs(Math.cos(2.5 * th + 0.3)), 0.55),
        ),
      ),
  },
  {
    id: "cairn",
    name: "Cairn",
    eyes: "tall",
    mouth: true,
    eye: { y: -0.26, sep: 0.21, s: 0.8 },
    layers: [
      { cx: 0, cy: 0.4, rx: 1.0, ry: 0.52, mix: 1, lift: 0 },
      { cx: 0, cy: -0.24, rx: 0.72, ry: 0.44, mix: 1, lift: 0.12 },
    ],
    ball: { cx: 0, cy: -0.9, r: 0.22 },
    dot: () =>
      unionPts([
        [0, 0.4, 1.0, 0.52],
        [0, -0.24, 0.72, 0.44],
        [0, -0.9, 0.22, 0.22],
      ]),
  },
  {
    id: "burst",
    name: "Burst",
    eyes: "tall",
    mouth: false,
    eye: { y: 0.02, sep: 0.23, s: 0.85 },
    motion: "spin",
    body: () => {
      const pts = [];
      for (let i = 0; i < 20; i++) {
        const th = -Math.PI / 2 + (i * TAU) / 20;
        const r = i % 2 ? 0.74 : 1.02;
        pts.push([Math.cos(th) * r, Math.sin(th) * r]);
      }
      return pebbleFromPath((p) => roundedPoly(p, pts, 0.09));
    },
  },
  {
    id: "peak",
    name: "Peak",
    eyes: "tall",
    mouth: false,
    eye: { y: 0.26, sep: 0.22, s: 0.85 },
    body: () =>
      pebbleFromPath((p) =>
        roundedPoly(
          p,
          [
            [0, -1.0],
            [1.08, 0.82],
            [-1.08, 0.82],
          ],
          0.34,
        ),
      ),
  },
  {
    id: "stack",
    name: "Stack",
    eyes: "tall",
    mouth: false,
    eye: { y: -0.42, sep: 0.22, s: 0.8 },
    motion: "slide",
    layers: [0, 1, 2].map((i) => ({
      cx: 0,
      cy: 0.5 - i * 0.45,
      rx: 1.0 - i * 0.06,
      ry: 0.34,
      mix: i / 2,
      lift: 0,
    })),
    dot: () =>
      unionPts([0, 1, 2].map((i) => [0, 0.5 - i * 0.45, 1.0 - i * 0.06, 0.34])),
  },
  {
    id: "gem",
    name: "Gem",
    eyes: "tall",
    mouth: false,
    eye: { y: 0.02, sep: 0.2, s: 0.82 },
    body: () =>
      pebbleFromPath((p) =>
        roundedPoly(
          p,
          [
            [0, -1.08],
            [1.08, 0],
            [0, 1.08],
            [-1.08, 0],
          ],
          0.26,
        ),
      ),
    faces: () => [
      {
        d: polyD([
          [-1.1, 0],
          [0, -1.1],
          [1.1, 0],
        ]),
        tone: "facet-light",
      },
      {
        d: polyD([
          [0, -1.1],
          [1.1, 0],
          [0, 1.1],
        ]),
        tone: "facet-shade",
      },
    ],
  },
  {
    id: "sprout",
    name: "Sprout",
    eyes: "round",
    mouth: true,
    eye: { y: 0.1, sep: 0.25, s: 0.9 },
    body: () =>
      pebbleFromPts(
        unionPts([
          [0, 0.14, 0.98, 0.84],
          [-0.22, -0.74, 0.3, 0.3],
        ]),
      ),
  },
  {
    id: "nimbus",
    name: "Nimbus",
    eyes: "tall",
    mouth: true,
    eye: { y: 0.04, sep: 0.24, s: 0.9 },
    body: () =>
      pebbleFromPts(
        unionPts([
          [-0.52, 0.12, 0.46, 0.46],
          [0, -0.22, 0.6, 0.6],
          [0.52, 0.06, 0.5, 0.5],
          [0, 0.32, 0.96, 0.36],
        ]),
      ),
  },
  {
    id: "moonbox",
    name: "Moon box",
    eyes: "tall",
    mouth: false,
    eye: { x: 0.36, y: -0.15, sep: 0.15, s: 0.72 },
    ring: RING,
    body: () => {
      const k = 0.78;
      const c = cubePts(k);
      return pebbleFromPath((p) =>
        roundedPoly(p, [c.top, c.ur, c.lr, c.bot, c.ll, c.ul], k * 0.2),
      );
    },
    faces: () => {
      const c = cubePts(0.78);
      return [
        { d: polyD([c.top, c.ur, c.c, c.ul]), tone: "light" },
        { d: polyD([c.ul, c.c, c.bot, c.ll]), tone: "shade" },
      ];
    },
    dot: () => {
      const c = cubePts(0.78);
      const hex = [c.top, c.ur, c.lr, c.bot, c.ll, c.ul];
      return rayPts((x, y) => inPoly(hex, x, y) || ringBand(x, y));
    },
  },
  {
    id: "clover",
    name: "Clover",
    eyes: "round",
    mouth: false,
    eye: { y: 0, sep: 0.22, s: 0.85 },
    motion: "spin",
    body: () => {
      const comps = [[0, 0, 0.5, 0.5]];
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + (k * Math.PI) / 2;
        comps.push([Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0.5, 0.5]);
      }
      return pebbleFromPts(unionPts(comps));
    },
  },
  {
    id: "pillow",
    name: "Pillow",
    eyes: "round",
    mouth: true,
    eye: { y: 0.02, sep: 0.25, s: 0.95 },
    // A cushion: a squircle whose sides dip in, so its corners pinch out (never a team's square).
    body: () =>
      pebbleFromPts(
        polar((th) => {
          const c = Math.abs(Math.cos(th));
          const s = Math.abs(Math.sin(th));
          const sq = Math.pow(c ** 3 + s ** 3, -1 / 3);
          return 0.9 * sq * (1 - 0.24 * Math.cos(2 * th) ** 2);
        }),
      ),
  },
  {
    id: "drop",
    name: "Drop",
    eyes: "tall",
    mouth: false,
    eye: { y: 0.04, sep: 0.25, s: 1 },
    body: () =>
      pebbleFromPath((p) => {
        const a = 0.92;
        const big = 0.92;
        const tip = 0.16;
        p.moveTo(-a + big, -a);
        p.lineTo(a - tip, -a);
        p.arc(a - tip, -a + tip, tip, -Math.PI / 2, 0);
        p.lineTo(a, a - big);
        p.arc(a - big, a - big, big, 0, Math.PI / 2);
        p.arc(-a + big, a - big, big, Math.PI / 2, Math.PI);
        p.arc(-a + big, -a + big, big, Math.PI, Math.PI * 1.5);
        p.close();
      }),
  },
  {
    id: "bean",
    name: "Bean",
    eyes: "tall",
    mouth: true,
    eye: { x: 0.04, y: -0.08, sep: 0.24, s: 0.92 },
    body: () => {
      const rot = -0.42;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const p = new Path((x, y) => [
        CX + (x * c - y * s) * R,
        CY + (x * s + y * c) * R,
      ]);
      p.scale = R;
      p.moveTo(-0.66, -0.34);
      p.arc(0, -0.34, 0.66, Math.PI, TAU);
      p.lineTo(0.66, 0.34);
      p.arc(0, 0.34, 0.66, 0, Math.PI);
      p.close();
      return { d: p.svg, pts: p.pts };
    },
  },
  {
    id: "nut",
    name: "Nut",
    eyes: "round",
    mouth: false,
    eye: { y: 0.02, sep: 0.25, s: 0.95 },
    body: () => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const th = -Math.PI / 2 + (i * TAU) / 6;
        pts.push([Math.cos(th) * 1.05, Math.sin(th) * 1.05]);
      }
      return pebbleFromPath((p) => roundedPoly(p, pts, 0.3));
    },
  },
];
function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// ---------- palettes (the accent theme colours, accent-themes plan §2) ----------
// a = the light tone, b = the theme colour's dark-mode text value, deep = its light fill. Ink stands
// in for Black; Mist and Glass are the neutrals. `mark` is the cue colour on each theme;
// `companion` colours a cairn's top stone and a stack's lower layers.
const PALETTES = {
  blue: {
    name: "Blue",
    a: "#D3E3FD",
    b: "#5F9DF8",
    deep: "#0065DA",
    mark: ["#0065DA", "#5F9DF8"],
    companion: "teal",
  },
  violet: {
    name: "Violet",
    a: "#E2DAFE",
    b: "#A68CFA",
    deep: "#7A4ADC",
    mark: ["#7A4ADC", "#A68CFA"],
    companion: "blue",
  },
  pink: {
    name: "Pink",
    a: "#FADCE8",
    b: "#EC77A3",
    deep: "#C32470",
    mark: ["#C32470", "#EC77A3"],
    companion: "orange",
  },
  orange: {
    name: "Orange",
    a: "#F7DFD3",
    b: "#DD865F",
    deep: "#B14802",
    mark: ["#B14802", "#DD865F"],
    companion: "pink",
  },
  green: {
    name: "Green",
    a: "#D7EAD9",
    b: "#68AC77",
    deep: "#037936",
    mark: ["#037936", "#68AC77"],
    companion: "teal",
  },
  teal: {
    name: "Teal",
    a: "#D4EAE8",
    b: "#5EA9A4",
    deep: "#007671",
    mark: ["#007671", "#5EA9A4"],
    companion: "green",
  },
  ink: {
    name: "Ink",
    a: "#4A4A55",
    b: "#1C1C22",
    deep: "#09090C",
    mark: ["#7A4ADC", "#A68CFA"],
    companion: "violet",
    dark: true,
  },
  mist: {
    name: "Mist",
    a: "#F7F7FA",
    b: "#D3D3DC",
    deep: "#9A9AA8",
    mark: ["#7A4ADC", "#A68CFA"],
    companion: "orange",
  },
  glass: {
    name: "Glass",
    a: "#F6F5FA",
    b: "#DCE3F2",
    deep: "#9FA6C0",
    mark: ["#7A4ADC", "#A68CFA"],
    companion: "violet",
    glass: ["#FAB0D8", "#A6BEFC", "#96E2CE"],
  },
};

// ---------- the guard ----------
function metrics(pts) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const f = x1 * y2 - x2 * y1;
    area += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  area /= 2;
  cx /= 6 * area;
  cy /= 6 * area;
  const rmax = Math.max(...pts.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const bbox =
    (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
  return {
    circularity: Math.abs(area) / (Math.PI * rmax * rmax),
    squareness: Math.abs(area) / bbox,
  };
}
/** Fit sampled points into the Dot's 92-unit box, centred; returns the transform too. */
function fitDot(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const k = 92 / Math.max(w, h);
  const ox = (Math.max(...xs) + Math.min(...xs)) / 2;
  const oy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return {
    map: ([x, y]) => [50 + (x - ox) * k, 50 + (y - oy) * k],
    k,
    ox,
    oy,
  };
}

const failures = [];
const out = PRESETS.map((p) => {
  const body = p.layers ? null : p.body();
  let dotPts;
  let dotD;
  if (p.dotPath) {
    const d = p.dotPath();
    const f = fitDot(d.pts);
    // Refit by transforming the path's numbers: rebuild through the same builder with a mapped origin.
    dotPts = d.pts.map(f.map);
    dotD = mapPathD(d.d, f);
  } else {
    const src = p.dot ? toPebble(p.dot()) : body.pts;
    const f = fitDot(src);
    if (body && !p.dot) {
      dotPts = src.map(f.map);
      dotD = mapPathD(body.d, f);
    } else {
      dotPts = src.map(f.map);
      dotD = polyPath(dotPts);
    }
  }
  const m = metrics(dotPts);
  if (m.circularity > 0.93)
    failures.push(
      `${p.id}: its silhouette reads as a circle (${m.circularity.toFixed(3)})`,
    );
  if (m.squareness > 0.9)
    failures.push(
      `${p.id}: its silhouette reads as a rounded square (${m.squareness.toFixed(3)})`,
    );
  const def = {
    id: p.id,
    name: p.name,
    eyes: p.eyes,
    mouth: p.mouth,
    eye: { x: 0, y: -0.04, sep: 0.26, s: 1, ...(p.eye ?? {}) },
    ...(p.motion && { motion: p.motion }),
    pebble: {
      ...(body && { d: body.d }),
      ...(p.layers && {
        layers: p.layers.map((L) => ({
          d: ellipsePath(L.cx, L.cy, L.rx, L.ry),
          cx: +fmt(CX + L.cx * R),
          cy: +fmt(CY + L.cy * R),
          rx: +fmt(L.rx * R),
          ry: +fmt(L.ry * R),
          mix: L.mix,
          lift: L.lift,
        })),
      }),
      ...(p.ring && {
        ring: {
          rx: +fmt(p.ring.rx * R),
          ry: +fmt(p.ring.ry * R),
          tilt: +fmt((p.ring.tilt * 180) / Math.PI),
        },
      }),
      ...(p.ball && {
        ball: {
          cx: +fmt(CX + p.ball.cx * R),
          cy: +fmt(CY + p.ball.cy * R),
          r: +fmt(p.ball.r * R),
        },
      }),
      ...(p.faces && { faces: p.faces() }),
    },
    dot: { d: dotD },
    _metrics: m,
  };
  return def;
});

/** Re-map every coordinate pair of an absolute M/L/A/Z path through a Dot fit. */
function mapPathD(d, f) {
  const tokens = d.match(/[MLAZ]|-?\d*\.?\d+/g);
  const res = [];
  for (let i = 0; i < tokens.length;) {
    const t = tokens[i++];
    if (t === "M" || t === "L") {
      const [x, y] = f.map([+tokens[i++], +tokens[i++]]);
      res.push(`${t}${fmt(x)} ${fmt(y)}`);
    } else if (t === "A") {
      const rx = +tokens[i++] * f.k;
      const ry = +tokens[i++] * f.k;
      const rot = tokens[i++];
      const large = tokens[i++];
      const sweep = tokens[i++];
      const [x, y] = f.map([+tokens[i++], +tokens[i++]]);
      res.push(
        `A${fmt(rx)} ${fmt(ry)} ${rot} ${large} ${sweep} ${fmt(x)} ${fmt(y)}`,
      );
    } else if (t === "Z") res.push("Z");
  }
  return res.join("");
}

if (failures.length) {
  console.error(
    "✗ agent-face-spec: a preset breaks the identity shapes:\n  " +
      failures.join("\n  "),
  );
  process.exit(1);
}

const presets = out.map(({ _metrics, ...d }) => d);
const ts = `// AUTO-GENERATED by tooling/agent-face-spec.mjs — do not edit. Run \`pnpm gen\`.
/**
 * The agent face catalogue: 18 preset characters (shape, eyes, mouth) drawn in a 100 × 100 box.
 * A Pebble body sits at radius 35 around (50, 49); a Dot silhouette fills 92 units, centred.
 */

/** A preset character's id. */
export type FacePreset = ${presets.map((p) => JSON.stringify(p.id)).join(" | ")};
/** A face palette: the six accent theme colours plus Ink, Mist and Glass. */
export type FacePalette = ${Object.keys(PALETTES)
  .map((k) => JSON.stringify(k))
  .join(" | ")};

export interface FacePresetDef {
  id: FacePreset;
  name: string;
  eyes: "tall" | "round";
  mouth: boolean;
  /** Eye placement in body radii from the body centre: \`sep\` is half the gap, \`s\` the size. */
  eye: { x: number; y: number; sep: number; s: number };
  /** The shape's own move while it works. */
  motion?: "spin" | "rock" | "slide";
  pebble: {
    d?: string;
    layers?: { d: string; cx: number; cy: number; rx: number; ry: number; mix: number; lift: number }[];
    ring?: { rx: number; ry: number; tilt: number };
    ball?: { cx: number; cy: number; r: number };
    faces?: { d: string; tone: "light" | "shade" | "facet-light" | "facet-shade" }[];
  };
  dot: { d: string };
}

export const FACE_PRESETS: readonly FacePresetDef[] = ${JSON.stringify(presets, null, 2)};

/** Every preset id, in catalogue order. */
export const FACE_PRESET_IDS = FACE_PRESETS.map((p) => p.id) as readonly FacePreset[];

/** Every palette, in picker order, with its name and companion (a cairn's stone, a stack's lower layers). */
export const FACE_PALETTES: readonly { id: FacePalette; name: string; companion: FacePalette; dark?: true; glass?: true }[] = ${JSON.stringify(
  Object.entries(PALETTES).map(([id, p]) => ({
    id,
    name: p.name,
    companion: p.companion,
    ...(p.dark && { dark: true }),
    ...(p.glass && { glass: true }),
  })),
  null,
  2,
)};

/** Every palette id, in picker order. */
export const FACE_PALETTE_IDS = FACE_PALETTES.map((p) => p.id) as readonly FacePalette[];

/** A preset's definition by id. */
export function facePreset(id: FacePreset): FacePresetDef {
  return FACE_PRESETS.find((p) => p.id === id) ?? FACE_PRESETS[0]!;
}
`;
const json =
  JSON.stringify(
    {
      $comment:
        "AUTO-GENERATED by vegastack-design tooling/agent-face-spec.mjs. The phone app copies this file.",
      version: 1,
      box: 100,
      pebble: { cx: CX, cy: CY, r: R },
      presets,
      palettes: Object.fromEntries(
        Object.entries(PALETTES).map(([id, p]) => [
          id,
          {
            name: p.name,
            a: p.a,
            b: p.b,
            deep: p.deep,
            mark: { light: p.mark[0], dark: p.mark[1] },
            ink: p.dark ? "#FFFFFF" : "#231D38",
            companion: p.companion,
            ...(p.dark && { dark: true }),
            ...(p.glass && { glass: p.glass }),
          },
        ]),
      ),
    },
    null,
    2,
  ) + "\n";

export const FACE_PALETTE_HEX = PALETTES;

const targets = [
  ["packages/ui/registry/lib/agent-face-spec.ts", ts],
  ["apps/docs/public/agent-face-spec.json", json],
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const prettier = await import("prettier");
  let stale = false;
  for (const [rel, raw] of targets) {
    const file = root + rel;
    const content = await prettier.format(raw, {
      ...((await prettier.resolveConfig(file)) ?? {}),
      filepath: file,
    });
    let prev = "";
    try {
      prev = readFileSync(file, "utf8");
    } catch {}
    if (prev === content) continue;
    if (check) {
      console.error(`✗ agent-face-spec: ${rel} is stale; run \`pnpm gen\``);
      stale = true;
    } else writeFileSync(file, content);
  }
  if (stale) process.exit(1);
  console.log(
    `✓ agent-face-spec: ${presets.length} presets, ${Object.keys(PALETTES).length} palettes` +
      (process.argv.includes("--metrics")
        ? "\n" +
          out
            .map(
              (o) =>
                `  ${o.id.padEnd(8)} circle ${o._metrics.circularity.toFixed(3)} square ${o._metrics.squareness.toFixed(3)}`,
            )
            .join("\n")
        : ""),
  );
}
