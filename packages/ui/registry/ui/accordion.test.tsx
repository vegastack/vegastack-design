import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { DirectionProvider } from "./direction";

const slot = (name: string, root: ParentNode = document) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (name: string, root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

/**
 * The nth match, with its presence asserted rather than assumed. The package runs with
 * `noUncheckedIndexedAccess`, so an index into a NodeList is `HTMLElement | undefined`; silently
 * asserting through that would turn a missing element into a confusing attribute failure instead of
 * the plain "there is no nth trigger" this reports.
 */
const nth = (name: string, index: number, root: ParentNode = document) => {
  const found = slots(name, root)[index];
  expect(found, `no "${name}" at index ${index}`).toBeDefined();
  return found as HTMLElement;
};

/** Three sections, the first open — the shape every upstream example starts from. */
function Subject(props: React.ComponentProps<typeof Accordion>) {
  return (
    <Accordion defaultValue={["shipping"]} {...props}>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Standard, express and overnight.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Accepted within 30 days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>Support</AccordionTrigger>
        <AccordionContent>Email, chat or phone.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

test("renders every exported part with its data-slot (Usage)", async () => {
  const screen = await render(<Subject />);
  expect(slot("accordion", screen.container)).not.toBeNull();
  expect(slots("accordion-item", screen.container)).toHaveLength(3);
  expect(slots("accordion-trigger", screen.container)).toHaveLength(3);
  // Only the open item mounts a panel: `keepMounted` is off by default.
  expect(slots("accordion-content", screen.container)).toHaveLength(1);
});

test("the trigger is a button inside a heading, wired to its panel (Usage)", async () => {
  const screen = await render(<Subject />);
  const trigger = screen.getByRole("button", { name: "Shipping" }).element();
  expect(trigger.tagName).toBe("BUTTON");
  expect(trigger.closest("h3")).not.toBeNull();
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const panelId = trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  const panel = document.getElementById(panelId as string) as HTMLElement;
  expect(panel.getAttribute("role")).toBe("region");
  expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
});

test("Composition: the item's value is what the root's defaultValue names", async () => {
  const screen = await render(<Subject />);
  expect(
    nth("accordion-trigger", 0, screen.container).getAttribute("aria-expanded"),
  ).toBe("true");
  expect(
    nth("accordion-trigger", 1, screen.container).getAttribute("aria-expanded"),
  ).toBe("false");
});

test("Basic: opening one section closes the other (single is the default)", async () => {
  const screen = await render(<Subject />);
  await userEvent.click(screen.getByRole("button", { name: "Returns" }));
  await expect
    .poll(() =>
      // index 1 is "Returns"
      nth("accordion-trigger", 1, screen.container).getAttribute(
        "aria-expanded",
      ),
    )
    .toBe("true");
  expect(
    nth("accordion-trigger", 0, screen.container).getAttribute("aria-expanded"),
  ).toBe("false");
  expect(slots("accordion-content", screen.container)).toHaveLength(1);
});

test("Basic: the open section closes when its own trigger is pressed again", async () => {
  const screen = await render(<Subject />);
  await userEvent.click(screen.getByRole("button", { name: "Shipping" }));
  await expect
    .poll(() => slots("accordion-content", screen.container).length)
    .toBe(0);
});

test("Multiple: `multiple` keeps both sections open at once", async () => {
  const screen = await render(<Subject multiple />);
  await userEvent.click(screen.getByRole("button", { name: "Returns" }));
  await expect
    .poll(() => slots("accordion-content", screen.container).length)
    .toBe(2);
  const expanded = slots("accordion-trigger", screen.container).map((t) =>
    t.getAttribute("aria-expanded"),
  );
  expect(expanded).toEqual(["true", "true", "false"]);
});

test("Disabled: a disabled item's trigger does not toggle (Disabled)", async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="open-me">
        <AccordionTrigger>Account history</AccordionTrigger>
        <AccordionContent>Every transaction.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="premium" disabled>
        <AccordionTrigger>Premium feature information</AccordionTrigger>
        <AccordionContent>Upgrade to read this.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  // `.element()` is typed `SVGElement | HTMLElement`; an accordion trigger is a `<button>`, and the
  // "is a button inside a heading" test above proves it.
  const trigger = screen
    .getByRole("button", { name: "Premium feature information" })
    .element() as HTMLElement;
  expect(trigger.getAttribute("aria-disabled")).toBe("true");
  // A native `.click()` rather than the driver's: Playwright refuses to click an `aria-disabled`
  // control ("element is not enabled"), which would prove the driver's policy instead of the
  // component's. This dispatches the event the component would actually receive.
  trigger.click();
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(slots("accordion-content", screen.container)).toHaveLength(0);
});

test("FRM-4: a disabled section header keeps its pointer events", async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="premium" disabled>
        <AccordionTrigger>Premium feature information</AccordionTrigger>
        <AccordionContent>Upgrade to read this.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  const trigger = slot("accordion-trigger", screen.container) as HTMLElement;
  // The recipe never spells the class...
  expect(trigger.className).not.toContain("pointer-events-none");
  // ...and nothing else puts it back: the header is still hit-testable, which is what lets a
  // Tooltip explain why the section is unavailable.
  expect(getComputedStyle(trigger).pointerEvents).not.toBe("none");
  // `aria-disabled`, not the native attribute — a natively disabled button fires no pointer events
  // at all, so FRM-4 depends on this half too.
  expect((trigger as HTMLButtonElement).disabled).toBe(false);
});

test("Borders: item and root classes merge rather than replace (Borders)", async () => {
  const screen = await render(
    <Accordion
      className="max-w-lg rounded-lg border"
      defaultValue={["billing"]}
    >
      <AccordionItem value="billing" className="border-b px-4 last:border-b-0">
        <AccordionTrigger>How does billing work?</AccordionTrigger>
        <AccordionContent>Monthly or annual.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  const root = slot("accordion", screen.container) as HTMLElement;
  expect(root.className).toContain("border");
  expect(root.className).toContain("flex");
  const item = slot("accordion-item", screen.container) as HTMLElement;
  expect(item.className).toContain("px-4");
  expect(item.className).toContain("last:border-b-0");
});

test("Card: the accordion renders and operates inside CardContent (Card)", async () => {
  const screen = await render(
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Subscription &amp; Billing</CardTitle>
        <CardDescription>Common questions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion defaultValue={["plans"]}>
          <AccordionItem value="plans">
            <AccordionTrigger>What plans do you offer?</AccordionTrigger>
            <AccordionContent>
              Starter, Professional, Enterprise.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cancel">
            <AccordionTrigger>How do I cancel?</AccordionTrigger>
            <AccordionContent>From your account settings.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>,
  );
  const accordion = slot("accordion", screen.container) as HTMLElement;
  expect(accordion.closest('[data-slot="card-content"]')).not.toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "How do I cancel?" }),
  );
  await expect
    .element(screen.getByText("From your account settings."))
    .toBeInTheDocument();
});

