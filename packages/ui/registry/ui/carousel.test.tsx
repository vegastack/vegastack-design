import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
  type CarouselApi,
} from "./carousel";
import { DirectionProvider } from "./direction";

const SLIDES = [1, 2, 3, 4, 5];

/**
 * This lane compiles no Tailwind, so `basis-full`, `flex` and `overflow-hidden` are inert and Embla
 * measures a zero-width viewport. Every fixture therefore pins the geometry inline — the viewport
 * width, the track's flex direction and each slide's basis — so the engine has real numbers to snap
 * against and `canScrollNext` means what it says.
 */
function Slides({ count = SLIDES.length }: { count?: number }) {
  return (
    <CarouselContent style={{ display: "flex", flexDirection: "row" }}>
      {Array.from({ length: count }, (_, index) => (
        <CarouselItem
          key={index}
          style={{ flex: "0 0 100%", minWidth: 0, height: 80 }}
        >
          <div>{index + 1}</div>
        </CarouselItem>
      ))}
    </CarouselContent>
  );
}

function Subject({
  children,
  ...props
}: React.ComponentProps<typeof Carousel>) {
  return (
    <div style={{ width: 240, padding: 48 }}>
      <Carousel aria-label="Example gallery" {...props}>
        {children ?? (
          <>
            <Slides />
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </div>
  );
}

const viewport = (root: HTMLElement) =>
  root.querySelector('[data-slot="carousel-content"]') as HTMLElement;

/** Embla settles asynchronously; read the engine's own index rather than a wall-clock wait. */
async function expectSelected(api: CarouselApi, index: number) {
  await expect.poll(() => api?.selectedScrollSnap()).toBe(index);
}

test("renders the carousel region, its track and its slides (Usage)", async () => {
  const screen = await render(<Subject />);
  const root = screen.container.querySelector(
    '[data-slot="carousel"]',
  ) as HTMLElement;
  expect(root.getAttribute("role")).toBe("region");
  expect(root.getAttribute("aria-roledescription")).toBe("carousel");
  expect(viewport(root)).not.toBeNull();
  const slides = [
    ...root.querySelectorAll('[data-slot="carousel-item"]'),
  ] as HTMLElement[];
  expect(slides).toHaveLength(5);
  for (const slide of slides) {
    expect(slide.getAttribute("role")).toBe("group");
    expect(slide.getAttribute("aria-roledescription")).toBe("slide");
  }
});

test("every exported part renders and carries its data-slot (Usage)", async () => {
  const screen = await render(<Subject />);
  for (const name of [
    "carousel",
    "carousel-content",
    "carousel-item",
    "carousel-previous",
    "carousel-next",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${name}"]`),
      `missing data-slot="${name}"`,
    ).not.toBeNull();
  }
  await expect
    .element(screen.getByRole("button", { name: "Previous slide" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Next slide" }))
    .toBeInTheDocument();
});

test("the viewport wraps the track, and the arrows sit outside both (Composition)", async () => {
  const screen = await render(<Subject />);
  const root = screen.container.querySelector(
    '[data-slot="carousel"]',
  ) as HTMLElement;
  const scroller = viewport(root);
  expect(scroller.className).toContain("overflow-hidden");
  // The flex track is the viewport's own child; the slides hang off it.
  const track = scroller.firstElementChild as HTMLElement;
  expect(track.querySelectorAll('[data-slot="carousel-item"]').length).toBe(5);
  for (const name of ["carousel-previous", "carousel-next"]) {
    const arrow = root.querySelector(`[data-slot="${name}"]`) as HTMLElement;
    expect(scroller.contains(arrow)).toBe(false);
    expect(root.contains(arrow)).toBe(true);
  }
});

test("the next arrow scrolls the track and the previous arrow brings it back (Usage)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <Subject
      setApi={(value) => {
        api = value;
      }}
    />,
  );
  await expect.poll(() => api?.selectedScrollSnap()).toBe(0);
  await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
  await expectSelected(api!, 1);
  await userEvent.click(screen.getByRole("button", { name: "Previous slide" }));
  await expectSelected(api!, 0);
});

test("the arrows disable at the ends of a non-looping track (Usage)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <Subject
      setApi={(value) => {
        api = value;
      }}
    >
      <Slides count={2} />
      <CarouselPrevious />
      <CarouselNext />
    </Subject>,
  );
  const previous = screen.getByRole("button", { name: "Previous slide" });
  const next = screen.getByRole("button", { name: "Next slide" });
  // First slide: nowhere to go back to.
  await expect.element(previous).toBeDisabled();
  await expect.element(next).toBeEnabled();
  await userEvent.click(next);
  await expectSelected(api!, 1);
  await expect.element(previous).toBeEnabled();
  await expect.element(next).toBeDisabled();
});

test("arrow keys scroll the track from anywhere inside the carousel (Usage)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <Subject
      setApi={(value) => {
        api = value;
      }}
    />,
  );
  await expect.poll(() => api?.selectedScrollSnap()).toBe(0);
  const previous = screen
    .getByRole("button", { name: "Previous slide" })
    .element() as HTMLElement;
  previous.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expectSelected(api!, 1);
  await userEvent.keyboard("{ArrowLeft}");
  await expectSelected(api!, 0);
});

