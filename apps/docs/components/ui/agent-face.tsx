// @vegastack agent-face@0.136.4 sha256-px8ChfgcSpsbAM+dt2TYOEAn4hyY43r0phu4VyKm1pY=

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  facePreset,
  FACE_PALETTES,
  type FacePalette,
  type FacePreset,
  type FacePresetDef,
} from "@/lib/agent-face-spec";

/**
 * What an agent is doing, as its face shows it. `idle` ready · `thinking` working out a plan ·
 * `working` using a tool · `writing` the answer is arriving · `needs-you` waiting on a person ·
 * `replied` finished with something new to read · `failed` stuck · `scheduled` asleep until its
 * next run · `paused` turned off.
 */
export type FaceState =
  | "idle"
  | "thinking"
  | "working"
  | "writing"
  | "needs-you"
  | "replied"
  | "failed"
  | "scheduled"
  | "paused";

/** An agent's face: a preset character in a palette. Stored with the agent. */
export interface AgentFaceSpec {
  v: 1;
  preset: FacePreset;
  palette: FacePalette;
}

/** Props accepted by `AgentFace`. */
export interface AgentFaceProps extends Omit<
  React.ComponentProps<"svg">,
  "children" | "ref"
> {
  /** The agent's face. */
  face: AgentFaceSpec;
  /** What it is doing. @default "idle" */
  state?: FaceState;
  /** Its size in CSS pixels. Below 40 it draws the Dot; from 40 the Pebble. */
  size: number;
  /**
   * Whether it moves. Pass `true` only where the person is looking at that agent (its chat, its
   * page header, its hover card, quick ask); everywhere else the still pose still shows the state.
   * Reduced motion always gets the still pose. @default false
   */
  motion?: boolean;
  /**
   * The colour of the surface beneath, for the cut-out behind a cue or badge and the halo in a
   * stack. @default "var(--background)"
   */
  ring?: string;
  /**
   * A 2px halo in this colour round the Dot's own silhouette, for an overlapping stack (pass the
   * surface colour). @default undefined
   */
  halo?: string;
  /**
   * What a screen reader hears, such as "Scout, agent, thinking". Pass `""` when the words beside
   * it say it (the face is then hidden from assistive technology).
   * @default undefined
   */
  label?: string;
}

/** The short word for each state, as a label or badge writes it. */
export const FACE_STATE_LABELS: Record<FaceState, string> = {
  idle: "Ready",
  thinking: "Thinking",
  working: "Working",
  writing: "Writing",
  "needs-you": "Needs you",
  replied: "Replied",
  failed: "Couldn't finish",
  scheduled: "Scheduled",
  paused: "Paused",
};

const R = 35;
const CX = 50;
const CY = 49;
/** The cue slot: on the head's top-right shoulder, cut out of it by a ring, so it reads as part of the face. */
const MX = CX + R * 0.8;
const MY = CY - R * 0.82;
/**
 * The Pebble's frame: an 80-unit window round the body, so the body fills about 88% of the box,
 * as a person's circle does at the same size step (no container: the face is the avatar). The
 * floating shadow, a ring's ends and a cue may reach past it (`overflow-visible`).
 */
const PEBBLE_BOX = "10 9 80 80";
const PEBBLE_ZOOM = 100 / 80;
const BODY_ORIGIN = { transformOrigin: `${CX}px ${CY + R}px` } as const;
const n2 = (v: number) => Math.round(v * 100) / 100;

const paletteOf = (id: FacePalette) =>
  FACE_PALETTES.find((p) => p.id === id) ?? FACE_PALETTES[0]!;

/** The palette as CSS custom properties, faded toward grey when the agent can't act. */
function paletteVars(
  id: FacePalette,
  state: FaceState,
  seed: number,
): React.CSSProperties {
  const pal = paletteOf(id);
  const comp = paletteOf(pal.companion);
  const k =
    state === "paused"
      ? 0.86
      : state === "failed"
        ? 0.5
        : state === "scheduled"
          ? 0.35
          : 0;
  const grey = (key: "a" | "b" | "deep") =>
    pal.dark ? `var(--face-grey-ink-${key})` : `var(--face-grey-${key})`;
  const inkK = pal.dark
    ? state === "paused"
      ? 1
      : state === "failed"
        ? 0.45
        : 0
    : k;
  const tone = (palId: FacePalette, key: "a" | "b" | "deep") => {
    const base = `var(--face-${palId}-${key})`;
    const kk = palId === id ? inkK : k;
    return kk
      ? `color-mix(in oklab, ${base}, ${grey(key)} ${n2(kk * 100)}%)`
      : base;
  };
  const markK = state === "paused" || state === "failed" ? k : 0;
  return {
    "--fa": tone(id, "a"),
    "--fb": tone(id, "b"),
    "--fd": tone(id, "deep"),
    "--fm": markK
      ? `color-mix(in oklab, var(--face-${id}-mark), var(--face-grey-b) ${n2(markK * 100)}%)`
      : `var(--face-${id}-mark)`,
    "--fi": `var(--face-${id}-ink)`,
    "--ca": tone(comp.id, "a"),
    "--cb": tone(comp.id, "b"),
    "--cd": tone(comp.id, "deep"),
    "--face-seed": seed,
  } as React.CSSProperties;
}

/** A stable small number per preset, so blinks and glances don't march in step down a list. */
const seedOf = (face: AgentFaceSpec) =>
  ([...face.preset].reduce((s, c) => s + c.charCodeAt(0), 0) +
    face.palette.length) %
  5;

function roundRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rt: number,
  rb: number,
) {
  rt = Math.min(rt, w / 2, h / 2);
  rb = Math.min(rb, w / 2, h / 2);
  return `M${n2(x + rt)} ${n2(y)}H${n2(x + w - rt)}A${n2(rt)} ${n2(rt)} 0 0 1 ${n2(x + w)} ${n2(y + rt)}V${n2(y + h - rb)}A${n2(rb)} ${n2(rb)} 0 0 1 ${n2(x + w - rb)} ${n2(y + h)}H${n2(x + rb)}A${n2(rb)} ${n2(rb)} 0 0 1 ${n2(x)} ${n2(y + h - rb)}V${n2(y + rt)}A${n2(rt)} ${n2(rt)} 0 0 1 ${n2(x + rt)} ${n2(y)}Z`;
}
const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) =>
  `M${n2(cx + Math.cos(a0) * r)} ${n2(cy + Math.sin(a0) * r)}A${n2(r)} ${n2(r)} 0 0 1 ${n2(cx + Math.cos(a1) * r)} ${n2(cy + Math.sin(a1) * r)}`;
