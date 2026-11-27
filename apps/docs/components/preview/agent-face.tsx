"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/agent-face` (dogfoods the registry) → auto-scanned.
import {
  AgentFace,
  FACE_STATE_LABELS,
  type FaceState,
} from "@/components/ui/agent-face";
import {
  FACE_PALETTES,
  FACE_PRESETS,
  type FacePalette,
} from "@/lib/agent-face-spec";

const STATES = Object.keys(FACE_STATE_LABELS) as FaceState[];

export function agentFace(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <AgentFace
        face={{ v: 1, preset: "squish", palette: "violet" }}
        size={96}
        state="thinking"
        motion
        label="Scout, agent, thinking"
      />
      <AgentFace
        face={{ v: 1, preset: "bloom", palette: "orange" }}
        size={96}
        state="writing"
        motion
        label="Sunny, agent, writing"
      />
      <AgentFace
        face={{ v: 1, preset: "nut", palette: "teal" }}
        size={96}
        state="needs-you"
        motion
        label="Rivet, agent, needs you"
      />
    </Wrapper>
  );
}

/** The 18 presets, each in a palette (cycled), still. */
export function agentFacePresets(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      {FACE_PRESETS.map((p, i) => (
        <figure key={p.id} className="flex flex-col items-center gap-1">
          <AgentFace
            face={{
              v: 1,
              preset: p.id,
              palette: FACE_PALETTES[i % FACE_PALETTES.length]!.id,
            }}
            size={64}
            label=""
          />
          <figcaption className="text-xs text-muted-foreground">
            {p.name}
          </figcaption>
        </figure>
      ))}
    </Wrapper>
  );
}

/** One preset in all nine palettes. */
export function agentFacePalettes(): ReactNode {
  return (
    <Wrapper className="flex-wrap gap-4">
      {FACE_PALETTES.map((p) => (
        <figure key={p.id} className="flex flex-col items-center gap-1">
          <AgentFace
            face={{ v: 1, preset: "squish", palette: p.id as FacePalette }}
            size={56}
            label=""
          />
          <figcaption className="text-xs text-muted-foreground">
            {p.name}
          </figcaption>
        </figure>
      ))}
    </Wrapper>
  );
}

/** Every state, moving, as the Pebble and as the Mini. */
export function agentFaceStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-9">
        {STATES.map((state) => (
          <figure key={state} className="flex flex-col items-center gap-1">
            <AgentFace
              face={{ v: 1, preset: "squish", palette: "violet" }}
              size={64}
              state={state}
              motion
              label=""
            />
            <AgentFace
              face={{ v: 1, preset: "squish", palette: "violet" }}
              size={24}
              state={state}
              motion
              label=""
            />
            <AgentFace
              face={{
                v: 1,
                family: "dot",
                preset: "squish",
                palette: "violet",
              }}
              size={48}
              state={state}
              motion
              label=""
            />
            <figcaption className="text-xs text-muted-foreground">
              {FACE_STATE_LABELS[state]}
            </figcaption>
          </figure>
        ))}
      </div>
    </Wrapper>
  );
}

const FAMILY_SAMPLE = [
  ["squish", "violet"],
  ["arch", "pink"],
  ["prism", "orange"],
  ["cairn", "teal"],
  ["drop", "ink"],
  ["nut", "glass"],
] as const;

/** The two families: Pebbles and Dots, the same characters and colours. */
export function agentFaceFamilies(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      {(["pebble", "dot"] as const).map((family) => (
        <div key={family} className="flex flex-wrap items-center gap-3">
          <span className="w-full text-sm text-muted-foreground sm:w-16">
            {family === "pebble" ? "Pebbles" : "Dots"}
          </span>
          {FAMILY_SAMPLE.map(([preset, palette]) => (
            <AgentFace
              key={preset}
              face={{ v: 1, family, preset, palette }}
              size={48}
              label=""
            />
          ))}
        </div>
      ))}
    </Wrapper>
  );
}

/** The Mini at the row steps and the Pebble from 40px. */
export function agentFaceSizes(): ReactNode {
  return (
    <Wrapper className="items-end gap-4">
      {[16, 20, 24, 32, 40, 64, 96].map((size) => (
        <figure key={size} className="flex flex-col items-center gap-1">
          <AgentFace
            face={{ v: 1, preset: "cairn", palette: "mist" }}
            size={size}
            label=""
          />
          <figcaption className="text-xs text-muted-foreground">
            {size}px
          </figcaption>
        </figure>
      ))}
    </Wrapper>
  );
}
