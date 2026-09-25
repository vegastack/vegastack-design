import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Thumbnail } from "./thumbnail";

const slot = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="thumbnail"]')!;

test("renders the image, cover-fit, at 48px by default", async () => {
  const screen = await render(
    <Thumbnail src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Lamp" />,
  );
  expect(slot(screen.container).dataset.size).toBe("default");
  expect(screen.container.querySelector("img")?.className).toContain(
    "object-cover",
  );
  await expectNoA11yViolations(screen.container);
});

test("shows the fallback with no src, at 32px when sm", async () => {
  const screen = await render(
    <Thumbnail alt="" size="sm" fallback={<span data-testid="mark" />} />,
  );
  expect(slot(screen.container).dataset.size).toBe("sm");
  expect(slot(screen.container).dataset.fallback).toBe("");
  expect(screen.container.querySelector('[data-testid="mark"]')).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});
