"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { ListTree, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DocumentLayout,
  DocumentLayoutAside,
  DocumentLayoutBlock,
  DocumentLayoutBlockAction,
  DocumentLayoutBlockFooter,
  DocumentLayoutBlockHeader,
  DocumentLayoutBlockRow,
  DocumentLayoutBlockRowMain,
  DocumentLayoutBlockRowMeta,
  DocumentLayoutBlockRowRef,
  DocumentLayoutBlockRows,
  DocumentLayoutBlockTable,
  DocumentLayoutBlockTableBody,
  DocumentLayoutBlockTableCell,
  DocumentLayoutBlockTableColumn,
  DocumentLayoutBlockTableHead,
  DocumentLayoutBlockTableRow,
  DocumentLayoutBlockTitle,
  DocumentLayoutPageItem,
  DocumentLayoutPageLink,
  DocumentLayoutPageList,
  DocumentLayoutSection,
  DocumentLayoutSectionButton,
  DocumentLayoutSectionHeader,
  DocumentLayoutSectionTitle,
  DocumentLayoutBody,
  DocumentLayoutContents,
  DocumentLayoutFoot,
  DocumentLayoutHeader,
  DocumentLayoutIcon,
  DocumentLayoutMargin,
  DocumentLayoutSkeleton,
  DocumentLayoutTitle,
  DocumentLayoutTitleGroup,
} from "@/components/ui/document-layout";
import { MarkdownView } from "@/components/ui/markdown-view";
import { TableOfContents } from "@/components/ui/table-of-contents";

const PAGE = `Pricing for the annual plan is set per seat and billed once a year. Teams that grow during the term add seats at the same rate, prorated to the renewal date, and a team that shrinks keeps its seats until the term ends.

## Seats

Discounts apply from twenty seats. Every plan includes the same support, the same storage and the same security review, so the choice between plans is about the number of people, never about features.

## Renewal

- Annual plans renew on the same date each year
- Monthly plans can move to annual at any time

## Limits

Seats are capped at 500 per workspace; a larger organisation splits into workspaces.`;

const OUTLINE = ["Seats", "Renewal", "Limits"].map((text) => ({
  id: text.toLowerCase(),
  level: 2,
  text,
}));

/** The contents rail in the gutter before the text: it opens into the list on hover or focus. */
function Contents() {
  return (
    <DocumentLayoutContents>
      <TableOfContents
        variant="rail"
        side="start"
        sticky={false}
        items={OUTLINE}
      />
    </DocumentLayoutContents>
  );
}

function Header() {
  return (
    <DocumentLayoutHeader>
      <DocumentLayoutTitleGroup>
        <DocumentLayoutIcon>
          <span aria-hidden>📄</span>
        </DocumentLayoutIcon>
        <DocumentLayoutTitle>Pricing v2</DocumentLayoutTitle>
      </DocumentLayoutTitleGroup>
      <p className="truncate text-sm text-muted-foreground">
        Updated 3m ago by Sanjay · 3 pages inside
      </p>
    </DocumentLayoutHeader>
  );
}

/**
 * A page read as a document, at the width the preview has: the comment margin after the text
 * from L (60rem), the contents rail in the gutter before it from M (40rem) — the gutter is kept
 * either way, so the text never moves for it — and the text alone at S. Resize the window to
 * watch the tiers.
 */