const sparklePath = (x: number, y: number, s: number) =>
  `M${n2(x)} ${n2(y - s)}Q${n2(x)} ${n2(y)} ${n2(x + s)} ${n2(y)}Q${n2(x)} ${n2(y)} ${n2(x)} ${n2(y + s)}Q${n2(x)} ${n2(y)} ${n2(x - s)} ${n2(y)}Q${n2(x)} ${n2(y)} ${n2(x)} ${n2(y - s)}Z`;

// ---------- the face: eyes, brows, mouth ----------
interface FaceGeometry {
  def: FacePresetDef;
  state: FaceState;
  size: number;
  motion: boolean;
  dark: boolean;
  /** The top layer's sideways offset (stacks slide), in units. */
  dx?: number;
}

/**
 * The expression grammar: thinking looks up toward its cue; working narrows and scans; writing
 * looks down along the line and talks; needs-you looks straight at the person with raised brows;
 * replied smiles with its eyes; failed worries; scheduled sleeps; paused is a flat line.
 */
function Face({ def, state, size, motion, dark, dx = 0 }: FaceGeometry) {
  const E = def.eye;
  const round = def.eyes === "round";
  let ew = R * (round ? 0.19 : 0.15) * E.s;
  let eh = R * (round ? 0.2 : 0.3) * E.s;
  let lx = 0;
  let ly = 0;
  let lid = 0;
  let open = 1;
  let kind: "open" | "happy" | "closed" | "line" = "open";
  let brows: "up" | "worry" | null = null;
  let shine = true;
  switch (state) {
    case "thinking":
      lx = 0.08;
      ly = -0.13;
      lid = 0.18;
      break;
    case "working":
      lx = 0.02;
      ly = 0.03;
      lid = 0.36;
      ew *= 1.15;
      shine = false;
      break;
    case "writing":
      ly = 0.12;
      lid = 0.26;
      ew *= 1.08;
      shine = false;
      break;
    case "needs-you":
      ew *= 1.08;
      eh *= 1.12;
      brows = "up";
      break;
    case "replied":
      kind = "happy";
      break;
    case "failed":
      open = 0.62;
      ly = 0.06;
      brows = "worry";
      shine = false;
      break;
    case "scheduled":
      kind = "closed";
      break;
    case "paused":
      kind = "line";
      break;
  }
  const lw = Math.max((1.1 * 100) / size, R * 0.062 * E.s);
  const cx = (E.x + lx) * R + CX + dx;
  const cy = (E.y + ly) * R + CY;
  const sep = E.sep * R;
  const eyesOrigin = { transformOrigin: `${n2(cx)}px ${n2(cy)}px` };
  const eyeMotion = motion
    ? state === "idle"
      ? "motion-face-glance"
      : state === "thinking"
        ? "motion-face-drift"
        : state === "working"
          ? "motion-face-scan"
          : state === "writing"
            ? "motion-face-read"
            : undefined
    : undefined;
  const blinks =
    motion &&
    kind === "open" &&
    (state === "idle" ||
      state === "thinking" ||
      state === "needs-you" ||
      state === "writing");

  const eyes = [-1, 1].map((sx) => {
    const ex = cx + sx * sep;
    if (kind === "open") {
      const full = Math.max(eh * open, lw);
      const h = Math.max(full * (1 - lid), lw);
      const top = cy - full / 2 + (full - h);
      const rr = Math.min(ew, h) / 2;
      return (
        <g key={sx}>
          <path
            d={roundRectPath(
              ex - ew / 2,
              top,
              ew,
              h,
              lid > 0.05 ? rr * 0.35 : rr,
              rr,
            )}
          />
          {shine && size >= 48 && open > 0.6 && !dark ? (
            <circle
              cx={n2(ex - ew * 0.14)}
              cy={n2(top + h * 0.26)}
              r={n2(ew * 0.2)}
              fill="var(--face-highlight)"
              fillOpacity={0.88}
            />
          ) : null}
        </g>
      );
    }
    if (kind === "happy")
      return (
        <path
          key={sx}
          d={arcPath(
            ex,
            cy + eh * 0.25,
            ew * 0.88,
            Math.PI * 1.15,
            Math.PI * 1.85,
          )}
          fill="none"
          stroke="var(--fi)"
          strokeWidth={n2(lw * 1.15)}
        />
      );
    if (kind === "closed")
      return (
        <path
          key={sx}
          d={arcPath(
            ex,
            cy - eh * 0.15,
            ew * 0.8,
            Math.PI * 0.15,
            Math.PI * 0.85,
          )}
          fill="none"
          stroke="var(--fi)"
          strokeWidth={n2(lw)}
        />
      );
    return (
      <path
        key={sx}
        d={`M${n2(ex - ew * 0.55)} ${n2(cy)}H${n2(ex + ew * 0.55)}`}
        fill="none"
        stroke="var(--fi)"
        strokeWidth={n2(lw)}
      />
    );
  });

  const browPaths =
    brows && size >= 40
      ? [-1, 1].map((sx) => {
          const ex = cx + sx * sep;
          const d =
            brows === "worry"
              ? `M${n2(ex + sx * ew * 1.0)} ${n2(cy - eh * 0.72)}L${n2(ex - sx * ew * 0.7)} ${n2(cy - eh * 0.98)}`
              : arcPath(
                  ex,
                  cy - eh * 0.5 - R * 0.12 * E.s + ew * 0.9,
                  ew * 0.95,
                  Math.PI * 1.28,
                  Math.PI * 1.72,
                );
          return <path key={sx} d={d} />;
        })
      : null;

  // The mouth sits under the eyes' centre, sized so it never reads as a nose.
  const my = cy + eh * 0.62 + R * 0.12 * E.s;
  const mw = R * 0.075 * E.s;
  let mouth: React.ReactNode = null;
  if (state === "writing")
    mouth = (
      <path
        d={roundRectPath(
          cx - mw,
          my - R * 0.012,
          mw * 2,
          R * 0.09 * E.s,
          R * 0.045 * E.s,
          R * 0.045 * E.s,
        )}
        stroke="none"
        fill="var(--fi)"
        className={motion ? "motion-face-mouth" : undefined}
        style={{ transformOrigin: `${n2(cx)}px ${n2(my - R * 0.012)}px` }}
      />
    );
  else if (state === "thinking")
    mouth = (
      <path
        d={`M${n2(cx + mw * 0.1)} ${n2(my + 0.2)}L${n2(cx + mw * 1.25)} ${n2(my - R * 0.02 * E.s)}`}
      />
    );
  else if (state === "working")
    mouth = <path d={`M${n2(cx - mw * 0.6)} ${n2(my)}H${n2(cx + mw * 0.6)}`} />;
  else if (state === "needs-you")
    mouth = (
      <path
        d={arcPath(
          cx,
          my - R * 0.035 * E.s,
          mw * 0.95,
          Math.PI * 0.2,
          Math.PI * 0.8,
        )}
      />
    );
  else if (state === "failed")
    mouth = (
      <path
        d={arcPath(
          cx,
          my + R * 0.075 * E.s,
          mw,
          Math.PI * 1.22,
          Math.PI * 1.78,
        )}
      />
    );
  else if (
    (def.mouth || state === "replied") &&
    (kind === "open" || kind === "happy")
  )
    mouth = (
      <path
        d={arcPath(
          cx,
          my - R * 0.04 * E.s,
          mw * (state === "replied" ? 1.35 : 0.95),
          Math.PI * 0.18,
          Math.PI * 0.82,
        )}
      />
    );

  return (
    <g
      data-slot="agent-face-features"
      fill="var(--fi)"
      stroke="var(--fi)"
      strokeWidth={n2(lw)}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={state === "paused" ? 0.6 : undefined}
    >
      <g className={eyeMotion} style={eyesOrigin}>
        <g
          className={cn(motion && "motion-face-change-eyes")}
          style={eyesOrigin}
        >
          <g
            className={blinks ? "motion-face-blink" : undefined}
            style={eyesOrigin}
            stroke="none"
          >
            {eyes}
          </g>
        </g>
      </g>
      {browPaths ? (
        <g fill="none" strokeWidth={n2(lw * 0.85)}>
          {browPaths}
        </g>
      ) : null}
      {mouth ? <g fill="none">{mouth}</g> : null}
    </g>
  );
}

