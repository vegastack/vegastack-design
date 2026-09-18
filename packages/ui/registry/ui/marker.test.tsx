/*
 * COMPILED CSS, ON PURPOSE.
 *
 * Almost every component test in this repository runs unstyled — a fast structural lane where
 * `min-h-4` and `after:-inset-y-1` are inert. Marker cannot, because the single hunk in
 * `marker.patch` is a pseudo-element:
 *
 *   A11Y-2 adds an invisible `::after` hit area to `markerVariants`, SCOPED to `[a,button]:`,
 *   because upstream's own "Links and Buttons" section renders the marker ROOT as an `<a>` or a
 *   `<button>` and the visible row is one line of 14px text over `min-h-4` — 20px, four under the
 *   SC 2.5.8 floor. The class literal is on EVERY marker, presentational or not; only the CSS
 *   selector tells the two shapes apart. So a class-string assertion cannot express either half of
 *   the claim — "a presentational marker is byte-identical to upstream" and "an interactive one
 *   clears 24px" are both measurements, and this file takes them with `getComputedStyle(el,
 *   "::after")` and a real `document.elementFromPoint` probe.
 *
 * axe's `color-contrast` rule is LIVE here (it is vacuous in the unstyled lanes), so every
 * `expectNoA11yViolations` below is a real rendered-colour assertion on `text-muted-foreground`.
 */
import "../../test/geometry.css";
import type { ReactNode } from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { beforeAll, expect, test } from "vitest";
import {
  BookOpenCheck,
  CheckIcon,
  FileTextIcon,
  GitBranchIcon,
  SearchIcon,
} from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { Marker, MarkerContent, MarkerIcon, markerVariants } from "./marker";
import { Spinner } from "./spinner";

const VARIANTS = ["default", "separator", "border"] as const;
type Variant = (typeof VARIANTS)[number];

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

/** Every class literal anywhere in a rendered tree, including the root. */
function classesOf(root: HTMLElement): string {
  return [root, ...root.querySelectorAll<HTMLElement>("*")]
    .map((element) =>
      typeof element.className === "string" ? element.className : "",
    )
    .join(" ");
}

/**
 * The effective pointer target of one element: the union of its border box and any ABSOLUTELY
 * positioned `::before`/`::after` hit area, plus five `document.elementFromPoint` probes inside the
 * centred 24px square. Same shape as `packages/ui/test/geometry.browser.test.tsx`.
 *
 * The `position !== "absolute"` skip is load-bearing for this component in particular: the
 * `separator` variant's `::before`/`::after` ARE the two divider rules, and they are ordinary
 * in-flow flex items. Counting them as a hit area would report a target the pointer never gets.
 */
function effectiveTarget(element: HTMLElement) {
  element.scrollIntoView({ block: "center", inline: "center" });
  const rect = element.getBoundingClientRect();
  let { left, top, right, bottom } = rect;
  for (const pseudo of ["::before", "::after"]) {
    const style = getComputedStyle(element, pseudo);
    if (style.content === "none" || style.position !== "absolute") continue;
    if (style.display === "none" || style.visibility === "hidden") continue;
    const parse = (value: string) =>
      value.endsWith("px") ? Number.parseFloat(value) : Number.NaN;
    const [t, r, b, l] = [style.top, style.right, style.bottom, style.left].map(
      parse,
    ) as [number, number, number, number];
    if ([t, r, b, l].some(Number.isNaN)) continue;
    left = Math.min(left, rect.left + l);
    top = Math.min(top, rect.top + t);
    right = Math.max(right, rect.right - r);
    bottom = Math.max(bottom, rect.bottom - b);
  }

  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  // Half a pixel in from the 24px square's edge: Blink hit-tests against pixel-snapped bounds, so
  // a smaller inset reports phantom misses on the bottom edge of a correctly sized target.
  const half = 12 - 0.5;
  const misses = (
    [
      [centerX - half, centerY],
      [centerX + half, centerY],
      [centerX, centerY - half],
      [centerX, centerY + half],
      [centerX, centerY],
    ] as const
  )
    .map(([x, y]) => ({ x, y, hit: document.elementFromPoint(x, y) }))
    .filter(({ hit }) => !hit || !(hit === element || element.contains(hit)))
    .map(({ x, y, hit }) => ({
      x,
      y,
      hit: hit instanceof Element ? hit.outerHTML.slice(0, 120) : null,
    }));

  return {
    visual: { width: rect.width, height: rect.height },
    effective: { width: right - left, height: bottom - top },
    misses,
  };
}

