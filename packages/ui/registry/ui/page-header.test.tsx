import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TooltipProvider } from "./tooltip";
import { PageHeader } from "./page-header";

test("renders the title as an h1", async () => {
  const screen = await render(<PageHeader title="Settings" />);
  const heading = screen.getByRole("heading", { level: 1, name: "Settings" });
  await expect.element(heading).toBeInTheDocument();
  await expect
    .element(heading)
    .toHaveAttribute("data-slot", "page-header-title");
});

test("renders the root as a <header> banner landmark", async () => {
  const screen = await render(<PageHeader title="Settings" />);
  const banner = screen.getByRole("banner");
  await expect.element(banner).toBeInTheDocument();
  await expect.element(banner).toHaveAttribute("data-slot", "page-header");
  expect(banner.element().tagName).toBe("HEADER");
});

test("renders the description", async () => {
  const screen = await render(
    <PageHeader title="Settings" description="Workspace preferences." />,
  );
  await expect
    .element(screen.getByText("Workspace preferences."))
    .toBeInTheDocument();
});

test("renders the breadcrumb slot", async () => {
  const screen = await render(
    <PageHeader
      title="API Keys"
      breadcrumb={<nav aria-label="breadcrumb">Settings</nav>}
    />,
  );
  await expect
    .element(screen.getByRole("navigation", { name: "breadcrumb" }))
    .toBeInTheDocument();
});

test("back button fires onBack", async () => {
  const onBack = vi.fn();
  const screen = await render(
    <PageHeader title="Plan" onBack={onBack} backLabel="Go back" />,
  );
  await screen.getByRole("button", { name: "Go back" }).click();
  expect(onBack).toHaveBeenCalledOnce();
});

test("backHref renders the back affordance as a link", async () => {
  const screen = await render(
    <PageHeader title="Plan" backHref="/settings" backLabel="Go back" />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Go back" }))
    .toHaveAttribute("href", "/settings");
});

test("renders the actions slot, right-aligned", async () => {
  const screen = await render(
    <PageHeader
      title="Spaces"
      actions={<button type="button">New space</button>}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "New space" }))
    .toBeInTheDocument();
  const actions = screen.container.querySelector(
    '[data-slot="page-header-actions"]',
  )!;
  expect(actions).not.toBeNull();
});

test("title row lets the actions wrap below the title at narrow widths (no crushed h1)", async () => {
  // Regression: `shrink-0` actions in a no-wrap row crushed the title to a few characters.
  // Contract (class-asserted — this suite loads no compiled CSS): the row wraps, and the title
  // block claims a readable minimum via its flex basis before the actions row (ml-auto keeps it
  // right-aligned on its own wrapped line) drops down.
  const screen = await render(
    <PageHeader
      title="Quarterly review"
      actions={<button type="button">Export</button>}
    />,
  );
  const h1 = screen.getByRole("heading", { level: 1 }).element() as HTMLElement;
  const row = h1.closest(".flex-wrap") as HTMLElement;
  expect(row).not.toBeNull();
  const titleBlock = row.firstElementChild as HTMLElement;
  expect(titleBlock.classList.contains("basis-48")).toBe(true);
  expect(titleBlock.classList.contains("grow")).toBe(true);
  expect(titleBlock.classList.contains("min-w-0")).toBe(true); // truncation still allowed
  const actions = screen.container.querySelector(
    '[data-slot="page-header-actions"]',
  ) as HTMLElement;
  expect(actions.classList.contains("ml-auto")).toBe(true);
});

test("renders the secondary menu slot after the actions", async () => {
  const screen = await render(
    <PageHeader
      title="Spaces"
      actions={<button type="button">New</button>}
      secondaryMenu={<button type="button">More</button>}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "More" }))
    .toBeInTheDocument();
});

test("favorite star toggles (uncontrolled) and fires onToggle", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <PageHeader title="Doc" favorite={{ label: "Favorite", onToggle }} />,
  );
  const star = screen.getByRole("button", { name: "Favorite" });
  await expect.element(star).toHaveAttribute("aria-pressed", "false");
  await star.click();
  expect(onToggle).toHaveBeenCalledWith(true);
  await expect.element(star).toHaveAttribute("aria-pressed", "true");
  await star.click();
  expect(onToggle).toHaveBeenLastCalledWith(false);
  await expect.element(star).toHaveAttribute("aria-pressed", "false");
});

test("favorite star is controlled when active is provided", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <PageHeader
      title="Doc"
      favorite={{ active: true, label: "Favorite", onToggle }}
    />,
  );
  const star = screen.getByRole("button", { name: "Favorite" });
  await expect.element(star).toHaveAttribute("aria-pressed", "true");
  await star.click();
  // Controlled: state does not change locally; host owns it via onToggle.
  expect(onToggle).toHaveBeenCalledWith(false);
  await expect.element(star).toHaveAttribute("aria-pressed", "true");
});