// ---------- the soft material ----------
interface ShadeProps {
  id: string;
  d: string;
  state: FaceState;
  motion: boolean;
  pal: (typeof FACE_PALETTES)[number];
  /** Fill stops; defaults to the palette (`--fa`, `--fb`, `--fd`). */
  a?: string;
  b?: string;
  deep?: string;
  /** Centre and radius of this part, for the light and vignette. */
  cx?: number;
  cy?: number;
  r?: number;
  rim?: number;
  /** Drawn inside the clip, under the light (a prism's faces, a gem's facets). */
  inner?: React.ReactNode;
  /** The state's moving light inside (only the main body draws it). */
  effects?: boolean;
  light?: number;
}

function Shade({
  id,
  d,
  state,
  motion,
  pal,
  a = "var(--fa)",
  b = "var(--fb)",
  deep = "var(--fd)",
  cx = CX,
  cy = CY,
  r = R,
  rim = 1,
  inner,
  effects = true,
  light = 1,
}: ShadeProps) {
  const dark = !!pal.dark;
  const glass = !!pal.glass;
  const neutral = glass || pal.id === "mist";
  const hiAlpha =
    light * (dark ? 0.2 : glass ? 0.7 : state === "replied" ? 0.72 : 0.58);
  const speed =
    state === "working"
      ? "4.5s"
      : state === "thinking"
        ? "7s"
        : state === "idle" || state === "replied"
          ? "12s"
          : "20s";
  const glowColor = dark
    ? "var(--fm)"
    : neutral
      ? "var(--fm)"
      : "var(--face-highlight)";
  const glowAlpha = dark ? 0.75 : neutral ? 0.32 : 0.75;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
        <linearGradient
          id={`${id}-g`}
          gradientUnits="userSpaceOnUse"
          x1={n2(cx - r * 0.8)}
          y1={n2(cy - r)}
          x2={n2(cx + r * 0.8)}
          y2={n2(cy + r)}
        >
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        {glass ? (
          <linearGradient
            id={`${id}-i`}
            gradientUnits="userSpaceOnUse"
            x1={n2(cx - r)}
            y1={n2(cy - r * 1.6)}
            x2={n2(cx + r)}
            y2={n2(cy + r * 1.6)}
          >
            <stop offset="0" stopColor="var(--face-glass-1)" />
            <stop offset="0.5" stopColor="var(--face-glass-2)" />
            <stop offset="1" stopColor="var(--face-glass-3)" />
          </linearGradient>
        ) : null}
        <radialGradient id={`${id}-h`}>
          <stop
            offset="0"
            stopColor="var(--face-highlight)"
            stopOpacity={n2(hiAlpha)}
          />
          <stop offset="1" stopColor="var(--face-highlight)" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${id}-v`}
          gradientUnits="userSpaceOnUse"
          cx={n2(cx - r * 0.15)}
          cy={n2(cy - r * 0.25)}
          r={n2(r * 1.4)}
        >
          <stop offset="0.32" stopColor={deep} stopOpacity="0" />
          <stop
            offset="1"
            stopColor={deep}
            stopOpacity={glass ? 0.18 : dark ? 0.6 : 0.42}
          />
        </radialGradient>
        {effects && state === "thinking" ? (
          <radialGradient id={`${id}-t`}>
            <stop offset="0" stopColor={glowColor} stopOpacity={glowAlpha} />
            <stop offset="1" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        ) : null}
        {effects && state === "working" ? (
          <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={glowColor} stopOpacity="0" />
            <stop
              offset="0.5"
              stopColor={glowColor}
              stopOpacity={dark ? 0.45 : neutral ? 0.22 : 0.5}
            />
            <stop offset="1" stopColor={glowColor} stopOpacity="0" />
          </linearGradient>
        ) : null}
        {effects && state === "needs-you" ? (
          <radialGradient id={`${id}-w`}>
            <stop offset="0" stopColor="var(--warning)" stopOpacity="0.4" />
            <stop offset="1" stopColor="var(--warning)" stopOpacity="0" />
          </radialGradient>
        ) : null}
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {glass ? (
          <>
            <rect
              x="-50"
              y="-50"
              width="200"
              height="200"
              fill="var(--face-highlight)"
              fillOpacity={0.5}
            />
            <rect
              x="-50"
              y="-50"
              width="200"
              height="200"
              fill={`url(#${id}-i)`}
              opacity={state === "paused" || state === "failed" ? 0.35 : 1}
            />
          </>
        ) : (
          <rect
            x="-50"
            y="-50"
            width="200"
            height="200"
            fill={`url(#${id}-g)`}
          />
        )}
        {inner}
        {state !== "paused" ? (
          <ellipse
            cx={n2(cx - r * 0.36)}
            cy={n2(cy - r * 0.46)}
            rx={n2(r * (state === "replied" ? 1.15 : 1))}
            ry={n2(r * (state === "replied" ? 1.15 : 1))}
            fill={`url(#${id}-h)`}
            className={motion ? "motion-face-light" : undefined}
            style={{ ["--face-light-speed" as string]: speed }}
          />
        ) : null}
        <rect x="-50" y="-50" width="200" height="200" fill={`url(#${id}-v)`} />
        {effects && state === "thinking" ? (
          <g
            style={{
              transformOrigin: `${n2(cx)}px ${n2(cy - r * 0.04)}px`,
              transform: "scaleY(0.71)",
            }}
          >
            <g
              className={motion ? "motion-face-orbit" : undefined}
              style={{ transformOrigin: `${n2(cx)}px ${n2(cy - r * 0.04)}px` }}
            >
              <circle
                cx={n2(cx + r * 0.45)}
                cy={n2(cy - r * 0.04)}
                r={n2(r * 0.55)}
                fill={`url(#${id}-t)`}
              />
            </g>
          </g>
        ) : null}
        {effects && state === "working" ? (
          <rect
            x={n2(cx - r * 2.5)}
            y={n2(cy - r * 1.6)}
            width={n2(r * 0.9)}
            height={n2(r * 3.2)}
            fill={`url(#${id}-s)`}
            transform={`rotate(24 ${n2(cx)} ${n2(cy)})`}
            className={motion ? "motion-face-sheen" : undefined}
            opacity={motion ? 1 : 0}
          />
        ) : null}
        {effects && state === "writing" && motion ? (
          <rect
            x="-50"
            y="-50"
            width="200"
            height="200"
            fill="var(--face-highlight)"
            opacity={0}
            className="motion-face-flash"
          />
        ) : null}
        {effects && state === "needs-you" ? (
          <circle
            cx={n2(cx + r * 0.55)}
            cy={n2(cy - r * 0.55)}
            r={n2(r * 0.95)}
            fill={`url(#${id}-w)`}
            className={motion ? "motion-face-warm" : undefined}
          />
        ) : null}
        {state === "scheduled" ? (
          <rect
            x="-50"
            y="-50"
            width="200"
            height="200"
            fill={deep}
            fillOpacity={0.12}
          />
        ) : null}
      </g>
      <path
        d={d}
        fill="none"
        clipPath={`url(#${id}-c)`}
        strokeWidth={n2(r * (glass ? 0.16 : 0.12))}
        stroke={
          glass
            ? "var(--face-highlight)"
            : dark
              ? "var(--fm)"
              : "var(--face-highlight)"
        }
        strokeOpacity={n2((glass ? 0.6 : dark ? 0.32 : 0.26) * rim)}
      />
    </g>
  );
}

