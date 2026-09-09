import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Testimonial } from "./testimonial";

test("renders the quote in a <q> inside a blockquote, with no literal quote characters", async () => {
  const screen = await render(
    <Testimonial quote="It just works." name="A. Rivera" />,
  );
  const quote = screen.container.querySelector(
    '[data-slot="testimonial-quote"]',
  );
  expect(quote?.tagName).toBe("BLOCKQUOTE");
  // The quotation marks are CSS `quotes`, inserted by the browser for the ACTIVE language
  // — so they are NOT in the text content, and a German or French page gets its own pair
  // instead of English curly quotes.
  expect(quote?.textContent).toBe("It just works.");
  const q = quote?.querySelector("q");
  expect(q).not.toBeNull();
  expect(q?.textContent).toBe("It just works.");
  expect(quote?.innerHTML).not.toContain("\u201c");
  expect(quote?.innerHTML).not.toContain("\u201d");
});

test("renders serif italic styling on the quote", async () => {
  const screen = await render(
    <Testimonial quote="It just works." name="A. Rivera" />,
  );
  const quote = screen.container.querySelector(
    '[data-slot="testimonial-quote"]',
  ) as HTMLElement;
  expect(quote.classList.contains("font-serif")).toBe(true);
  expect(quote.classList.contains("italic")).toBe(true);
});

test("renders the attribution name and omits role when not provided", async () => {
  const screen = await render(
    <Testimonial quote="It just works." name="A. Rivera" />,
  );
  await expect.element(screen.getByText("A. Rivera")).toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="testimonial-role"]'),
  ).toBeNull();
});

test("renders the role separated by a decorative middot when provided", async () => {
  const screen = await render(
    <Testimonial
      quote="It just works."
      name="A. Rivera"
      role="CTO, Example Co."
    />,
  );
  await expect
    .element(screen.getByText("CTO, Example Co."))
    .toBeInTheDocument();
  const attribution = screen.container.querySelector(
    '[data-slot="testimonial-attribution"]',
  );
  expect(attribution?.textContent).toBe("A. Rivera·CTO, Example Co.");
});

test("no a11y violations", async () => {
  const screen = await render(
    <Testimonial
      quote="It just works."
      name="A. Rivera"
      role="CTO, Example Co."
    />,
  );
  await expectNoA11yViolations(screen.container);
});
