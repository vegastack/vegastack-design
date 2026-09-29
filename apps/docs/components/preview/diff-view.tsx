"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { DiffView } from "@/components/ui/diff-view";

const BEFORE = `# Kitchen circuit

Use a 20 A breaker for the cooker.

## Wiring

Brown to L, blue to N.`;

const AFTER = `# Kitchen circuit

Use a 25 A breaker for the cooker and keep the panel labelled.

## Wiring

Brown to L, blue to N, green-yellow to earth.

## Sign-off

Ask Bo to check the RCD.`;

/** Two versions of a page: removed words struck through, added words tinted. */
export function diffView(): ReactNode {
  return (
    <Wrapper className="block max-w-2xl">
      <DiffView before={BEFORE} after={AFTER} />
    </Wrapper>
  );
}

const LONG = Array.from(
  { length: 12 },
  (_, i) => `Step ${i + 1}: check the terminal.`,
).join("\n");

/** Identical texts, and a long unchanged run folded behind "Show N unchanged lines". */
export function diffViewStates(): ReactNode {
  return (
    <Wrapper className="grid max-w-2xl gap-6">
      <DiffView before={BEFORE} after={BEFORE} />
      <DiffView before={`${LONG}\nDone.`} after={`${LONG}\nDone and signed.`} />
    </Wrapper>
  );
}