// ---------- the ring (Orbit, Moon box) ----------
function Ring({
  part,
  ring,
  state,
  motion,
  id,
}: {
  part: "back" | "front";
  ring: NonNullable<FacePresetDef["pebble"]["ring"]>;
  state: FaceState;
  motion: boolean;
  id: string;
}) {
  const { rx, ry, tilt } = ring;
  const grey = state === "paused" || state === "failed";
  const d =
    part === "back"
      ? `M${n2(CX - rx)} ${CY}A${rx} ${ry} 0 0 1 ${n2(CX + rx)} ${CY}`
      : `M${n2(CX + rx)} ${CY}A${rx} ${ry} 0 0 1 ${n2(CX - rx)} ${CY}`;
  const orbit = `path("M${n2(CX + rx)} ${CY}A${rx} ${ry} 0 1 1 ${n2(CX - rx)} ${CY}A${rx} ${ry} 0 1 1 ${n2(CX + rx)} ${CY}")`;
  const moving = state === "working" || state === "thinking";
  return (
    <g transform={`rotate(${tilt} ${CX} ${CY})`}>
      {part === "back" ? (
        <defs>
          <linearGradient
            id={`${id}-r`}
            gradientUnits="userSpaceOnUse"
            x1={n2(CX - rx)}
            y1="0"
            x2={n2(CX + rx)}
            y2="0"
          >
            <stop
              offset="0"
              stopColor={grey ? "var(--face-grey-b)" : "var(--face-ring-a)"}
            />
            <stop
              offset="1"
              stopColor={grey ? "var(--face-grey-deep)" : "var(--face-ring-b)"}
            />
          </linearGradient>
          <radialGradient id={`${id}-m`} cx="0.4" cy="0.4">
            <stop offset="0" stopColor="var(--face-highlight)" />
            <stop offset="1" stopColor="var(--fm)" />
          </radialGradient>
        </defs>
      ) : null}
      <path
        d={d}
        fill="none"
        stroke={`url(#${id}-r)`}
        strokeWidth={n2(R * 0.085)}
        strokeLinecap="round"
      />
      {moving && motion ? (
        <circle
          r={n2(R * 0.1)}
          fill={`url(#${id}-m)`}
          className="motion-face-moon"
          style={
            {
              offsetPath: orbit,
              offsetRotate: "0deg",
              "--face-orbit-speed": state === "working" ? "2.6s" : "6.3s",
              "--face-moon-a": part === "front" ? 1 : 0,
              "--face-moon-b": part === "front" ? 0 : 1,
            } as React.CSSProperties
          }
        />
      ) : null}
    </g>
  );
}