/**
 * A fixed-width host, so a probe never depends on the test page's own width — and with vertical
 * padding, because the 24px obstruction probe reaches 1.5px ABOVE a 20px row's box and a marker
 * flush against the top of an unscrollable test page would put that point off-screen.
 */
function Row({ children }: { children: ReactNode }) {
  return <div className="w-80 py-6">{children}</div>;
}

beforeAll(async () => {
  // The lane's own sentinel: if `geometry.css` did not reach the page, `min-h-4` compiles to
  // nothing and every measurement below silently becomes an assertion about an unstyled box.
  const probe = document.createElement("div");
  probe.className = "size-6";
  document.body.append(probe);
  const { width, height } = probe.getBoundingClientRect();
  probe.remove();
  expect(
    { width, height },
    "compiled CSS did not reach the page — every measurement in this file would be vacuous",
  ).toEqual({ width: 24, height: 24 });
});

/* ── Usage ──────────────────────────────────────────────────────────────────────────────────── */

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(
    <Marker>
      <MarkerIcon>
        <CheckIcon />
      </MarkerIcon>
      <MarkerContent>Explored 4 files</MarkerContent>
    </Marker>,
  );
  expect(slot(screen.container, "marker")).not.toBeNull();
  expect(slot(screen.container, "marker-icon")).not.toBeNull();
  expect(slot(screen.container, "marker-content")).not.toBeNull();
  await expect
    .element(screen.getByText("Explored 4 files"))
    .toBeInTheDocument();
});

test("markerVariants is exported for composing the marker styles elsewhere (Usage)", () => {
  // Upstream documents this on the page ("The file also exports `markerVariants`"), so a consumer
  // building its own row can reuse the recipe rather than copy the class literal.
  expect(typeof markerVariants).toBe("function");
  expect(markerVariants({ variant: "border" })).toContain("border-b");
  expect(markerVariants()).toContain("group/marker");
});

/* ── Composition ────────────────────────────────────────────────────────────────────────────── */