export function documentLayout(): ReactNode {
  return (
    <Wrapper className="block p-0 py-8">
      <DocumentLayout margin className="px-4 sm:px-8">
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

/** Wide: the text column fills the width less the gutters and the margin — each reader's choice. */
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

function Thread({ who, text }: { who: string; text: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <p className="font-medium">{who}</p>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

/**
 * The aside: the discussion rail or the pinned outline in the track the layout keeps for it, so
 * the text never moves when it opens. Below L the discussion is a bottom sheet; the outline pins
 * from XL (the hover rail stays below it). The preview holds the L tier at least.
 */
export function documentLayoutAside(): ReactNode {
  return <DocumentLayoutAsideExample />;
}

function DocumentLayoutAsideExample() {
  const [aside, setAside] = React.useState<"discussion" | "outline" | null>(
    "discussion",
  );
  return (
    <Wrapper className="block p-0 py-8">
      <div className="flex justify-end px-4 pb-4 sm:px-8">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Aside"
          value={[aside ?? "none"]}
          onValueChange={(keys: string[]) => {
            const next = keys[0];
            setAside(next === "discussion" || next === "outline" ? next : null);
          }}
        >
          <ToggleGroupItem value="none">Closed</ToggleGroupItem>
          <ToggleGroupItem value="discussion">
            <MessageSquare aria-hidden />
            Discussion
          </ToggleGroupItem>
          <ToggleGroupItem value="outline">
            <ListTree aria-hidden />
            Outline
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {/* At least the L tier (64rem), scrolling sideways in a narrow column, so the rail shows
          inline here; below L a page shows the discussion as a bottom sheet. */}
      <div className="overflow-x-auto px-4 sm:px-8">
        <DocumentLayout aside={aside} className="min-w-[64rem]">
          <Header />
          <Contents />
          <DocumentLayoutBody>
            <MarkdownView typeScale="document" headingIds>
              {PAGE}
            </MarkdownView>
          </DocumentLayoutBody>
          <DocumentLayoutAside
            count={2}
            onClose={() => setAside(null)}
            tabs={[
              {
                value: "open",
                label: "Open",
                count: 2,
                content: (
                  <div className="flex flex-col gap-3">
                    <Thread
                      who="Priya · 2m"
                      text="Is the 20-seat discount right?"
                    />
                    <Thread
                      who="Sanjay · 1h"
                      text="Link the renewal policy here."
                    />
                  </div>
                ),
              },
              {
                value: "resolved",
                label: "Resolved",
                content: (
                  <Thread who="Asha · 3d" text="Typo in the title — fixed." />
                ),
              },
              {
                value: "page",
                label: "Page",
                content: (
                  <Thread who="Meera · 1d" text="Ready for review on Friday." />
                ),
              },
            ]}
          />
          <DocumentLayoutAside kind="outline" onClose={() => setAside(null)}>
            <TableOfContents variant="list" sticky={false} items={OUTLINE} />
          </DocumentLayoutAside>
        </DocumentLayout>
      </div>
    </Wrapper>
  );
}

/** The loading state on the same grid and tier as the page, at the text's own line pitch. */
export function documentLayoutSkeleton(): ReactNode {
  return (
    <Wrapper className="block p-0 py-8">
      <DocumentLayoutSkeleton margin icon className="px-4 sm:px-8" />
    </Wrapper>
  );
}

/** What a document holds besides its prose: a live block in the text and its pages at the foot. */
export function documentLayoutSections(): ReactNode {
  return (
    <Wrapper className="block p-0 py-8">
      <DocumentLayout className="px-4 sm:px-8">
        <Header />
        <DocumentLayoutBody>
          <DocumentLayoutBlock>
            <DocumentLayoutBlockHeader>
              <DocumentLayoutBlockTitle>
                Open tasks · this page
              </DocumentLayoutBlockTitle>
              <Button variant="ghost" size="sm">
                Filter
              </Button>
            </DocumentLayoutBlockHeader>
            <DocumentLayoutBlockRows aria-label="Tasks">
              <DocumentLayoutBlockRow>
                <DocumentLayoutBlockRowMain>
                  <DocumentLayoutBlockRowRef>T-12</DocumentLayoutBlockRowRef>
                  Order the seat licences
                </DocumentLayoutBlockRowMain>
                <DocumentLayoutBlockRowMeta>
                  due Oct 24
                </DocumentLayoutBlockRowMeta>
              </DocumentLayoutBlockRow>
              <DocumentLayoutBlockRow>
                <DocumentLayoutBlockRowMain>
                  <DocumentLayoutBlockRowRef>T-14</DocumentLayoutBlockRowRef>
                  Send the renewal dates to finance
                </DocumentLayoutBlockRowMain>
                <DocumentLayoutBlockRowMeta>
                  due Oct 30
                </DocumentLayoutBlockRowMeta>
              </DocumentLayoutBlockRow>
            </DocumentLayoutBlockRows>
            <DocumentLayoutBlockFooter>
              <DocumentLayoutBlockAction>
                Open in Tasks →
              </DocumentLayoutBlockAction>
            </DocumentLayoutBlockFooter>
          </DocumentLayoutBlock>
          <DocumentLayoutBlock>
            <DocumentLayoutBlockHeader>
              <DocumentLayoutBlockTitle>
                Sample requests · SR
              </DocumentLayoutBlockTitle>
            </DocumentLayoutBlockHeader>
            <DocumentLayoutBlockTable columns={3} aria-label="Sample requests">
              <DocumentLayoutBlockTableHead>
                <DocumentLayoutBlockTableRow>
                  <DocumentLayoutBlockTableColumn primary>
                    Name
                  </DocumentLayoutBlockTableColumn>
                  <DocumentLayoutBlockTableColumn>
                    Status
                  </DocumentLayoutBlockTableColumn>
                  <DocumentLayoutBlockTableColumn>
                    Qty
                  </DocumentLayoutBlockTableColumn>
                </DocumentLayoutBlockTableRow>
              </DocumentLayoutBlockTableHead>
              <DocumentLayoutBlockTableBody>
                {[
                  ["Lux survey for the atrium refit", "Requested", "12"],
                  ["Sample of the linear pendant", "Sent", "3"],
                ].map(([name, status, qty]) => (
                  <DocumentLayoutBlockTableRow key={name}>
                    <DocumentLayoutBlockTableCell primary>
                      <span className="truncate">{name}</span>
                    </DocumentLayoutBlockTableCell>
                    <DocumentLayoutBlockTableCell>
                      {status}
                    </DocumentLayoutBlockTableCell>
                    <DocumentLayoutBlockTableCell>
                      {qty}
                    </DocumentLayoutBlockTableCell>
                  </DocumentLayoutBlockTableRow>
                ))}
              </DocumentLayoutBlockTableBody>
            </DocumentLayoutBlockTable>
            <DocumentLayoutBlockFooter>
              <DocumentLayoutBlockAction>
                Open in table →
              </DocumentLayoutBlockAction>
            </DocumentLayoutBlockFooter>
          </DocumentLayoutBlock>
        </DocumentLayoutBody>
        <DocumentLayoutFoot>
          <DocumentLayoutSection>
            <DocumentLayoutSectionHeader>
              <DocumentLayoutSectionTitle count={2}>
                Pages inside
              </DocumentLayoutSectionTitle>
              <Button variant="ghost" size="sm">
                <Plus aria-hidden />
                Add page
              </Button>
            </DocumentLayoutSectionHeader>
            <DocumentLayoutPageList>
              <DocumentLayoutPageItem>
                <DocumentLayoutPageLink
                  icon="💺"
                  title="Seat pricing"
                  excerpt="Discounts apply from twenty seats."
                  meta="2h ago"
                  render={<a href="#seat-pricing" />}
                />
              </DocumentLayoutPageItem>
              <DocumentLayoutPageItem>
                <DocumentLayoutPageLink
                  title="Renewal calendar"
                  excerpt="Annual plans renew on the same date each year."
                  meta="Yesterday"
                  render={<a href="#renewal-calendar" />}
                />
              </DocumentLayoutPageItem>
            </DocumentLayoutPageList>
            <DocumentLayoutSectionButton>
              Show more pages
            </DocumentLayoutSectionButton>
          </DocumentLayoutSection>
        </DocumentLayoutFoot>
      </DocumentLayout>
    </Wrapper>
  );
}