// ---------- the cue slot ----------
function Cue({
  state,
  ring,
  motion,
}: {
  state: FaceState;
  ring: string;
  motion: boolean;
}) {
  const hw = R * 0.07;
  const mc = "var(--fm)";
  switch (state) {
    case "thinking": {
      // Thought bubbles in the agent's colour, rising off its head and pulsing in turn (operator,
      // 27-11-2026: the spinner didn't suit a character; keep the cues close to the face).
      const bubbles: [number, number, number][] = [
        [-0.2, 0.2, 0.06],
        [-0.02, 0.02, 0.095],
        [0.2, -0.2, 0.14],
      ];
      return (
        <g data-slot="agent-face-cue" data-cue="bubbles">
          {bubbles.map(([dx, dy, r], k) => (
            <circle
              key={`h${k}`}
              cx={n2(MX + dx * R)}
              cy={n2(MY + dy * R)}
              r={n2(R * r + hw * 0.6)}
              fill={ring}
            />
          ))}
          {bubbles.map(([dx, dy, r], k) => (
            <circle
              key={k}
              cx={n2(MX + dx * R)}
              cy={n2(MY + dy * R)}
              r={n2(R * r)}
              fill={mc}
              fillOpacity={0.55 + k * 0.2}
              className={motion ? "motion-face-float" : undefined}
              style={{
                transformOrigin: `${n2(MX + dx * R)}px ${n2(MY + dy * R)}px`,
                ["--face-dot" as string]: k,
              }}
            />
          ))}
        </g>
      );
    }
    case "working":
      // Orbiting dots in the agent's colour, the same for every tool.
      return (
        <g data-slot="agent-face-cue" data-cue="orbit">
          <circle cx={MX} cy={MY} r={n2(R * 0.33)} fill={ring} />
          <g
            className={motion ? "motion-face-orbit" : undefined}
            style={
              {
                transformOrigin: `${n2(MX)}px ${n2(MY)}px`,
                "--face-orbit-speed": "1.2s",
              } as React.CSSProperties
            }
          >
            {[0, 1, 2].map((k) => {
              const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
              return (
                <circle
                  key={k}
                  cx={n2(MX + Math.cos(a) * R * 0.19)}
                  cy={n2(MY + Math.sin(a) * R * 0.19)}
                  r={n2(R * (0.075 - k * 0.015))}
                  fill={mc}
                  fillOpacity={1 - k * 0.25}
                />
              );
            })}
          </g>
        </g>
      );
    case "writing": {
      const w = R * 0.86;
      const h = R * 0.42;
      return (
        <g data-slot="agent-face-cue" data-cue="typing">
          <rect
            x={n2(MX - w / 2 - hw * 0.6)}
            y={n2(MY - h / 2 - hw * 0.6)}
            width={n2(w + hw * 1.2)}
            height={n2(h + hw * 1.2)}
            rx={n2(h / 2 + hw * 0.6)}
            fill={ring}
          />
          <rect
            x={n2(MX - w / 2)}
            y={n2(MY - h / 2)}
            width={n2(w)}
            height={n2(h)}
            rx={n2(h / 2)}
            fill={mc}
            fillOpacity={0.16}
          />
          {[0, 1, 2].map((k) => (
            <circle
              key={k}
              cx={n2(MX + (k - 1) * w * 0.27)}
              cy={MY}
              r={n2(h * 0.15)}
              fill={mc}
              className={motion ? "motion-face-type" : undefined}
              style={{ ["--face-dot" as string]: k }}
            />
          ))}
        </g>
      );
    }
    case "needs-you": {
      const segs: [number, number, number, number][] = [
        [-0.12, 0.08, -0.03, -0.18],
        [0.06, 0.16, 0.28, 0.02],
        [0.1, 0.32, 0.3, 0.32],
      ];
      const d = segs
        .map(
          ([x1, y1, x2, y2]) =>
            `M${n2(MX + x1 * R)} ${n2(MY + y1 * R)}L${n2(MX + x2 * R)} ${n2(MY + y2 * R)}`,
        )
        .join("");
      return (
        <g
          data-slot="agent-face-cue"
          data-cue="ticks"
          className={motion ? "motion-face-flare" : undefined}
          style={{
            transformOrigin: `${n2(MX - R * 0.1)}px ${n2(MY + R * 0.2)}px`,
          }}
          fill="none"
          strokeLinecap="round"
        >
          <path d={d} stroke={ring} strokeWidth={n2(R * 0.085 + hw * 1.2)} />
          <path d={d} stroke="var(--warning)" strokeWidth={n2(R * 0.085)} />
        </g>
      );
    }
    case "replied": {
      const s = R * 0.2;
      return (
        <g data-slot="agent-face-cue" data-cue="sparkle">
          <path d={sparklePath(MX, MY, s + hw)} fill={ring} />
          <path
            d={sparklePath(MX, MY, s)}
            fill={mc}
            className={motion ? "motion-face-twinkle" : undefined}
            style={{ transformOrigin: `${n2(MX)}px ${n2(MY)}px` }}
          />
          <path
            d={sparklePath(MX + R * 0.25, MY + R * 0.24, s * 0.42)}
            fill={mc}
            fillOpacity={0.7}
            className={motion ? "motion-face-twinkle" : undefined}
            style={{
              transformOrigin: `${n2(MX + R * 0.25)}px ${n2(MY + R * 0.24)}px`,
              ["--face-dot" as string]: 1,
            }}
          />
          <path
            d={sparklePath(MX - R * 0.2, MY - R * 0.18, s * 0.3)}
            fill={mc}
            fillOpacity={0.55}
            className={motion ? "motion-face-twinkle" : undefined}
            style={{
              transformOrigin: `${n2(MX - R * 0.2)}px ${n2(MY - R * 0.18)}px`,
              ["--face-dot" as string]: 2,
            }}
          />
        </g>
      );
    }
    case "failed": {
      const r = R * 0.25;
      return (
        <g data-slot="agent-face-cue" data-cue="alert">
          <circle cx={MX} cy={MY} r={n2(r + hw * 0.7)} fill={ring} />
          <circle cx={MX} cy={MY} r={n2(r)} fill="var(--destructive)" />
          <Bang x={MX} y={MY} r={r} />
        </g>
      );
    }
    case "scheduled":
      return (
        <g
          data-slot="agent-face-cue"
          data-cue="sleep"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {[0, 1].map((k) => {
            const s = R * (k ? 0.2 : 0.28);
            const x = MX - R * 0.22 + k * R * 0.26;
            const y = MY + R * 0.12 - k * R * 0.3;
            const d = `M${n2(x)} ${n2(y)}h${n2(s)}l${n2(-s)} ${n2(s)}h${n2(s)}`;
            return (
              <g
                key={k}
                className={motion ? "motion-face-rise" : undefined}
                style={{ ["--face-dot" as string]: k }}
              >
                <path d={d} stroke={ring} strokeWidth={n2(R * 0.075 + hw)} />
                <path
                  d={d}
                  stroke="var(--muted-foreground)"
                  strokeWidth={n2(R * 0.075)}
                />
              </g>
            );
          })}
        </g>
      );
    case "paused": {
      const r = R * 0.24;
      return (
        <g data-slot="agent-face-cue" data-cue="pause">
          <circle cx={MX} cy={MY} r={n2(r + hw * 0.7)} fill={ring} />
          <circle cx={MX} cy={MY} r={n2(r)} fill="var(--muted)" />
          {[-1, 1].map((s) => (
            <rect
              key={s}
              x={n2(MX + s * r * 0.3 - r * 0.12)}
              y={n2(MY - r * 0.42)}
              width={n2(r * 0.24)}
              height={n2(r * 0.84)}
              rx={n2(r * 0.12)}
              fill="var(--muted-foreground)"
            />
          ))}
        </g>
      );
    }
    default:
      return null;
  }
}

