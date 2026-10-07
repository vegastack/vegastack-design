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
  { id: "v6", author: ASHA, at: NOW - 0.2 * HOUR, kind: "auto" },
  { id: "v5", author: BO, at: NOW - 1 * HOUR, kind: "conflict" },
  {
    id: "v4",
    author: ASHA,
    at: NOW - 20 * HOUR,
    kind: "named",
    name: "Before the inspection",
  },
  { id: "v3", author: ASHA, at: NOW - 30 * HOUR, kind: "restore" },
  {
    id: "v2",
    author: BO,
    at: NOW - 50 * HOUR,
    kind: "auto",
    summary: "Added the wiring section",
  },
];

/**
 * A page's history: "Current", a lost save kept as "Unsaved copy", a named version, a restore, and
 * an inactive author's badge.
 * ↑/↓ move the selection; "Named only" filters; "Load more" pages on.
 */
export function versionList(): ReactNode {
  const [selected, setSelected] = React.useState("v6");
  const [namedOnly, setNamedOnly] = React.useState(false);
  const [more, setMore] = React.useState(false);
  const shown = namedOnly ? VERSIONS.filter((v) => v.name) : VERSIONS;
  return (
    <Wrapper className="block max-w-80">
      <VersionList
        versions={shown}
        currentId="v6"
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
