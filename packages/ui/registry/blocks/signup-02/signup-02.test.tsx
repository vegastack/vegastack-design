/**
 * `signup-02.test.tsx` — the block's browser contract: it renders, it shows its own content,
 * and the whole composed page is axe-clean. A block is a copy-once composition, so what is worth
 * pinning is that the composition still mounts and still passes the accessibility floor — the
 * behaviour of each part it composes is owned by that part's own suite.
 */

import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import Signup02Page from "./page";

test("signup-02 renders its composition", async () => {
  const screen = await render(<Signup02Page />);
  await expect
    .element(screen.getByText("Create your account").first())
    .toBeInTheDocument();
});

test("signup-02 is axe-clean", async () => {
  const screen = await render(<Signup02Page />);
  await expect
    .element(screen.getByText("Create your account").first())
    .toBeInTheDocument();
  // Unstyled: the fast browser suite mounts without the compiled token theme, so axe's contrast
  // maths would read unresolved custom properties (see test/a11y.ts).
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