function Bang({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g fill="var(--destructive-foreground)">
      <rect
        x={n2(x - r * 0.13)}
        y={n2(y - r * 0.58)}
        width={n2(r * 0.26)}
        height={n2(r * 0.68)}
        rx={n2(r * 0.13)}
      />
      <circle cx={x} cy={n2(y + r * 0.45)} r={n2(r * 0.15)} />
    </g>
  );
}

// ---------- the badge (the Dot: needs-you, replied, failed) ----------
function Badge({
  state,
  size,
  ring,
  motion,
}: {
  state: FaceState;
  size: number;
  ring: string;
  motion: boolean;
}) {
  if (state !== "needs-you" && state !== "replied" && state !== "failed")
    return null;
  const k = 100 / size;
  const rpx = Math.max(2.6, Math.min(size * 0.12, 9));
  const r = rpx * k;
  const gap = Math.max(1.5, size * 0.03) * k;
  const x = 100 - r - 3;
  const y = 100 - r - 3;
  const fill =
    state === "needs-you"
      ? "var(--warning)"
      : state === "replied"
        ? "var(--unread)"
        : "var(--destructive)";
  return (
    <g data-slot="agent-face-badge" data-badge={state}>
      {state === "needs-you" && motion ? (
        <circle
          cx={n2(x)}
          cy={n2(y)}
          r={n2(r)}
          fill="var(--warning)"
          opacity={0}
          className="motion-face-ping"
          style={{ transformOrigin: `${n2(x)}px ${n2(y)}px` }}
        />
      ) : null}
      <circle cx={n2(x)} cy={n2(y)} r={n2(r + gap)} fill={ring} />
      <circle cx={n2(x)} cy={n2(y)} r={n2(r)} fill={fill} />
      {state === "failed" && rpx >= 5 ? <Bang x={x} y={y} r={r} /> : null}
    </g>
  );
}

