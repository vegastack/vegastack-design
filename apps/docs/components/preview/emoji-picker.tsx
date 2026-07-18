'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/emoji-picker` (dogfoods the registry) → auto-scanned.
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Default example — click the trigger to open the searchable category grid; the picked emoji shows beside it. */
export function emojiPicker(): ReactNode {
  return (
    <Wrapper>
      <EmojiPickerDemo />
    </Wrapper>
  );
}

function EmojiPickerDemo() {
  const [value, setValue] = React.useState<string>('🚀');

  return (
    <div className="flex items-center gap-2">
      <EmojiPicker onValueChange={setValue} />
      <span className="min-w-12 text-3xl leading-none" aria-live="polite">
        {value || <span className="text-base text-muted-foreground">Pick one →</span>}
      </span>
    </div>
  );
}

export function emojiPickerInput(): ReactNode {
  return (
    <Wrapper>
      <EmojiPickerInputDemo />
    </Wrapper>
  );
}

function EmojiPickerInputDemo() {
  const [text, setText] = React.useState('Great work ');

  return (
    <div className="flex w-full max-w-sm items-center gap-1.5">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment…"
        aria-label="Comment"
      />
      <EmojiPicker onValueChange={(emoji) => setText((prev) => prev + emoji)} />
    </div>
  );
}

export function emojiPickerCustomTrigger(): ReactNode {
  return (
    <Wrapper>
      <EmojiPicker
        onValueChange={() => {}}
        trigger={<Button variant="outline">Add reaction</Button>}
        align="center"
      />
    </Wrapper>
  );
}

/**
 * Multi-pick — `closeOnSelect={false}` keeps the panel open after each pick so several emoji
 * can be appended in a row (e.g. building a reaction bar). Open the trigger and keep clicking.
 */
export function emojiPickerMultiPick(): ReactNode {
  return (
    <Wrapper>
      <EmojiPickerMultiPickDemo />
    </Wrapper>
  );
}

function EmojiPickerMultiPickDemo() {
  const [picked, setPicked] = React.useState<string[]>(['🚀', '🔥']);

  return (
    <div className="flex items-center gap-2">
      <EmojiPicker
        closeOnSelect={false}
        triggerLabel="Add reaction"
        align="center"
        onValueChange={(emoji) => setPicked((prev) => [...prev, emoji])}
      />
      <div className="flex min-h-(--size-md) min-w-24 flex-wrap items-center gap-1 text-2xl leading-none">
        {picked.length > 0 ? (
          picked.map((emoji, i) => <span key={`${emoji}-${i}`}>{emoji}</span>)
        ) : (
          <span className="text-base text-muted-foreground">No reactions yet</span>
        )}
      </div>
    </div>
  );
}

/**
 * Empty / no-results state (live) — the picker owns its own search state, so this can't be
 * frozen via props. Open it and type a query that matches nothing (e.g. "zzz"): the grid is
 * replaced by a "No emoji found." message and a polite `role="status"` announces the result
 * count (or the empty state) as you type.
 */
export function emojiPickerEmptyState(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-2">
        <EmojiPicker onValueChange={() => {}} triggerLabel="Search emoji" />
        <p className="text-base text-muted-foreground">
          Open the picker and type <span className="font-mono">zzz</span> in the search field
          to see the empty state.
        </p>
      </div>
    </Wrapper>
  );
}

/**
 * Side and labels — `side` places the panel (here `right`), and `triggerLabel` /
 * `searchPlaceholder` customise the trigger `aria-label` and search placeholder copy.
 */
export function emojiPickerSideAndLabels(): ReactNode {
  return (
    <Wrapper>
      <EmojiPicker
        onValueChange={() => {}}
        side="right"
        align="center"
        triggerLabel="Insert symbol"
        searchPlaceholder="Find a symbol…"
      />
    </Wrapper>
  );
}

/**
 * Custom panel class — `className` is forwarded to the popover panel, so you can override its
 * width or other layout. Open the trigger to see the widened panel.
 */
export function emojiPickerClassName(): ReactNode {
  return (
    <Wrapper>
      <EmojiPicker onValueChange={() => {}} align="center" className="w-80" />
    </Wrapper>
  );
}