test("RTL: the trigger lays out from the inline start under rtl (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Subject className="max-w-md" />
      </div>
    </DirectionProvider>,
  );
  const trigger = slot("accordion-trigger", screen.container) as HTMLElement;
  expect(getComputedStyle(trigger).direction).toBe("rtl");
  // Logical utilities, not physical ones — this is what makes the chevron cross the panel with
  // the reading direction instead of staying pinned to the right.
  expect(trigger.className).toContain("text-start");
  expect(trigger.className).toContain("ms-auto");
  expect(trigger.className).not.toContain("text-left");
});

test("FOC-1/FOC-6: nothing rendered carries a focus glow or suppresses the outline", async () => {
  const screen = await render(<Subject />);
  await userEvent.click(screen.getByRole("button", { name: "Returns" }));
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("focus-visible:border-ring");
    expect(classes).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
    expect(classes).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  }
});

test("keyboard: Tab reaches every trigger and Enter toggles the focused one", async () => {
  const screen = await render(<Subject />);
  await userEvent.tab();
  expect(document.activeElement).toBe(
    nth("accordion-trigger", 0, screen.container),
  );
  await userEvent.tab();
  const second = nth("accordion-trigger", 1, screen.container);
  expect(document.activeElement).toBe(second);
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => second.getAttribute("aria-expanded")).toBe("true");
});

test("no a11y violations — one section open", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — every section closed", async () => {
  const screen = await render(
    <Accordion defaultValue={[]}>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Standard, express and overnight.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — several sections open", async () => {
  const screen = await render(
    <Subject multiple defaultValue={["shipping", "returns"]} />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — a disabled item", async () => {
  const screen = await render(
    <Accordion>
      <AccordionItem value="premium" disabled>
        <AccordionTrigger>Premium feature information</AccordionTrigger>
        <AccordionContent>Upgrade to read this.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  await expectNoA11yViolations(screen.container);
});