// ---------- the Pebble ----------
function Pebble({
  def,
  pal,
  state,
  size,
  motion,
  ring,
  uid,
}: {
  def: FacePresetDef;
  pal: (typeof FACE_PALETTES)[number];
  state: FaceState;
  size: number;
  motion: boolean;
  ring: string;
  uid: string;
}) {
  const body = def.pebble;
  const working = state === "working";
  const bodyMotion = motion
    ? (
        {
          idle: "motion-face-breathe",
          thinking: "motion-face-ponder",
          working: "motion-face-bob",
          writing: "motion-face-talk",
          "needs-you": "motion-face-hop",
          replied: "motion-face-sway",
          scheduled: "motion-face-doze",
        } as Partial<Record<FaceState, string>>
      )[state]
    : undefined;
  // The still pose of each state (a tilt for thinking and failed).
  const pose =
    state === "thinking"
      ? "rotate(3deg)"
      : state === "failed"
        ? "rotate(-4.6deg) scale(1.01, 0.97)"
        : state === "paused"
          ? "scale(1, 0.985)"
          : undefined;
  const shapeMotion =
    motion && working
      ? def.motion === "spin"
        ? "motion-face-wobble"
        : def.motion === "rock"
          ? "motion-face-rock"
          : undefined
      : undefined;
  const faceInner = body.faces ? (
    <g>
      {body.faces.map((f, i) => (
        <path
          key={i}
          d={f.d}
          fill={
            f.tone === "shade" || f.tone === "facet-shade"
              ? "var(--face-shadow)"
              : "var(--face-highlight)"
          }
          fillOpacity={
            f.tone === "light"
              ? pal.glass
                ? 0.38
                : pal.dark
                  ? 0.1
                  : 0.26
              : f.tone === "shade"
                ? 0.1
                : f.tone === "facet-light"
                  ? 0.12
                  : 0.22
          }
        />
      ))}
    </g>
  ) : undefined;
  const topLayer = body.layers?.[body.layers.length - 1];
  return (
    <>
      {/* the floating shadow */}
      <defs>
        <radialGradient id={`${uid}-f`}>
          <stop
            offset="0"
            stopColor={pal.dark ? "var(--face-shadow)" : "var(--fb)"}
            stopOpacity={pal.dark ? 0.55 : 0.38}
          />
          <stop offset="1" stopColor="var(--fb)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx={CX}
        cy={n2(CY + R * 1.13)}
        rx={n2(R * 0.85)}
        ry={n2(R * 0.85 * 0.17)}
        fill={`url(#${uid}-f)`}
      />
      <g
        key={state}
        className={motion ? "motion-face-change" : undefined}
        style={BODY_ORIGIN}
      >
        <g className={bodyMotion} style={BODY_ORIGIN}>
          <g
            className={
              state === "replied" && motion ? "motion-face-joy" : undefined
            }
            style={BODY_ORIGIN}
          >
            <g style={{ ...BODY_ORIGIN, transform: pose }}>
              {body.ring ? (
                <Ring
                  part="back"
                  ring={body.ring}
                  state={state}
                  motion={motion}
                  id={uid}
                />
              ) : null}
              <g
                className={shapeMotion}
                style={{ transformOrigin: `${CX}px ${CY}px` }}
              >
                {body.layers ? (
                  body.layers.map((L, i) => {
                    const mix = (c: string, p: string) =>
                      L.mix >= 1
                        ? p
                        : L.mix <= 0
                          ? c
                          : `color-mix(in oklab, ${p} ${n2(L.mix * 100)}%, ${c})`;
                    const a0 = mix("var(--ca)", "var(--fa)");
                    const a = L.lift
                      ? `color-mix(in oklab, ${a0}, var(--face-highlight) ${n2(L.lift * 100)}%)`
                      : a0;
                    const slides = motion && working && def.motion === "slide";
                    return (
                      <g
                        key={i}
                        className={slides ? "motion-face-slide" : undefined}
                        style={{ ["--face-layer" as string]: i }}
                      >
                        {i > 0 ? (
                          <ellipse
                            cx={L.cx}
                            cy={n2(L.cy + L.ry * 0.55)}
                            rx={n2(L.rx * 0.95)}
                            ry={n2(L.ry * 0.3)}
                            fill="var(--fd)"
                            fillOpacity={0.22}
                          />
                        ) : null}
                        <Shade
                          id={`${uid}-l${i}`}
                          d={L.d}
                          state={state}
                          motion={motion}
                          pal={pal}
                          a={a}
                          b={mix("var(--cb)", "var(--fb)")}
                          deep={mix("var(--cd)", "var(--fd)")}
                          cx={L.cx}
                          cy={L.cy}
                          r={L.rx}
                          rim={0.6}
                          effects={i === body.layers!.length - 1}
                        />
                        {i === body.layers!.length - 1 ? (
                          <Face
                            def={def}
                            state={state}
                            size={size * PEBBLE_ZOOM}
                            motion={motion}
                            dark={!!pal.dark}
                          />
                        ) : null}
                      </g>
                    );
                  })
                ) : (
                  <Shade
                    id={`${uid}-b`}
                    d={body.d!}
                    state={state}
                    motion={motion}
                    pal={pal}
                    inner={faceInner}
                  />
                )}
              </g>
              {body.ball ? (
                <g
                  className={
                    motion && working ? "motion-face-bounce" : undefined
                  }
                >
                  <Shade
                    id={`${uid}-o`}
                    d={`M${n2(body.ball.cx - body.ball.r)} ${body.ball.cy}a${body.ball.r} ${body.ball.r} 0 1 0 ${n2(body.ball.r * 2)} 0a${body.ball.r} ${body.ball.r} 0 1 0 ${n2(-body.ball.r * 2)} 0Z`}
                    state={
                      state === "thinking" || state === "working"
                        ? "idle"
                        : state
                    }
                    motion={false}
                    pal={pal}
                    a="var(--ca)"
                    b="var(--cb)"
                    deep="var(--cd)"
                    cx={body.ball.cx}
                    cy={body.ball.cy}
                    r={body.ball.r}
                    effects={false}
                  />
                </g>
              ) : null}
              {!topLayer ? (
                <g
                  className={shapeMotion}
                  style={{ transformOrigin: `${CX}px ${CY}px` }}
                >
                  <Face
                    def={def}
                    state={state}
                    size={size * PEBBLE_ZOOM}
                    motion={motion}
                    dark={!!pal.dark}
                  />
                </g>
              ) : null}
              {body.ring ? (
                <Ring
                  part="front"
                  ring={body.ring}
                  state={state}
                  motion={motion}
                  id={uid}
                />
              ) : null}
            </g>
          </g>
        </g>
      </g>
      <Cue state={state} ring={ring} motion={motion} />
    </>
  );
}

// ---------- the Dot ----------
type Cells = [number, number, number?][];
/** The 16 cells round the 5 × 5 grid's edge, clockwise from the top left. */
const PERIMETER: [number, number][] = (() => {
  const p: [number, number][] = [];
  for (let x = 0; x < 5; x++) p.push([x, 0]);
  for (let y = 1; y < 5; y++) p.push([4, y]);
  for (let x = 3; x >= 0; x--) p.push([x, 4]);
  for (let y = 3; y >= 1; y--) p.push([0, y]);
  return p;
})();

function dotCells(def: FacePresetDef, state: FaceState): Cells {
  const tall = def.eyes === "tall";
  switch (state) {
    case "idle":
      return [
        ...(tall
          ? ([
              [1, 1],
              [1, 2],
              [3, 1],
              [3, 2],
            ] as Cells)
          : ([
              [1, 2],
              [3, 2],
            ] as Cells)),
        ...(def.mouth ? ([[2, 3, 0.55]] as Cells) : []),
      ];
    case "thinking":
      return [
        [2, 1],
        [4, 1],
      ];
    case "working":
      // Its eyes and a short bar along the bottom: never the same as a round-eyed idle.
      return [
        [1, 2],
        [3, 2],
        [1, 4, 0.5],
        [2, 4, 0.85],
        [3, 4, 0.5],
      ];
    case "writing":
      return [
        [1, 1],
        [3, 1],
        [1, 3, 0.9],
        [2, 3, 0.9],
        [3, 3, 0.9],
      ];
    case "needs-you":
      return [
        [0, 1],
        [1, 1],
        [0, 2],
        [1, 2],
        [3, 1],
        [4, 1],
        [3, 2],
        [4, 2],
        [2, 4, 0.75],
      ];
    case "replied":
      return [
        [1, 1],
        [3, 1],
        [0, 2, 0.85],
        [1, 3, 0.85],
        [2, 3, 0.85],
        [3, 3, 0.85],
        [4, 2, 0.85],
      ];
    case "failed":
      return [
        [1, 2, 0.85],
        [3, 2, 0.85],
        [1, 4, 0.6],
        [2, 3, 0.6],
        [3, 4, 0.6],
      ];
    case "scheduled":
      return [
        [0, 2, 0.6],
        [1, 2, 0.6],
        [3, 2, 0.6],
        [4, 2, 0.6],
        [4, 0, 0.7],
      ];
    case "paused":
      return [
        [1, 2, 0.45],
        [3, 2, 0.45],
      ];
  }
}