test("basis on the item is what puts more than one slide in view (Sizes)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <div style={{ width: 240, padding: 48 }}>
      <Carousel
        aria-label="Sized gallery"
        opts={{ align: "start" }}
        setApi={(value) => {
          api = value;
        }}
      >
        <CarouselContent style={{ display: "flex", flexDirection: "row" }}>
          {SLIDES.map((slide) => (
            <CarouselItem
              key={slide}
              style={{ flex: "0 0 50%", minWidth: 0, height: 80 }}
            >
              <div>{slide}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>,
  );
  // Two slides per view over five slides is four snap points, not five.
  await expect.poll(() => api?.scrollSnapList().length).toBe(4);
  const slides = [
    ...screen.container.querySelectorAll('[data-slot="carousel-item"]'),
  ] as HTMLElement[];
  expect(slides).toHaveLength(5);
  expect(slides[0]!.getBoundingClientRect().width).toBeCloseTo(
    slides[1]!.getBoundingClientRect().width,
    1,
  );
});

test("the item owns the inline padding the content's negative margin cancels (Spacing)", async () => {
  const screen = await render(<Subject />);
  const track = viewport(
    screen.container.querySelector('[data-slot="carousel"]') as HTMLElement,
  ).firstElementChild as HTMLElement;
  // Horizontal: the track pulls back on the inline start, each slide pads it out again.
  expect(track.className).toContain("-ms-4");
  const slide = track.querySelector(
    '[data-slot="carousel-item"]',
  ) as HTMLElement;
  expect(slide.className).toContain("ps-4");
  expect(slide.className).toContain("min-w-0");
});

test("orientation=vertical swaps the axis, the spacing and the arrow rotation (Orientation)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <div style={{ width: 240, padding: 48 }}>
      <Carousel
        aria-label="Vertical gallery"
        orientation="vertical"
        setApi={(value) => {
          api = value;
        }}
      >
        <CarouselContent
          style={{ display: "flex", flexDirection: "column", height: 160 }}
        >
          {SLIDES.map((slide) => (
            <CarouselItem
              key={slide}
              style={{ flex: "0 0 100%", minHeight: 0 }}
            >
              <div>{slide}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>,
  );
  const root = screen.container.querySelector(
    '[data-slot="carousel"]',
  ) as HTMLElement;
  const track = viewport(root).firstElementChild as HTMLElement;
  // The vertical spacing pair, not the horizontal one.
  expect(track.className).toContain("flex-col");
  expect(track.className).toContain("-mt-4");
  expect(track.className).not.toContain("-ms-4");
  const slide = track.querySelector(
    '[data-slot="carousel-item"]',
  ) as HTMLElement;
  expect(slide.className).toContain("pt-4");
  // Both arrows rotate onto the vertical edges.
  for (const name of ["carousel-previous", "carousel-next"]) {
    expect(
      (root.querySelector(`[data-slot="${name}"]`) as HTMLElement).className,
    ).toContain("rotate-90");
  }
  // And the engine really moved onto the y axis: slides stack, so scrolling changes `top`.
  const before = slide.getBoundingClientRect().top;
  api!.scrollNext();
  await expect.poll(() => slide.getBoundingClientRect().top).not.toBe(before);
});

test("opts reaches the engine — loop removes the end stops (Options)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <Subject
      opts={{ loop: true }}
      setApi={(value) => {
        api = value;
      }}
    >
      <Slides count={3} />
      <CarouselPrevious />
      <CarouselNext />
    </Subject>,
  );
  await expect.poll(() => api?.selectedScrollSnap()).toBe(0);
  // With a loop the first slide still has somewhere to go back to, so neither arrow disables.
  await expect
    .element(screen.getByRole("button", { name: "Previous slide" }))
    .toBeEnabled();
  await userEvent.click(screen.getByRole("button", { name: "Previous slide" }));
  await expectSelected(api!, 2);
});

test("setApi hands out the Embla instance (API)", async () => {
  let api: CarouselApi;
  await render(
    <Subject
      setApi={(value) => {
        api = value;
      }}
    />,
  );
  await expect.poll(() => api).toBeTruthy();
  expect(api!.scrollSnapList()).toHaveLength(5);
  expect(api!.selectedScrollSnap()).toBe(0);
  expect(typeof api!.scrollTo).toBe("function");
  api!.scrollTo(3);
  await expectSelected(api!, 3);
});

test("the instance emits select when the settled slide changes (Events)", async () => {
  let api: CarouselApi;
  const seen: number[] = [];
  const screen = await render(
    <Subject
      setApi={(value) => {
        api = value;
      }}
    />,
  );
  await expect.poll(() => api).toBeTruthy();
  const onSelect = () => seen.push(api!.selectedScrollSnap());
  api!.on("select", onSelect);
  await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
  await expect.poll(() => seen).toEqual([1]);
  // `off` really detaches: a second move adds nothing.
  api!.off("select", onSelect);
  await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
  await expectSelected(api!, 2);
  expect(seen).toEqual([1]);
});

