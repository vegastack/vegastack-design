"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  DocumentLayout,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutContentsList,
  DocumentLayoutContentsRail,
  DocumentLayoutFoot,
  DocumentLayoutHeader,
  DocumentLayoutMargin,
  DocumentLayoutSkeleton,
} from "@/components/ui/document-layout";
import { MarkdownView } from "@/components/ui/markdown-view";

const PAGE = `Pricing for the annual plan is set per seat and billed once a year. Teams that grow during the term add seats at the same rate, prorated to the renewal date, and a team that shrinks keeps its seats until the term ends.

## Seats

Discounts apply from twenty seats. Every plan includes the same support, the same storage and the same security review, so the choice between plans is about the number of people, never about features.

## Renewal

- Annual plans renew on the same date each year
- Monthly plans can move to annual at any time

## Limits

Seats are capped at 500 per workspace; a larger organisation splits into workspaces.`;

const OUTLINE = ["Seats", "Renewal", "Limits"];

function Contents() {
  return (
    <DocumentLayoutContents>
      <DocumentLayoutContentsRail>
        <div aria-hidden className="flex flex-col gap-3 pt-3">
          {OUTLINE.map((item) => (
            <span key={item} className="h-0.5 w-3 rounded-full bg-border" />
          ))}
        </div>
      </DocumentLayoutContentsRail>
      <DocumentLayoutContentsList>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          On this page
        </p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {OUTLINE.map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </DocumentLayoutContentsList>
    </DocumentLayoutContents>
  );
}

function Header() {
  return (
    <DocumentLayoutHeader>
      <span aria-hidden className="text-4xl leading-none">
        📄
      </span>
      <h1 className="text-3xl font-semibold @min-[36rem]/document-layout:text-4xl">
        Pricing v2
      </h1>
      <p className="truncate text-sm text-muted-foreground">
        Updated 3m ago by Sanjay · 3 pages inside
      </p>
    </DocumentLayoutHeader>
  );
}

/**
 * A page read as a document, at the width the preview has: the contents list and the comment
 * margin beside the text when there is room for them (XL at 64rem), the rail and margin at L, the
 * rail alone at M, the text alone at S. Resize the window to watch the tiers.
 */
export function documentLayout(): ReactNode {
  return (
    <Wrapper className="block p-0 py-8">
      <DocumentLayout contents margin className="px-4 sm:px-8">
        <Header />
        <Contents />
        <DocumentLayoutBody>
          <MarkdownView typeScale="document" headingIds>
            {PAGE}
          </MarkdownView>
        </DocumentLayoutBody>
        <DocumentLayoutFoot>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Pages inside · 2</h2>
            <ul className="flex flex-col divide-y divide-border text-sm">
              <li className="py-2">Annual plan</li>
              <li className="py-2">Add-ons</li>
            </ul>
          </section>
        </DocumentLayoutFoot>
        <DocumentLayoutMargin>
          <div className="rounded-lg border border-border bg-card p-3 text-sm">
            <p className="font-medium">Priya · 2m</p>
            <p className="text-muted-foreground">
              Is the 20-seat discount right?
            </p>
          </div>
        </DocumentLayoutMargin>
      </DocumentLayout>
    </Wrapper>
  );
}

/** Wide: the text column grows into the room the window has, up to 60rem — each reader's choice. */
export function documentLayoutWide(): ReactNode {
  return (
    <Wrapper className="block p-0 py-8">
      <DocumentLayout measure="wide" className="px-4 sm:px-8">
        <Header />
        <DocumentLayoutBody>
          <MarkdownView typeScale="document">{PAGE}</MarkdownView>
        </DocumentLayoutBody>
      </DocumentLayout>
    </Wrapper>
  );
}

/** The loading state on the same grid and tier as the page, at the text's own line pitch. */
export function documentLayoutSkeleton(): ReactNode {
  return (
    <Wrapper className="block p-0 py-8">
      <DocumentLayoutSkeleton contents margin className="px-4 sm:px-8" />
    </Wrapper>
  );
}
