import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/contrast.css";
import { PersonAvatar } from "./person-avatar";

const fallback = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;

test("initials on the person's hue", async () => {
  const screen = await render(
    <PersonAvatar person={{ name: "Asha K Rao", hue: "blue" }} />,
  );
  expect(fallback(screen.container).textContent).toBe("AR");
  expect(fallback(screen.container).dataset.hue).toBe("blue");
  expect(fallback(screen.container).className).toContain("bg-tag-blue-subtle");
  await expectNoA11yViolations(screen.container);
});

test("no hue keeps the muted fallback; no name uses the email", async () => {
  const screen = await render(
    <PersonAvatar person={{ name: "", email: "ops@acme.com" }} />,
  );
  expect(fallback(screen.container).textContent).toBe("OP");
  expect(fallback(screen.container).dataset.hue).toBeUndefined();
  expect(fallback(screen.container).className).toContain("bg-muted");
});
