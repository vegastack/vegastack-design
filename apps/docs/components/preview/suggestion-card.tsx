"use client";

import { useState, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/suggestion-card` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonAvatar } from "@/components/ui/person-avatar";
import {
  SuggestionCard,
  type SuggestionCardItem,
} from "@/components/ui/suggestion-card";

const avatar = (
  <PersonAvatar person={{ name: "Assistant", kind: "agent" }} size="sm" />
);

const start: SuggestionCardItem[] = [
  { id: "a", label: "Keep 4000 K for IP65", meta: "Asha, Fri", checked: true },
  { id: "b", label: "Order 3000 K samples", meta: "Ravi, Wed", checked: true },
  { id: "c", label: "Update the datasheet", meta: "you", checked: false },
];

function More(): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon-xs" variant="ghost" aria-label="More options" />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Fewer suggestions like this</DropdownMenuItem>
        <DropdownMenuItem>Mute suggestions for a week</DropdownMenuItem>
        <DropdownMenuItem>Why am I seeing this?</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Column({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-sm">{children}</div>
    </Wrapper>
  );
}

export function suggestionCard(): ReactNode {
  function Demo(): ReactNode {
    const [items, setItems] = useState(start);
    const ticked = items.filter((item) => item.checked).length;
    const noun = ticked === 1 ? "task" : `${ticked} tasks`;
    return (
      <SuggestionCard
        privateLabel="Only you can see this"
        avatar={avatar}
        title="Assistant · 3 decisions from this chat"
        items={items}
        onItemCheckedChange={(id, checked) =>
          setItems((list) =>
            list.map((item) => (item.id === id ? { ...item, checked } : item)),
          )
        }
        menu={<More />}
        actions={
          <>
            <Button size="sm" variant="secondary" disabled={ticked === 0}>
              {ticked === 0 ? "Nothing selected" : `Create ${noun}`}
            </Button>
            <Button size="sm" variant="ghost">
              Review
            </Button>
            <Button size="sm" variant="ghost">
              Dismiss
            </Button>
          </>
        }
        footnote="Expires tomorrow"
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function suggestionCardBusy(): ReactNode {
  return (
    <Column>
      <SuggestionCard
        privateLabel="Only you can see this"
        avatar={avatar}
        title="Assistant · 2 decisions from this chat"
        state="busy"
        items={start.slice(0, 2)}
        actions={
          <>
            <Button size="sm" variant="secondary" loading>
              Create 2 tasks
            </Button>
            <Button size="sm" variant="ghost" disabled>
              Dismiss
            </Button>
          </>
        }
      />
    </Column>
  );
}

export function suggestionCardOutcomes(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-3">
      <SuggestionCard
        title="Assistant · 2 decisions from this chat"
        state="accepted"
        outcome="Asha created 2 tasks from Assistant's suggestion"
      />
      <SuggestionCard
        title="Assistant · 3 decisions from this chat"
        state="accepted"
        outcome="Assistant created 3 tasks from this chat"
        actions={
          <Button size="xs" variant="ghost">
            Undo
          </Button>
        }
      />
      <SuggestionCard
        avatar={avatar}
        title="Assistant · 2 decisions from this chat"
        state="expired"
        outcome="This suggestion expired."
        actions={
          <Button size="sm" variant="ghost">
            Ask again
          </Button>
        }
      />
      <SuggestionCard
        avatar={avatar}
        title="Assistant · 2 decisions from this chat"
        state="failed"
        outcome="Couldn't create the tasks."
        actions={
          <Button size="sm" variant="secondary">
            Retry
          </Button>
        }
      />
    </Wrapper>
  );
}

export function suggestionCardRow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <SuggestionCard
        variant="row"
        avatar={avatar}
        title='Assistant · Create 2 tasks from "4000 K downlight decision"'
        actions={
          <>
            <Button size="sm" variant="secondary">
              Create 2 tasks
            </Button>
            <Button size="sm" variant="ghost">
              Review
            </Button>
            <Button size="sm" variant="ghost">
              Dismiss
            </Button>
          </>
        }
      />
    </Wrapper>
  );
}
