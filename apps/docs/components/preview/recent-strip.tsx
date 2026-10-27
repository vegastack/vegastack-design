"use client";

import * as React from "react";
import type { ReactNode } from "react";
import {
  FileText,
  Image as ImageIcon,
  ListTodo,
  Presentation,
  Table2,
  Video,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/recent-strip` (dogfoods the registry) → auto-scanned.
import {
  RecentStrip,
  type RecentStripItem,
} from "@/components/ui/recent-strip";

const RECENTS: RecentStripItem[] = [
  {
    href: "#chrome-walk",
    icon: <FileText />,
    title: "Chrome walk-through",
    meta: "Page · 12 min ago",
  },
  {
    href: "#fixtures",
    icon: <Table2 />,
    title: "QA fixtures",
    meta: "Table · 412 rows",
  },
  {
    href: "#long-doc",
    icon: <FileText />,
    title: "Quarterly planning notes for the lighting catalogue relaunch",
    meta: "Page · 2h ago",
  },
  {
    href: "#sample",
    icon: <ImageIcon />,
    title: "sample-001-picsum.jpg",
    meta: "Image · yesterday",
  },
  {
    href: "#task-72",
    icon: <ListTodo />,
    title: "#72 Fix the spec sheet export",
    meta: "Task · Mon",
  },
  {
    href: "#deck",
    icon: <Presentation />,
    title: "Launch deck",
    meta: "PowerPoint · 3 Oct",
  },
  {
    href: "#walkthrough",
    icon: <Video />,
    title: "Showroom walkthrough",
    meta: "Video · 1 Oct",
  },
];

/** Keeps the docs page where it is: the cards are `#` links in this preview. */
function PreviewLink(props: React.ComponentProps<"a">) {
  return <a {...props} onClick={(event) => event.preventDefault()} />;
}

/** The Library home's Recent row: six cards, a sideways scroll with edge fades past the frame. */
export function recentStrip(): ReactNode {
  return (
    <Wrapper className="block">
      <RecentStrip items={RECENTS} linkRender={<PreviewLink />} />
    </Wrapper>
  );
}

/** Home's "Jump back in": collapsible, and remembered by the host through `onOpenChange`. */
export function recentStripCollapsible(): ReactNode {
  const [open, setOpen] = React.useState(true);
  return (
    <Wrapper className="block">
      <RecentStrip
        label="Jump back in"
        collapsible
        open={open}
        onOpenChange={setOpen}
        items={RECENTS.slice(0, 4)}
        linkRender={<PreviewLink />}
      />
    </Wrapper>
  );
}

/** On a narrow strip — a phone — the cards become one line of chips. */
export function recentStripPhone(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto max-w-sm">
        <RecentStrip items={RECENTS} linkRender={<PreviewLink />} />
      </div>
    </Wrapper>
  );
}

/** Loading: skeleton cards of the same shape under the heading; empty: nothing, or `emptyState`. */
export function recentStripStates(): ReactNode {
  return (
    <Wrapper className="flex flex-col items-stretch gap-6">
      <RecentStrip loading />
      <RecentStrip
        label="Jump back in"
        items={[]}
        emptyState="Pages, tables and files you open show up here."
      />
    </Wrapper>
  );
}
