"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { VersionList, type VersionItem } from "@/components/ui/version-list";

const NOW = Date.parse("2026-09-29T10:00:00Z");
const HOUR = 3_600_000;
const ASHA = { name: "Asha Rao", hue: "blue" as const };
const BO = {
  name: "Bo Lindqvist",
  hue: "green" as const,
  badge: "Inactive",
};

const VERSIONS: VersionItem[] = [
  { id: "v8", author: ASHA, at: NOW - 0.2 * HOUR, kind: "auto" },
  {
    id: "v7",
    author: ASHA,
    at: NOW - 1 * HOUR,
    kind: "agent_checkpoint",
    label: "Before Claude's edits",
  },
  { id: "v6", author: BO, at: NOW - 3 * HOUR, kind: "safety" },
  {
    id: "v5",
    author: ASHA,
    at: NOW - 20 * HOUR,
    kind: "approved",
    name: "Inspection sign-off",
  },
  {
    id: "v4",
    author: ASHA,
    at: NOW - 22 * HOUR,
    kind: "named",
    name: "Before the inspection",
  },
  {
    id: "v3",
    author: ASHA,
    at: NOW - 30 * HOUR,
    kind: "restore",
    name: "Before restoring 26 Sep",
  },
  {
    id: "v2",
    author: BO,
    at: NOW - 50 * HOUR,
    kind: "auto",
    summary: "Added the wiring section",
  },
  {
    id: "v1",
    // Kept by the system: no person behind it.
    author: null,
    at: NOW - 80 * HOUR,
    kind: "import",
    name: "Before live editing",
  },
];

/**
 * A page's history: "Current", the text before an agent's edits and before a large deletion, an
 * approved copy, a named version, the text before a restore and before live editing (kept by the
 * system: no author), and an inactive author's badge.
 * ↑/↓ move the selection; "Named only" filters; the next page loads on scroll.
 */
export function versionList(): ReactNode {
  const [selected, setSelected] = React.useState("v8");
  const [namedOnly, setNamedOnly] = React.useState(false);
  const [more, setMore] = React.useState(false);
  // "Named only": the versions people named and the approved copies.
  const shown = namedOnly
    ? VERSIONS.filter((v) => v.kind === "named" || v.kind === "approved")
    : VERSIONS;
  return (
    <Wrapper className="block max-w-80">
      <VersionList
        versions={shown}
        currentId="v8"
        selectedId={selected}
        onSelect={setSelected}
        namedOnly={namedOnly}
        onNamedOnlyChange={setNamedOnly}
        loadMore={{ hasMore: !more, onLoadMore: () => setMore(true) }}
        now={NOW}
      />
    </Wrapper>
  );
}

/** Loading and empty. */
export function versionListStates(): ReactNode {
  return (
    <Wrapper className="grid max-w-2xl gap-6 md:grid-cols-2">
      <VersionList versions={[]} loading />
      <VersionList versions={[]} />
    </Wrapper>
  );
}
