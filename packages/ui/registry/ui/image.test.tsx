import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Image } from "./image";

// A 1×1 transparent PNG — a real, decodable data URL so onLoad fires deterministically.
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test("renders an img with the given src and alt", async () => {
  const screen = await render(<Image src={PIXEL} alt="A red dot" />);
  const img = screen.getByRole("img", { name: "A red dot" });
  await expect.element(img).toBeInTheDocument();
  await expect.element(img).toHaveAttribute("src", PIXEL);
});

test("applies aspectRatio + state data attributes on the frame", async () => {
  const screen = await render(
    <Image src={PIXEL} alt="x" aspectRatio="video" />,
  );
  const frame = screen.container.querySelector<HTMLElement>(
    '[data-slot="image"]',
  );
  expect(frame).not.toBeNull();
  expect(frame).toHaveAttribute("data-aspect-ratio", "video");
});

test("shows the fallback when the image fails to load", async () => {
  const screen = await render(
    <Image
      src="https://invalid.example.com/does-not-exist.png"
      alt="Broken"
      fallback="N/A"
    />,
  );
  // onError flips state → fallback renders, the <img> is removed.
  await expect.element(screen.getByText("N/A")).toBeInTheDocument();
});

test("shows the fallback when no src is provided", async () => {
  const screen = await render(<Image alt="Empty" fallback="No image" />);
  await expect.element(screen.getByText("No image")).toBeInTheDocument();
});

test('supports explicitly decorative images with alt=""', async () => {
  const screen = await render(<Image src={PIXEL} alt="" />);
  const img = screen.container.querySelector('img[data-slot="image-img"]');
  expect(img).not.toBeNull();
  expect(img).toHaveAttribute("alt", "");
});

test("forwards ref to the underlying img element", async () => {
  const ref = React.createRef<HTMLImageElement>();
  // The forwardRef target is the inner <img> (rendered while src is set and not errored).
  const screen = await render(<Image ref={ref} src={PIXEL} alt="Ref" />);
  await expect
    .element(screen.getByRole("img", { name: "Ref" }))
    .toBeInTheDocument();
  expect(ref.current).toBeInstanceOf(HTMLImageElement);
  expect(ref.current?.dataset.slot).toBe("image-img");
});

test("no a11y violations", async () => {
  const screen = await render(<Image src={PIXEL} alt="A labelled image" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — error (broken image fallback)", async () => {
  const screen = await render(
    <Image
      src="https://invalid.example.com/does-not-exist.png"
      alt="Broken"
      fallback="N/A"
    />,
  );
  await expect.element(screen.getByText("N/A")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});
