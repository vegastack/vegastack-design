"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  ReactionAdd,
  Reactions,
  toggleReaction,
  type ReactionData,
} from "@/components/ui/reactions";

const ME = { id: "asha", name: "Asha Rao" };
const PEOPLE = [
  { id: "neha", name: "Neha Kapoor" },
  { id: "arjun", name: "Arjun Mehta" },
  { id: "priya", name: "Priya Nair", inactive: true },
  { id: "ravi", name: "Ravi Iyer" },
  { id: "meera", name: "Meera Shah" },
];

const SAMPLE: ReactionData[] = [
  { emoji: "👍", count: 5, reacted: false, users: PEOPLE },
  { emoji: "🎉", count: 2, reacted: true, users: [ME, PEOPLE[0]!] },
  { emoji: "👀", count: 1, reacted: false, users: [PEOPLE[2]!] },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ReactionsDemo({ initial }: { initial: ReactionData[] }) {
  const [reactions, setReactions] = React.useState(initial);
  return (
    <Reactions
      reactions={reactions}
      onToggle={(emoji) => setReactions((rs) => toggleReaction(rs, emoji, ME))}
    />
  );
}

/** Pills with counts; yours are tinted. Click to toggle, hover to see who reacted. */
export function reactions(): ReactNode {
  return (
    <Wrapper>
      <ReactionsDemo initial={SAMPLE} />
    </Wrapper>
  );
}

/** No reactions yet: only the add button, with the quick row on top of the picker. */
export function reactionsEmpty(): ReactNode {
  return (
    <Wrapper>
      <ReactionsDemo initial={[]} />
    </Wrapper>
  );
}

/** Read-only: no `onToggle`, so no add button and the pills only show who reacted. */
export function reactionsReadOnly(): ReactNode {
  return (
    <Wrapper>
      <Reactions reactions={SAMPLE} />
    </Wrapper>
  );
}

/** `maxUsersShown={2}` caps the names: "Neha Kapoor, Arjun Mehta and 3 others". */
export function reactionsMaxUsers(): ReactNode {
  return (
    <Wrapper>
      <Reactions reactions={SAMPLE} maxUsersShown={2} onToggle={() => {}} />
    </Wrapper>
  );
}

function AsyncDemo() {
  const [reactions, setReactions] = React.useState(SAMPLE);
  return (
    <Reactions
      reactions={reactions}
      onToggle={async (emoji) => {
        const before = reactions;
        setReactions((rs) => toggleReaction(rs, emoji, ME));
        await wait(800);
        if (emoji === "👀") {
          setReactions(before);
          throw new Error("Couldn't react.");
        }
      }}
    />
  );
}

/** Optimistic: the pill flips at once and stays busy until the promise settles; 👀 fails and rolls back. */
export function reactionsOptimistic(): ReactNode {
  return (
    <Wrapper>
      <AsyncDemo />
    </Wrapper>
  );
}

function AddDemo() {
  const [picked, setPicked] = React.useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <ReactionAdd onSelect={setPicked} />
      <span className="text-sm text-muted-foreground">
        {picked ? `Picked ${picked}` : "Add a reaction"}
      </span>
    </div>
  );
}

/** `ReactionAdd` alone — the button `CommentItem` puts in its hover actions. */
export function reactionsAdd(): ReactNode {
  return (
    <Wrapper>
      <AddDemo />
    </Wrapper>
  );
}
