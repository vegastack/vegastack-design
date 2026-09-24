import * as React from "react";
import { render } from "vitest-browser-react";
import type { Locator } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "./a11y";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../registry/ui/field";

/** The props a wired control is rendered with; each suite forwards them to its control. */
export interface WiredControlProps {
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

type Screen = Awaited<ReturnType<typeof render>>;

/**
 * The API-26 / DS-47 contract, run against one control. Every control a `Field` wires — the
 * engine-backed ones that read Base UI's Field context themselves and the ones that render through
 * `Field.Control` — owes the same five behaviours (brief DS-47: "per control, the label binds;
 * description and error ids are in `aria-describedby` only while rendered; `aria-invalid` follows
 * `data-invalid`; explicit props override; outside a `Field` unchanged"), so they are written once
 * and each control's suite calls this with a render function and a locator.
 *
 * Explicit props: an explicit `id` wins outright; an explicit `aria-describedby` keeps its ids
 * FIRST and the Field's rendered message ids follow, de-duplicated — Base UI's own merge, which
 * the engine controls carry with no hunk (ruling recorded on Regent #137).
 */
export function fieldWiringTests({
  name,
  render: renderControl,
  find,
  supportsId = true,
  forwardsDescribedBy = true,
  idCheck = "label-for",
}: {
  /** Shown in the test titles. */
  name: string;
  /** Renders the control, forwarding the given props to its focusable element. */
  render: (props: WiredControlProps) => React.ReactNode;
  /** Locates the focusable element by its accessible name. */
  find: (screen: Screen, accessibleName: string) => Locator;
  /** Whether the control takes an explicit `id` (a Slider thumb, for one, is Base UI's). */
  supportsId?: boolean;
  /**
   * Whether an explicit `aria-describedby` reaches the focusable element. Base UI's Slider puts
   * root props on the root, not on the thumb's input, so it does not.
   */
  forwardsDescribedBy?: boolean;
  /**
   * Where the explicit id shows. A labelable control is named through the label's `for`, so the
   * id is checked there; a RadioGroup is a `role="radiogroup"` container Base UI names with
   * `aria-labelledby`, so its id is checked on the group itself.
   */
  idCheck?: "label-for" | "control";
}) {
  function Wired({
    invalid,
    description = true,
    error = true,
    controlProps = {},
  }: {
    invalid: boolean;
    description?: boolean;
    error?: boolean;
    controlProps?: WiredControlProps;
  }) {
    return (
      <Field data-invalid={invalid}>
        <FieldLabel>Wired control</FieldLabel>
        {renderControl(controlProps)}
        {description ? <FieldDescription>Helper text</FieldDescription> : null}
        <FieldError>{invalid && error ? "Error text" : null}</FieldError>
      </Field>
    );
  }

  const describedIds = (element: Element) =>
    (element.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);

  test(`API-26 (${name}): the label names it and the rendered messages describe it`, async () => {
    const screen = await render(<Wired invalid />);
    const control = find(screen, "Wired control");
    await expect.element(control).toHaveAttribute("aria-invalid", "true");
    await expect.element(control).toHaveAccessibleDescription(/Helper text/);
    await expect.element(control).toHaveAccessibleDescription(/Error text/);
  });

  test(`API-26 (${name}): message ids are described only while rendered, and aria-invalid follows data-invalid`, async () => {
    const screen = await render(<Wired invalid />);
    const control = find(screen, "Wired control");
    await expect.element(control).toBeInTheDocument();
    const description = screen.container.querySelector(
      '[data-slot="field-description"]',
    )!;
    const error = screen.container.querySelector('[data-slot="field-error"]')!;
    await expect
      .poll(() => describedIds(control.element()))
      .toEqual(expect.arrayContaining([description.id, error.id]));

    await screen.rerender(<Wired invalid={false} description={false} />);
    await expect.poll(() => describedIds(control.element())).toEqual([]);
    await expect
      .poll(() => control.element().getAttribute("aria-invalid"))
      .not.toBe("true");
  });

  test(`API-26 (${name}): explicit props override — the id wins, an explicit aria-describedby comes first`, async () => {
    const screen = await render(
      <>
        <p id="wired-external">External hint</p>
        <Wired
          invalid={false}
          error={false}
          controlProps={{
            ...(supportsId ? { id: "wired-explicit" } : {}),
            "aria-describedby": "wired-external",
          }}
        />
      </>,
    );
    const control = find(screen, "Wired control");
    await expect.element(control).toBeInTheDocument();
    if (supportsId && idCheck === "control") {
      await expect.element(control).toHaveAttribute("id", "wired-explicit");
    } else if (supportsId) {
      // The explicit id wins where Base UI labels the control — the focusable element itself, or
      // the hidden native input a Checkbox or Switch carries — and the label points at it.
      const label = screen.container.querySelector(
        '[data-slot="field-label"]',
      )!;
      await expect.poll(() => label.getAttribute("for")).toBe("wired-explicit");
      expect(document.getElementById("wired-explicit")).not.toBeNull();
    }
    const description = screen.container.querySelector(
      '[data-slot="field-description"]',
    )!;
    await expect
      .poll(() => describedIds(control.element()))
      .toEqual(
        forwardsDescribedBy
          ? ["wired-external", description.id]
          : [description.id],
      );
  });

  test(`API-26 (${name}): outside a Field it carries no Field wiring`, async () => {
    const screen = await render(
      <>{renderControl({ "aria-label": "Loose control" })}</>,
    );
    await expect.element(find(screen, "Loose control")).toBeInTheDocument();
    const control = find(screen, "Loose control").element();
    expect(control.hasAttribute("aria-describedby")).toBe(false);
    expect(control.getAttribute("aria-invalid")).not.toBe("true");
    expect(control.hasAttribute("aria-labelledby")).toBe(false);
  });

  test(`no a11y violations — ${name} wired by a Field, valid and invalid`, async () => {
    const valid = await render(<Wired invalid={false} />);
    await expect.element(find(valid, "Wired control")).toBeInTheDocument();
    await expectNoA11yViolations(valid.container);
    await valid.unmount();
    const invalid = await render(<Wired invalid />);
    await expect.element(find(invalid, "Wired control")).toBeInTheDocument();
    await expectNoA11yViolations(invalid.container);
  });
}
