"use client";

import * as React from "react";
import type { ComponentProps, ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/carousel` (dogfoods the registry) → auto-scanned.
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { DirectionProvider } from "@/components/ui/direction";

/*
 * Upstream's own examples, adapted only for import paths. Two standing constraints shape them:
 *
 *   - The arrows sit OUTSIDE the track (`-start-12` / `-end-12`), so every fixture gives the
 *     wrapper horizontal room for them. That is layout around the component, never a restyle of it.
 *   - The geometry lane mounts all of these, so nothing here uses a timer, a random value or the
 *     network — including the Plugins fixture, which is why it does not autoplay.
 */

const SLIDES = [1, 2, 3, 4, 5];

/** Upstream's `CarouselDemo`: five square slides, one at a time. */
export function carousel(): ReactNode {
  return (
    <Wrapper className="px-16">
      <Carousel className="w-full max-w-[12rem] sm:max-w-xs">
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/**
 * The engine, visible. Embla owns the snapping, the drag and the momentum, and it is what tells the
 * arrows whether there is anywhere left to go — this carousel starts on slide one, so the previous
 * arrow is disabled until the track moves.
 */
export function carouselAbout(): ReactNode {
  return (
    <Wrapper className="px-16">
      <Carousel className="w-full max-w-[12rem] sm:max-w-xs">
        <CarouselContent>
          {[1, 2, 3].map((slide) => (
            <CarouselItem key={slide}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/** The composition tree, rendered: content wraps the items, the two arrows sit beside them. */
export function carouselComposition(): ReactNode {
  return (
    <Wrapper className="px-16">
      <Carousel className="w-full max-w-[12rem] sm:max-w-xs">
        <CarouselContent>
          {[1, 2].map((slide) => (
            <CarouselItem key={slide}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/** Upstream's `CarouselSize`: `basis-*` on the item decides how many slides are in view. */
export function carouselSizes(): ReactNode {
  return (
    <Wrapper className="px-16">
      <Carousel
        opts={{ align: "start" }}
        className="w-full max-w-[12rem] sm:max-w-xs md:max-w-sm"
      >
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide} className="basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/** Upstream's `CarouselSpacing`: a negative margin on the content, matching padding on the item. */
export function carouselSpacing(): ReactNode {
  return (
    <Wrapper className="px-16">
      <Carousel className="w-full max-w-[12rem] sm:max-w-xs md:max-w-sm">
        <CarouselContent className="-ml-1">
          {SLIDES.map((slide) => (
            <CarouselItem key={slide} className="basis-1/2 pl-1 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-2xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/** Upstream's `CarouselOrientation`: the track runs down the page and the arrows rotate with it. */
export function carouselOrientation(): ReactNode {
  return (
    <Wrapper className="min-h-[26rem] py-16">
      <Carousel
        opts={{ align: "start" }}
        orientation="vertical"
        className="w-full max-w-xs"
      >
        <CarouselContent className="-mt-1 h-[270px]">
          {SLIDES.map((slide) => (
            <CarouselItem key={slide} className="basis-1/2 pt-1">
              <div className="p-1">
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/**
 * `opts` is handed straight to Embla. `loop: true` is the visible one: the track wraps, so neither
 * arrow ever disables, and `align: "start"` puts the leading edge of a slide at the leading edge of
 * the viewport.
 */
export function carouselOptions(): ReactNode {
  return (
    <Wrapper className="px-16">
      <Carousel
        opts={{ align: "start", loop: true }}
        className="w-full max-w-[12rem] sm:max-w-xs"
      >
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </Wrapper>
  );
}

/** Upstream's `CarouselDApiDemo`: `setApi` hands you the Embla instance to read from. */
export function carouselApi(): ReactNode {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <Wrapper className="flex-col px-16">
      <Carousel setApi={setApi} className="w-full max-w-[10rem] sm:max-w-xs">
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide}>
              <Card className="m-px">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{slide}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">
        Slide {current} of {count}
      </div>
    </Wrapper>
  );
}

/**
 * The same `setApi` handle, used for its events rather than its getters. `select` fires whenever the
 * settled slide changes — from an arrow, a drag, a keypress or a programmatic `scrollTo`.
 */
export function carouselEvents(): ReactNode {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selections, setSelections] = React.useState(0);
  const [settled, setSettled] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelections((value) => value + 1);
    const onSettle = () => setSettled((value) => value + 1);
    api.on("select", onSelect);
    api.on("settle", onSettle);
    return () => {
      api.off("select", onSelect);
      api.off("settle", onSettle);
    };
  }, [api]);

  return (
    <Wrapper className="flex-col px-16">
      <Carousel setApi={setApi} className="w-full max-w-[10rem] sm:max-w-xs">
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide}>
              <Card className="m-px">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{slide}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">
        select fired {selections}× · settle fired {settled}×
      </div>
    </Wrapper>
  );
}

/**
 * The plugin protocol, without a plugin package. `plugins` takes anything shaped like an Embla
 * plugin — a `name`, an `options` bag, an `init(embla)` and a `destroy()` — and the carousel hands
 * it the engine instance. The published plugin a consumer would reach for first is
 * `embla-carousel-autoplay`; it is deliberately NOT installed here, because these fixtures are
 * mounted by the geometry lane and a timer would make that lane non-deterministic. So this one
 * reports the engine's own state instead of driving it.
 */
type CarouselPlugin = NonNullable<
  ComponentProps<typeof Carousel>["plugins"]
>[number];

function slideReporter(
  report: (index: number, count: number) => void,
): CarouselPlugin {
  let detach: (() => void) | undefined;
  return {
    name: "slideReporter",
    options: {},
    init(embla) {
      const emit = () =>
        report(embla.selectedScrollSnap() + 1, embla.scrollSnapList().length);
      emit();
      embla.on("select", emit);
      embla.on("reInit", emit);
      detach = () => {
        embla.off("select", emit);
        embla.off("reInit", emit);
      };
    },
    destroy() {
      detach?.();
      detach = undefined;
    },
  };
}

export function carouselPlugins(): ReactNode {
  const [position, setPosition] = React.useState({ index: 0, count: 0 });
  // One plugin instance for the life of the component, exactly as upstream keeps `Autoplay()` in a
  // ref — re-creating it on every render would tear the engine down and rebuild it.
  const plugin = React.useRef(
    slideReporter((index, count) => setPosition({ index, count })),
  );

  return (
    <Wrapper className="flex-col px-16">
      <Carousel
        plugins={[plugin.current]}
        className="w-full max-w-[10rem] sm:max-w-xs"
      >
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{slide}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">
        The plugin reports: slide {position.index} of {position.count}
      </div>
    </Wrapper>
  );
}

/** Eastern Arabic numerals, so the RTL fixture reads as a localised carousel rather than a mirrored one. */
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabicNumerals = (value: number) =>
  String(value)
    .split("")
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join("");

/**
 * Upstream's `CarouselRtl`. The `direction` option is the load-bearing part: `dir` alone mirrors the
 * layout, but Embla still scrolls left-to-right until its own option matches, so the two must be set
 * together.
 */
export function carouselRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper className="px-16" dir="rtl">
        <Carousel
          dir="rtl"
          className="w-full max-w-[12rem] sm:max-w-xs"
          opts={{ direction: "rtl" }}
        >
          <CarouselContent>
            {SLIDES.map((slide) => (
              <CarouselItem key={slide}>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-6">
                      <span className="text-4xl font-semibold">
                        {toArabicNumerals(slide)}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Wrapper>
    </DirectionProvider>
  );
}