test("omits the back, favorite, and actions slots when not configured", async () => {
  const screen = await render(<PageHeader title="Plain" />);
  expect(
    screen.container.querySelector('[data-slot="page-header-back"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="page-header-favorite"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="page-header-actions"]'),
  ).toBeNull();
});

test("forwards ref to the root element", async () => {
  // The root renders <header>, not <div> — header has no dedicated DOM interface, so the
  // ref lands as a generic HTMLElement (register: header/banner-landmark fix).
  const ref = React.createRef<HTMLElement>();
  await render(<PageHeader ref={ref} title="Profile" />);
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.tagName).toBe("HEADER");
  expect(ref.current?.dataset.slot).toBe("page-header");
});

test("no a11y violations", async () => {
  const screen = await render(
    <PageHeader
      title="API Keys"
      description="Manage keys for this workspace."
      backHref="/settings"
      breadcrumb={<nav aria-label="breadcrumb">Settings</nav>}
      favorite={{ defaultActive: true, label: "Favorite" }}
      actions={<button type="button">New key</button>}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled favorite", async () => {
  const screen = await render(
    <PageHeader title="Doc" favorite={{ label: "Favorite", disabled: true }} />,
  );
  await expectNoA11yViolations(screen.container);
});

// --- Title truncation (TruncatedText) ------------------------------------------
//
// Test files import no CSS (see vitest.config.ts), so `truncate`/`block` are inert Tailwind
// class names here — an injected real stylesheet recreates their effect (block, hidden overflow,
// no wrap, a tiny max-width) directly on TruncatedText's own rendered node
// (`[data-slot="truncated-text"]`, PageHeader's actual measured element), mirroring
// truncated-text.test.tsx's inline-style `CLIP` object so `useOverflow`'s
// scrollWidth/clientWidth measurement genuinely engages instead of just wrapping the text.
const TITLE_MEASURE =
  '[data-slot="truncated-text"] { display: block; overflow: hidden; white-space: nowrap; }';

const TITLE_CLIP =
  '[data-slot="truncated-text"] { display: block; overflow: hidden; white-space: nowrap; width: 48px; }';

test("a short title never mounts TruncatedText's Tooltip wrapper", async () => {
  const screen = await render(
    <>
      <style>{TITLE_MEASURE}</style>
      <PageHeader title="Settings" />
    </>,
  );
  const title = screen.getByText("Settings");
  await expect.element(title).toHaveAttribute("data-slot", "truncated-text");
  await expect.element(title).not.toHaveAttribute("tabindex");
});

test("an overlong title truncates via TruncatedText and is keyboard-focusable", async () => {
  const long =
    "A workspace title so long it will certainly overflow the constrained header row";
  const screen = await render(
    <TooltipProvider>
      <style>{TITLE_CLIP}</style>
      <PageHeader title={long} />
    </TooltipProvider>,
  );
  const title = screen.getByText(long);
  await expect.element(title).toHaveAttribute("data-slot", "truncated-text");
  await expect.element(title).toHaveClass("truncate");
  // Overflow measurement is async (ResizeObserver) — poll until the trigger upgrade lands.
  await expect.element(title).toHaveAttribute("tabindex", "0");
  // The h1 stays the accessible heading — TruncatedText composes inside it, not instead of it.
  await expect
    .element(screen.getByRole("heading", { level: 1, name: long }))
    .toBeInTheDocument();
});

test("hovering an overlong title reveals the full text via a Tooltip", async () => {
  const long =
    "A workspace title so long it will certainly overflow the constrained header row";
  const screen = await render(
    <TooltipProvider>
      <style>{TITLE_CLIP}</style>
      <PageHeader title={long} />
    </TooltipProvider>,
  );
  const title = screen.getByText(long);
  await expect.element(title).toHaveAttribute("tabindex", "0");
  await userEvent.hover(title);
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
});

test("no a11y violations — truncated title with the tooltip open", async () => {
  const long =
    "A workspace title so long it will certainly overflow the constrained header row";
  const screen = await render(
    <TooltipProvider>
      <style>{TITLE_CLIP}</style>
      <PageHeader title={long} />
    </TooltipProvider>,
  );
  const title = screen.getByText(long);
  await expect.element(title).toHaveAttribute("tabindex", "0");
  await userEvent.hover(title);
  await expect.element(screen.getByRole("tooltip")).toBeInTheDocument();
  // axe the portaled tooltip too, which lands outside the render container.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});
