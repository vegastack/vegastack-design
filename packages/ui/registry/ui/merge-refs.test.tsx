import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { mergeRefs } from "@vegastack/design";

/* ---------------------------------------------------------------------------------------------
 * `mergeRefs` ships from `@vegastack/design` (it is not a registry item), but its contract is
 * about REAL ref attachment — React deciding when to call a callback ref and what to write into
 * an object ref — so it is proved here, in the one suite in this repo that renders into a real
 * browser DOM, rather than against a hand-rolled stand-in for React's ref plumbing.
 * ------------------------------------------------------------------------------------------- */

test("mergeRefs attaches the same node to an object ref and a callback ref", async () => {
  const objectRef = React.createRef<HTMLDivElement>();
  const seen: Array<HTMLDivElement | null> = [];
  const callbackRef = (node: HTMLDivElement | null) => {
    seen.push(node);
  };
  const combined = mergeRefs(objectRef, callbackRef);

  const screen = await render(<div ref={combined} data-testid="merged" />);
  const el = screen.container.querySelector('[data-testid="merged"]');
  expect(objectRef.current).toBe(el);
  expect(seen.at(-1)).toBe(el);
});

test("mergeRefs skips null/undefined entries without throwing", async () => {
  const objectRef = React.createRef<HTMLDivElement>();
  const combined = mergeRefs(objectRef, null, undefined);
  await render(<div ref={combined} data-testid="merged-safe" />);
  expect(objectRef.current).not.toBeNull();
});