test("plugins receive the engine instance and are torn down with it (Plugins)", async () => {
  const calls: string[] = [];
  let reported = -1;
  function reporter() {
    let detach: (() => void) | undefined;
    return {
      name: "reporter",
      options: {},
      init(embla: NonNullable<CarouselApi>) {
        calls.push("init");
        const emit = () => {
          reported = embla.selectedScrollSnap();
        };
        emit();
        embla.on("select", emit);
        detach = () => embla.off("select", emit);
      },
      destroy() {
        calls.push("destroy");
        detach?.();
      },
    };
  }
  const plugin = reporter();
  const screen = await render(<Subject plugins={[plugin]} />);
  // `init` runs once, with the engine, at mount.
  await expect.poll(() => calls).toEqual(["init"]);
  expect(reported).toBe(0);
  // The plugin's own subscription tracks the engine.
  await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
  await expect.poll(() => reported).toBe(1);
  // And Embla tears it down when the carousel unmounts.
  await screen.unmount();
  await expect.poll(() => calls).toEqual(["init", "destroy"]);
});

test("useCarousel exposes the same state the arrows read (API)", async () => {
  function Counter() {
    const { api, canScrollPrev, canScrollNext, orientation, scrollNext } =
      useCarousel();
    return (
      <div>
        <span data-testid="state">
          {orientation}:{String(canScrollPrev)}:{String(canScrollNext)}:
          {api ? api.scrollSnapList().length : 0}
        </span>
        <button type="button" onClick={scrollNext}>
          Advance
        </button>
      </div>
    );
  }
  const screen = await render(
    <Subject>
      <Slides count={2} />
      <Counter />
    </Subject>,
  );
  await expect
    .element(screen.getByTestId("state"))
    .toHaveTextContent("horizontal:false:true:2");
  await userEvent.click(screen.getByRole("button", { name: "Advance" }));
  await expect
    .element(screen.getByTestId("state"))
    .toHaveTextContent("horizontal:true:false:2");
});

test("useCarousel outside a Carousel is an error, not a silent no-op", async () => {
  function Orphan() {
    useCarousel();
    return null;
  }
  await expect(render(<Orphan />)).rejects.toThrow(
    /useCarousel must be used within a <Carousel \/>/,
  );
});

test("RTL: dir plus the direction option move the track the other way (RTL)", async () => {
  let api: CarouselApi;
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl" style={{ width: 240, padding: 48 }}>
        <Carousel
          aria-label="RTL gallery"
          dir="rtl"
          opts={{ direction: "rtl" }}
          setApi={(value) => {
            api = value;
          }}
        >
          <Slides />
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </DirectionProvider>,
  );
  const root = screen.container.querySelector(
    '[data-slot="carousel"]',
  ) as HTMLElement;
  expect(getComputedStyle(root).direction).toBe("rtl");
  const slide = root.querySelector(
    '[data-slot="carousel-item"]',
  ) as HTMLElement;
  const before = slide.getBoundingClientRect().left;
  await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
  await expectSelected(api!, 1);
  // Advancing moves the first slide to the RIGHT under RTL — the engine's own direction, not just
  // a mirrored layout. Without `opts.direction` it would move left.
  await expect
    .poll(() => slide.getBoundingClientRect().left)
    .toBeGreaterThan(before);
  // And the arrow glyphs are mirrored by the cascade, not by a second icon.
  for (const name of ["carousel-previous", "carousel-next"]) {
    const arrow = root.querySelector(`[data-slot="${name}"]`) as HTMLElement;
    expect(arrow.querySelector("svg")?.getAttribute("class")).toContain(
      "rtl:rotate-180",
    );
  }
});

/**
 * `carousel.patch` declares NO STYLING HUNK: focus, cursor and disabled behaviour come from
 * `Button`, and the track has no focus affordance of its own. That claim is only durable if
 * something observes it.
 */
test("no focus glow and no outline suppression anywhere in the carousel", async () => {
  const screen = await render(<Subject />);
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/\boutline-none\b|\boutline-hidden\b/);
  }
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — an arrow disabled at the end of the track", async () => {
  const screen = await render(
    <Subject>
      <Slides count={2} />
      <CarouselPrevious />
      <CarouselNext />
    </Subject>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Previous slide" }))
    .toBeDisabled();
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — vertical", async () => {
  const screen = await render(
    <div style={{ width: 240, padding: 48 }}>
      <Carousel aria-label="Vertical gallery" orientation="vertical">
        <CarouselContent
          style={{ display: "flex", flexDirection: "column", height: 160 }}
        >
          {SLIDES.map((slide) => (
            <CarouselItem
              key={slide}
              style={{ flex: "0 0 100%", minHeight: 0 }}
            >
              <div>{slide}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl" style={{ width: 240, padding: 48 }}>
        <Carousel
          aria-label="RTL gallery"
          dir="rtl"
          opts={{ direction: "rtl" }}
        >
          <Slides />
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});
