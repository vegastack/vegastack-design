"use client";

import type { ReactNode } from "react";
import { DotIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/breadcrumb` (dogfoods the registry) → auto-scanned.
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

/*
 * Upstream's own examples, adapted only for import paths and for `next/link` — which this docs app
 * does not route through — becoming a plain `<a href="#">`. `BreadcrumbLink` renders an `<a>` by
 * default and takes `render` for a routing library's link, so both spellings appear below exactly
 * as upstream spells them.
 */

/** Upstream's `BreadcrumbDemo`: a trail whose collapsed segment is a real dropdown trigger. */
export function breadcrumb(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="icon-sm" variant="ghost" />}
              >
                <BreadcrumbEllipsis />
                <span className="sr-only">Toggle menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>Themes</DropdownMenuItem>
                  <DropdownMenuItem>GitHub</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/** The composition tree, rendered: list → item/separator/item/separator/item. */
export function breadcrumbComposition(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/** Upstream's `BreadcrumbBasic`: `href` straight on `BreadcrumbLink`, no `render`. */
export function breadcrumbBasic(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/** Upstream's `BreadcrumbSeparatorDemo`: children replace the default chevron. */
export function breadcrumbCustomSeparator(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <DotIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <DotIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/** Upstream's `BreadcrumbDropdown`: a segment that is a menu rather than a link. */
export function breadcrumbDropdown(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <DotIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  // A11Y-2: upstream's example authors a raw <button> here, and one line of
                  // 14px text is a 20px pointer target. The invisible `::after` grows it on the
                  // block axis only — the same mechanism `BreadcrumbLink` itself carries — so the
                  // example keeps upstream's chrome and still clears the 24px floor.
                  <button className="relative flex items-center gap-1 after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']" />
                }
              >
                Components
                <ChevronDownIcon data-icon="inline-end" className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>Themes</DropdownMenuItem>
                  <DropdownMenuItem>GitHub</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <DotIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/** Upstream's `BreadcrumbEllipsisDemo`: the ellipsis standing in for hidden segments. */
export function breadcrumbCollapsed(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#" />}>Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/**
 * Upstream's `BreadcrumbLinkDemo`. Upstream composes `next/link` through `render`; this docs app
 * has no router, so the render target is a plain anchor — the point of the example is that the
 * element `BreadcrumbLink` renders is whatever `render` supplies.
 */
export function breadcrumbLinkComponent(): ReactNode {
  return (
    <Wrapper>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#link-component" />}>
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#link-component" />}>
              Components
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Wrapper>
  );
}

/**
 * Upstream's `BreadcrumbRtl`. Upstream drives it from its `language-selector` demo hook; here the
 * Arabic strings are inline and the direction comes from `DirectionProvider`, which is what Base UI
 * actually reads. The dropdown's popup portals out of the `dir="rtl"` subtree, so `align` flips to
 * `end` and `dir` travels with the content.
 */
export function breadcrumbRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <Breadcrumb dir="rtl">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<a href="#" />}>الرئيسية</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <DotIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    // A11Y-2: upstream's example authors a raw <button> here, and one line of
                    // 14px text is a 20px pointer target. The invisible `::after` grows it on the
                    // block axis only — the same mechanism `BreadcrumbLink` itself carries — so the
                    // example keeps upstream's chrome and still clears the 24px floor.
                    <button className="relative flex items-center gap-1 after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']" />
                  }
                >
                  المكونات
                  <ChevronDownIcon
                    data-icon="inline-end"
                    className="size-3.5"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" dir="rtl">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>التوثيق</DropdownMenuItem>
                    <DropdownMenuItem>السمات</DropdownMenuItem>
                    <DropdownMenuItem>جيت هاب</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <DotIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>مسار التنقل</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Wrapper>
    </DirectionProvider>
  );
}