function Dot({
  def,
  pal,
  state,
  size,
  motion,
  ring,
  uid,
}: {
  def: FacePresetDef;
  pal: (typeof FACE_PALETTES)[number];
  state: FaceState;
  size: number;
  motion: boolean;
  ring: string;
  uid: string;
}) {
  const darkInk = !!pal.glass || pal.id === "mist";
  const lit = darkInk ? "var(--face-dot-ink)" : "var(--face-highlight)";
  const rest = darkInk ? 0.08 : 0.13;
  const a =
    pal.dark || darkInk
      ? "var(--fa)"
      : "color-mix(in oklab, var(--fb) 85%, var(--fa))";
  const b =
    pal.dark || darkInk
      ? "var(--fb)"
      : "color-mix(in oklab, var(--fd) 80%, var(--fb))";
  const g = 58;
  const cell = g / 5;
  const dr = cell * 0.41;
  const ox = 50 - g / 2;
  const oy = 50 - g / 2;
  const map = new Map<string, number>();
  for (const [x, y, v = 1] of dotCells(def, state)) map.set(`${x},${y}`, v);
  const chase = state === "thinking";
  const wave = state === "working";
  const typed = state === "writing";
  const glow = size >= 28 && !darkInk;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++) {
      const v = map.get(`${x},${y}`) ?? 0;
      const per = chase
        ? PERIMETER.findIndex(([px, py]) => px === x && py === y)
        : -1;
      // The still face is the cells alone; motion adds a light that passes over some of them,
      // so the still pose (and reduced motion) is the same face either way.
      const passes =
        motion && ((chase && per >= 0 && v === 0) || (wave && y === 4));
      const types = motion && typed && y === 3 && x >= 1 && x <= 3;
      // Below 32px an unlit cell isn't drawn at all, with motion or without.
      const base = v > 0 || size >= 32;
      if (!base && !passes) continue;
      const cx = n2(ox + cell * (x + 0.5));
      const cy = n2(oy + cell * (y + 0.5));
      if (base)
        cells.push(
          <circle
            key={`${x}${y}`}
            cx={cx}
            cy={cy}
            r={n2(dr * (0.6 + 0.4 * v))}
            fill={lit}
            fillOpacity={n2(v ? rest + (1 - rest) * v : rest)}
            className={types ? "motion-face-type" : undefined}
            style={
              types ? ({ "--face-dot": x } as React.CSSProperties) : undefined
            }
          />,
        );
      if (passes)
        cells.push(
          <circle
            key={`p${x}${y}`}
            cx={cx}
            cy={cy}
            r={n2(dr * 0.85)}
            fill={lit}
            opacity={0}
            className={chase ? "motion-face-chase" : "motion-face-wave"}
            style={{ "--face-dot": chase ? per : x } as React.CSSProperties}
          />,
        );
    }
  return (
    <>
      <Shade
        id={`${uid}-d`}
        d={def.dot.d}
        state={state}
        motion={motion}
        pal={pal}
        a={a}
        b={b}
        cx={50}
        cy={50}
        r={46}
        light={0.45}
        effects={false}
      />
      <g
        clipPath={`url(#${uid}-d-c)`}
        style={
          glow
            ? { filter: "drop-shadow(0 0 2.5px var(--face-highlight))" }
            : undefined
        }
      >
        {cells}
      </g>
      <Badge state={state} size={size} ring={ring} motion={motion} />
    </>
  );
}

/**
 * An agent's face (operator, 27-11-2026): one of 18 preset characters in one of 9 palettes, the
 * one way every surface draws an agent — agents are no longer hexagons. From 40px it is the
 * **Pebble**, a soft character with eyes, a mouth and a cue beside its head; below 40px it is the
 * **Dot**, the same agent as a 5 × 5 dot face in its own silhouette with a badge for the states
 * that need a person. The face shows nine states (`FaceState`): motion means busy, the cue's
 * colour says who acts next (the agent's colour: it's busy; amber: you; blue: something new;
 * red: it's stuck; grey: not running), and grey means it can't act.
 *
 * Server-safe and CSS only: every animation is a `motion-face-*` utility that starts and ends on
 * the still pose, so `motion={false}` and reduced motion both show the still face. Pass `motion`
 * only where the person is looking at that agent.
 *
 * @example
 * <AgentFace face={{ v: 1, preset: "squish", palette: "violet" }} size={64} state="thinking" motion label="Scout, agent, thinking" />
 *
 * @example
 * <AgentFace face={{ v: 1, preset: "nut", palette: "orange" }} size={20} state="needs-you" label="" />
 */
function AgentFace({
  face,
  state = "idle",
  size,
  motion = false,
  ring = "var(--background)",
  halo,
  label,
  className,
  style,
  ...props
}: AgentFaceProps) {
  const uid = `af${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const def = facePreset(face.preset);
  const pal = paletteOf(face.palette);
  const dot = size < 40;
  const named = Boolean(label);
  return (
    <svg
      data-slot="agent-face"
      data-form={dot ? "dot" : "pebble"}
      data-state={state}
      data-preset={def.id}
      data-palette={pal.id}
      viewBox={dot ? "0 0 100 100" : PEBBLE_BOX}
      width={size}
      height={size}
      role={named ? "img" : undefined}
      aria-label={named ? label : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
      className={cn("shrink-0 overflow-visible select-none", className)}
      style={{ ...paletteVars(pal.id, state, seedOf(face)), ...style }}
      {...props}
    >
      {halo && dot ? (
        <path
          d={def.dot.d}
          fill="none"
          stroke={halo}
          strokeWidth={n2(((2 * 100) / size) * 2)}
          strokeLinejoin="round"
        />
      ) : null}
      {dot ? (
        <Dot
          def={def}
          pal={pal}
          state={state}
          size={size}
          motion={motion}
          ring={ring}
          uid={uid}
        />
      ) : (
        <Pebble
          def={def}
          pal={pal}
          state={state}
          size={size}
          motion={motion}
          ring={ring}
          uid={uid}
        />
      )}
    </svg>
  );
}

export { AgentFace };