test("Composition: the root is the group the content reads its variant from", async () => {
  const screen = await render(
    <Marker variant="separator">
      <MarkerContent>Conversation compacted</MarkerContent>
    </Marker>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  const content = slot(screen.container, "marker-content") as HTMLElement;
  expect(root.getAttribute("data-variant")).toBe("separator");
  expect(root.className).toContain("group/marker");
  expect(root.contains(content)).toBe(true);
  // `group-data-[variant=separator]/marker:text-center` is the mechanism behind the centred label.
  expect(getComputedStyle(content).textAlign).toBe("center");
});

/* ── Features ───────────────────────────────────────────────────────────────────────────────── */

test("Features: the icon slot is decorative and the content carries the meaning", async () => {
  const screen = await render(
    <Marker>
      <MarkerIcon>
        <GitBranchIcon />
      </MarkerIcon>
      <MarkerContent>Switched to a new branch</MarkerContent>
    </Marker>,
  );
  const icon = slot(screen.container, "marker-icon") as HTMLElement;
  expect(icon.getAttribute("aria-hidden")).toBe("true");
  // 16px, from `size-4` — and the bare `svg` inside inherits it.
  expect(icon.getBoundingClientRect().height).toBe(16);
  const svg = icon.querySelector("svg") as SVGElement;
  expect(svg.getBoundingClientRect().height).toBe(16);
});

test("Features: the root is polymorphic through `render`", async () => {
  const asLink = await render(
    <Marker render={<a href="#features" />}>
      <MarkerContent>View the pull request</MarkerContent>
    </Marker>,
  );
  expect((slot(asLink.container, "marker") as HTMLElement).tagName).toBe("A");

  const asButton = await render(
    <Marker render={<button type="button" />}>
      <MarkerContent>Revert this change</MarkerContent>
    </Marker>,
  );
  expect((slot(asButton.container, "marker") as HTMLElement).tagName).toBe(
    "BUTTON",
  );
});

/* ── Variants ───────────────────────────────────────────────────────────────────────────────── */

test.each(VARIANTS)(
  "Variants: variant=%s reaches the root as data-variant",
  async (variant) => {
    const screen = await render(
      <Marker variant={variant}>
        <MarkerContent>A marker</MarkerContent>
      </Marker>,
    );
    expect(
      (slot(screen.container, "marker") as HTMLElement).getAttribute(
        "data-variant",
      ),
    ).toBe(variant);
  },
);

test("Variants: `default` is the default, and each variant paints its own chrome", async () => {
  const bare = await render(
    <Marker>
      <MarkerContent>Inline note</MarkerContent>
    </Marker>,
  );
  const bareRoot = slot(bare.container, "marker") as HTMLElement;
  expect(bareRoot.getAttribute("data-variant")).toBe("default");
  expect(getComputedStyle(bareRoot).borderBottomWidth).toBe("0px");
  expect(getComputedStyle(bareRoot, "::before").content).toBe("none");

  const border = await render(
    <Marker variant="border">
      <MarkerContent>Row boundary</MarkerContent>
    </Marker>,
  );
  expect(
    getComputedStyle(slot(border.container, "marker") as HTMLElement)
      .borderBottomWidth,
  ).toBe("1px");

  const separator = await render(
    <Marker variant="separator">
      <MarkerContent>Today</MarkerContent>
    </Marker>,
  );
  const separatorRoot = slot(separator.container, "marker") as HTMLElement;
  for (const pseudo of ["::before", "::after"] as const) {
    const style = getComputedStyle(separatorRoot, pseudo);
    expect(style.content, `separator ${pseudo}`).toBe('""');
    expect(style.height, `separator ${pseudo}`).toBe("1px");
  }
});

/* ── Status ─────────────────────────────────────────────────────────────────────────────────── */

test("Status: `role` reaches the underlying element so the update is announced", async () => {
  const screen = await render(
    <Marker role="status">
      <MarkerIcon>
        <Spinner />
      </MarkerIcon>
      <MarkerContent>Compacting conversation</MarkerContent>
    </Marker>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  expect(root.getAttribute("role")).toBe("status");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Compacting conversation");
});

test("Status: a separator marker can be a status too", async () => {
  const screen = await render(
    <Marker variant="separator" role="status">
      <MarkerIcon>
        <Spinner />
      </MarkerIcon>
      <MarkerContent>Running tests</MarkerContent>
    </Marker>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  expect(root.getAttribute("role")).toBe("status");
  expect(root.getAttribute("data-variant")).toBe("separator");
});

/* ── Shimmer ────────────────────────────────────────────────────────────────────────────────── */

test("Shimmer: the utility animates the content, and only where it is applied", async () => {
  const screen = await render(
    <Marker role="status">
      <MarkerContent className="shimmer">Thinking...</MarkerContent>
    </Marker>,
  );
  const content = slot(screen.container, "marker-content") as HTMLElement;
  expect(getComputedStyle(content).animationName).toBe("tw-shimmer");

  const plain = await render(
    <Marker role="status">
      <MarkerContent>Thinking...</MarkerContent>
    </Marker>,
  );
  expect(
    getComputedStyle(slot(plain.container, "marker-content") as HTMLElement)
      .animationName,
  ).toBe("none");
});

/* ── Separator ──────────────────────────────────────────────────────────────────────────────── */

test("Separator: the label is centred between two rules that take the leftover width", async () => {
  const screen = await render(
    <Row>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    </Row>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  const content = slot(screen.container, "marker-content") as HTMLElement;
  const rootBox = root.getBoundingClientRect();
  const contentBox = content.getBoundingClientRect();
  // The label does not stretch — `flex-none` — and it sits in the middle of the row.
  expect(getComputedStyle(content).flexGrow).toBe("0");
  expect(contentBox.width).toBeLessThan(rootBox.width / 2);
  const contentCentre = (contentBox.left + contentBox.right) / 2;
  const rootCentre = (rootBox.left + rootBox.right) / 2;
  expect(Math.abs(contentCentre - rootCentre)).toBeLessThan(2);
});

/* ── Border ─────────────────────────────────────────────────────────────────────────────────── */

test("Border: the rule sits under the row and nothing else moves", async () => {
  const plain = await render(
    <Row>
      <Marker>
        <MarkerIcon>
          <FileTextIcon />
        </MarkerIcon>
        <MarkerContent>Opened implementation notes</MarkerContent>
      </Marker>
    </Row>,
  );
  const bordered = await render(
    <Row>
      <Marker variant="border">
        <MarkerIcon>
          <FileTextIcon />
        </MarkerIcon>
        <MarkerContent>Opened implementation notes</MarkerContent>
      </Marker>
    </Row>,
  );
  const plainRoot = slot(plain.container, "marker") as HTMLElement;
  const borderedRoot = slot(bordered.container, "marker") as HTMLElement;
  const style = getComputedStyle(borderedRoot);
  expect(style.borderBottomStyle).toBe("solid");
  expect(style.borderBottomWidth).toBe("1px");
  // `pb-2` + the 1px rule: the bordered row is exactly 9px taller, and no wider.
  expect(borderedRoot.getBoundingClientRect().height).toBeCloseTo(
    plainRoot.getBoundingClientRect().height + 9,
    1,
  );
  expect(borderedRoot.getBoundingClientRect().width).toBeCloseTo(
    plainRoot.getBoundingClientRect().width,
    1,
  );
});

/* ── With Icon ──────────────────────────────────────────────────────────────────────────────── */

test("With Icon: the icon leads the row, and `flex-col` stacks it above the content", async () => {
  const inline = await render(
    <Row>
      <Marker>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>
    </Row>,
  );
  const icon = slot(inline.container, "marker-icon") as HTMLElement;
  const content = slot(inline.container, "marker-content") as HTMLElement;
  expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(
    content.getBoundingClientRect().left,
  );

  const stacked = await render(
    <Row>
      <Marker className="flex-col">
        <MarkerIcon>
          <BookOpenCheck />
        </MarkerIcon>
        <MarkerContent>Syncing completed</MarkerContent>
      </Marker>
    </Row>,
  );
  const stackedIcon = slot(stacked.container, "marker-icon") as HTMLElement;
  const stackedContent = slot(
    stacked.container,
    "marker-content",
  ) as HTMLElement;
  expect(stackedIcon.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    stackedContent.getBoundingClientRect().top,
  );
});

/* ── Links and Buttons ──────────────────────────────────────────────────────────────────────── */

test("Links and Buttons: a rendered link is a link, and takes its name from the text", async () => {
  const screen = await render(
    <Marker render={<a href="#links-and-buttons" />}>
      <MarkerIcon>
        <GitBranchIcon />
      </MarkerIcon>
      <MarkerContent>View the pull request</MarkerContent>
    </Marker>,
  );
  await expect
    .element(screen.getByRole("link", { name: "View the pull request" }))
    .toBeInTheDocument();
  // `[a]:underline` is scoped to the root being an anchor, so the rendered link is underlined.
  expect(
    getComputedStyle(slot(screen.container, "marker") as HTMLElement)
      .textDecorationLine,
  ).toContain("underline");
});

test("Links and Buttons: a rendered button activates on click and on Enter", async () => {
  const clicks: string[] = [];
  const screen = await render(
    <Marker
      render={<button type="button" onClick={() => clicks.push("revert")} />}
    >
      <MarkerIcon>
        <SearchIcon />
      </MarkerIcon>
      <MarkerContent>Revert this change</MarkerContent>
    </Marker>,
  );
  const button = screen.getByRole("button", { name: "Revert this change" });
  await userEvent.click(button);
  expect(clicks).toEqual(["revert"]);
  await userEvent.keyboard("{Enter}");
  expect(clicks).toEqual(["revert", "revert"]);
});

/* ── Accessibility ──────────────────────────────────────────────────────────────────────────── */

test("Accessibility: MarkerIcon is aria-hidden, so it is never announced", async () => {
  const screen = await render(
    <Marker>
      <MarkerIcon>
        <CheckIcon />
      </MarkerIcon>
      <MarkerContent>All checks passed</MarkerContent>
    </Marker>,
  );
  const icon = slot(screen.container, "marker-icon") as HTMLElement;
  expect(icon.getAttribute("aria-hidden")).toBe("true");
  expect((slot(screen.container, "marker") as HTMLElement).textContent).toBe(
    "All checks passed",
  );
});

test("Accessibility: a labelled separator takes NO role of its own", async () => {
  const screen = await render(
    <Marker variant="separator">
      <MarkerContent>Today</MarkerContent>
    </Marker>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  // Upstream is explicit: `role="separator"` would make the visible label presentational, so the
  // component adds no role and the text is announced as ordinary content.
  expect(root.hasAttribute("role")).toBe(false);
  await expect.element(screen.getByText("Today")).toBeInTheDocument();
});

test("Accessibility: an interactive marker is focusable through the keyboard", async () => {
  const screen = await render(
    <Marker render={<a href="#accessibility" />}>
      <MarkerContent>Explored 4 files</MarkerContent>
    </Marker>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  for (let step = 0; step < 6 && document.activeElement !== root; step++) {
    await userEvent.tab();
  }
  expect(document.activeElement).toBe(root);
});

/* ── the exceptions `marker.patch` implements ───────────────────────────────────────────────── */

test("A11Y-2: a presentational marker grows no hit area — it is byte-identical to upstream", async () => {
  const screen = await render(
    <Row>
      <Marker>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>
    </Row>,
  );
  const root = slot(screen.container, "marker") as HTMLElement;
  // The class literal `[a,button]:after:absolute …` is on EVERY marker — it is in the base string.
  // Only the selector separates the two shapes, so this has to be measured, not read.
  expect(root.className).toContain("[a,button]:after:absolute");
  const after = getComputedStyle(root, "::after");
  expect(after.content, "a presentational marker must paint no ::after").toBe(
    "none",
  );
  const probe = effectiveTarget(root);
  expect(probe.effective.height).toBeCloseTo(probe.visual.height, 2);
  expect(probe.effective.width).toBeCloseTo(probe.visual.width, 2);
});

test.each([
  ["a link", <a key="a" href="#links-and-buttons" />],
  ["a button", <button key="b" type="button" />],
])(
  "A11Y-2: %s marker carries a 20px row past the 24px pointer floor",
  async (_label, element) => {
    const screen = await render(
      <Row>
        <Marker render={element}>
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>View the pull request</MarkerContent>
        </Marker>
      </Row>,
    );
    const root = slot(screen.container, "marker") as HTMLElement;

    // The hit area must be LIVE. A pseudo-element the cascade has switched off is exactly what
    // `effectiveTarget` refuses to count, so this assertion and the measurement below are two
    // independent statements of the same fact.
    const after = getComputedStyle(root, "::after");
    expect(after.content).toBe('""');
    expect(after.position).toBe("absolute");

    const probe = effectiveTarget(root);
    // The VISIBLE row is upstream's, untouched: one line of 14px text over `min-h-4`.
    expect(
      probe.visual.height,
      `the visible row measured ${probe.visual.height.toFixed(2)}px`,
    ).toBeLessThan(24);
    // The POINTER target is not.
    expect(
      probe.effective.height >= 23.5,
      `the effective target measured ${probe.effective.height.toFixed(2)}px tall`,
    ).toBe(true);
    expect(
      probe.misses,
      "the marker must own the interior of its centred 24px square",
    ).toEqual([]);
  },
);

test("A11Y-2: the hit area grows the BLOCK axis only, so stacked markers never fight", async () => {
  const screen = await render(
    <Row>
      <Marker render={<a href="#one" />}>
        <MarkerContent>First</MarkerContent>
      </Marker>
      <Marker render={<a href="#two" />}>
        <MarkerContent>Second</MarkerContent>
      </Marker>
    </Row>,
  );
  const [first, second] = [
    ...screen.container.querySelectorAll<HTMLElement>('[data-slot="marker"]'),
  ];
  const after = getComputedStyle(first!, "::after");
  // `inset-x-0`: the area never reaches past the row's own width.
  expect(after.left).toBe("0px");
  expect(after.right).toBe("0px");
  // Each row still owns its own centre, which is the only thing the "never fight" claim means.
  for (const row of [first!, second!]) {
    const box = row.getBoundingClientRect();
    const hit = document.elementFromPoint(
      (box.left + box.right) / 2,
      (box.top + box.bottom) / 2,
    );
    expect(hit === row || row.contains(hit)).toBe(true);
  }
});

test("Nothing else: marker paints no focus glow and suppresses no outline", async () => {
  // `marker.patch`'s second hunk row is a claim of ABSENCE — "upstream's marker paints no focus
  // glow, sets no cursor, disables nothing and opens no portal". This is what holds it to that.
  const screen = await render(
    <Row>
      <Marker render={<a href="#nothing-else" />}>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>View the pull request</MarkerContent>
      </Marker>
    </Row>,
  );
  const classes = classesOf(screen.container as HTMLElement);
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
  expect(classes).not.toContain("focus-visible:ring-");
  expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(classes).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  expect(classes).not.toContain("cursor-");
});

/* ── axe, per variant and per shape ─────────────────────────────────────────────────────────── */

test.each(VARIANTS)(
  "no a11y violations — variant=%s",
  async (variant: Variant) => {
    const screen = await render(
      <Row>
        <Marker variant={variant}>
          <MarkerIcon>
            <FileTextIcon />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
      </Row>,
    );
    await expectNoA11yViolations(screen.container);
  },
);

test("no a11y violations — a status marker", async () => {
  const screen = await render(
    <Row>
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">
          Compacting conversation
        </MarkerContent>
      </Marker>
    </Row>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a link marker and a button marker", async () => {
  const screen = await render(
    <Row>
      <Marker render={<a href="#a11y-link" />}>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>View the pull request</MarkerContent>
      </Marker>
      <Marker render={<button type="button" />}>
        <MarkerIcon>
          <SearchIcon />
        </MarkerIcon>
        <MarkerContent>Revert this change</MarkerContent>
      </Marker>
    </Row>,
  );
  await expectNoA11yViolations(screen.container);
});
