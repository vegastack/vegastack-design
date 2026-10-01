"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { CircleDot } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/inline-chip` (dogfoods the registry) → auto-scanned.
import {
  InlineChip,
  InlineChipPreview,
  InlineChipProvider,
  type InlineChipResolver,
} from "@/components/ui/inline-chip";
import { MarkdownView } from "@/components/ui/markdown-view";

const PEOPLE: Record<string, { name: string; email: string; image?: string }> =
  {
    u1: { name: "Asha Rao", email: "asha@acme.com" },
    u2: { name: "Ben Okafor", email: "ben@acme.com" },
  };

const resolver: InlineChipResolver = {
  href: (kind, id) => `#${kind}-${id}`,
  person: (id) => PEOPLE[id],
  preview: (kind, id) =>
    kind === "task" ? (
      <InlineChipPreview
        title="Ship the onboarding checklist"
        meta={
          <>
            <CircleDot className="text-tag-yellow-text" /> In progress · {id}
          </>
        }
      />
    ) : null,
  onOpen: (target) => {
    if (target.kind !== "file") return false;
    window.alert(`Open ${target.label} in the file viewer`);
  },
};

/** Every kind, in a sentence. */
export function inlineChip(): ReactNode {
  return (
    <Wrapper className="block text-sm leading-7">
      <InlineChipProvider value={resolver}>
        <p>
          <InlineChip kind="user" targetId="u1" label="Asha Rao" /> moved{" "}
          <InlineChip
            kind="task"
            targetId="T-42"
            label="Ship the onboarding checklist"
          />{" "}
          to review, linked{" "}
          <InlineChip kind="page" targetId="p1" label="Q3 plan" /> and{" "}
          <InlineChip
            kind="file"
            label="spec.pdf"
            contentType="application/pdf"
            href="#spec.pdf"
          />
          , and booked{" "}
          <InlineChip kind="meeting" targetId="m1" label="Kick-off with Acme" />{" "}
          for <InlineChip kind="customer" targetId="c1" label="Acme Corp" />{" "}
          under{" "}
          <InlineChip kind="project" targetId="pr1" label="Website relaunch" />.
        </p>
      </InlineChipProvider>
    </Wrapper>
  );
}

/** In headings, lists and a wrapping line: the chip takes the text's size and baseline. */
export function inlineChipContexts(): ReactNode {
  return (
    <Wrapper className="block space-y-3">
      <InlineChipProvider value={resolver}>
        <h3 className="text-xl font-medium">
          Notes on{" "}
          <InlineChip kind="project" targetId="pr1" label="Website relaunch" />
        </h3>
        <ul className="list-disc ps-5 text-sm leading-7">
          <li>
            Owner <InlineChip kind="user" targetId="u2" label="Ben Okafor" />
          </li>
          <li>
            Blocked by{" "}
            <InlineChip kind="task" targetId="T-7" label="Pick the CMS" />
          </li>
        </ul>
        <p className="max-w-56 text-sm leading-7">
          A long chip wraps with its line:{" "}
          <InlineChip
            kind="page"
            targetId="p2"
            label="Customer onboarding handbook, second edition"
          />{" "}
          and the text carries on.
        </p>
      </InlineChipProvider>
    </Wrapper>
  );
}

/** A person with a photo; a restricted target. */
export function inlineChipStates(): ReactNode {
  return (
    <Wrapper className="block text-sm leading-7">
      <p>
        <InlineChip
          kind="user"
          label="Asha Rao"
          person={{
            name: "Asha Rao",
            email: "asha@acme.com",
            image: "/preview/avatar-1.svg",
          }}
        />{" "}
        shared{" "}
        <InlineChip kind="page" targetId="restricted:p9" label="Private page" />{" "}
        — a page you cannot open.
      </p>
    </Wrapper>
  );
}

/** Mentions and file links in Markdown render as the same chip. */
export function inlineChipMarkdown(): ReactNode {
  return (
    <Wrapper className="block">
      <InlineChipProvider value={resolver}>
        <MarkdownView
          content={
            "## Review with [@Asha Rao](mention://user/u1)\n\n- Close [@Ship the onboarding checklist](mention://task/T-42) before [@Kick-off with Acme](mention://meeting/m1)\n- Read [spec.pdf](/api/files/f1) and [@Q3 plan](mention://page/p1)"
          }
        />
      </InlineChipProvider>
    </Wrapper>
  );
}
