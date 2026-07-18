'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/field` (dogfoods the registry) → auto-scanned.
import { Field } from '@/components/ui/field';
// Copied INTO apps/docs via `shadcn add @vegastack/select` (dogfoods the registry) → auto-scanned.
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';

const FONTS = {
  sans: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
  cursive: 'Cursive',
};

/**
 * Default example — a single flat list of options. The first trigger starts
 * empty (placeholder, muted); the second is pre-selected via `defaultValue`, so
 * opening it shows the chosen row's check indicator.
 */
export function select(): ReactNode {
  return (
    <Wrapper>
      <Select items={FONTS}>
        <SelectTrigger className="w-56" aria-label="Font family">
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sans">Sans-serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="mono">Monospace</SelectItem>
          <SelectItem value="cursive">Cursive</SelectItem>
        </SelectContent>
      </Select>
      <Select items={FONTS} defaultValue="serif">
        <SelectTrigger className="w-56" aria-label="Font family (selected)">
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sans">Sans-serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="mono">Monospace</SelectItem>
          <SelectItem value="cursive">Cursive</SelectItem>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

const TIMEZONES = {
  est: 'Eastern (EST)',
  cst: 'Central (CST)',
  pst: 'Pacific (PST)',
  gmt: 'Greenwich (GMT)',
  cet: 'Central European (CET)',
  jst: 'Japan (JST)',
};

/**
 * Grouped example — labelled `SelectGroup`s split by region with a
 * `SelectSeparator` between them, a pre-selected value, and a disabled option.
 */
export function selectGroups(): ReactNode {
  return (
    <Wrapper>
      <Select items={TIMEZONES} defaultValue="est">
        <SelectTrigger className="w-56" aria-label="Timezone">
          <SelectValue placeholder="Select a timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>North America</SelectLabel>
            <SelectItem value="est">Eastern (EST)</SelectItem>
            <SelectItem value="cst">Central (CST)</SelectItem>
            <SelectItem value="pst">Pacific (PST)</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="gmt">Greenwich (GMT)</SelectItem>
            <SelectItem value="cet">Central European (CET)</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value="jst" disabled>
              Japan (JST)
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

/**
 * Size variants — `sm` (h-7), `default` (h-8, the 32px baseline), and `lg`
 * (h-10) on the shared control scale, so selects line up with inputs and
 * buttons across all three tiers.
 */
export function selectSizes(): ReactNode {
  return (
    <Wrapper>
      <Select items={FONTS}>
        <SelectTrigger size="sm" className="w-48" aria-label="Font (small)">
          <SelectValue placeholder="Small" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sans">Sans-serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="mono">Monospace</SelectItem>
        </SelectContent>
      </Select>
      <Select items={FONTS}>
        <SelectTrigger className="w-48" aria-label="Font (default)">
          <SelectValue placeholder="Default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sans">Sans-serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="mono">Monospace</SelectItem>
        </SelectContent>
      </Select>
      <Select items={FONTS}>
        <SelectTrigger size="lg" className="w-48" aria-label="Font (large)">
          <SelectValue placeholder="Large" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sans">Sans-serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="mono">Monospace</SelectItem>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

/** States — a disabled trigger and a long, scrollable list with scroll arrows. */
export function selectStates(): ReactNode {
  return (
    <Wrapper>
      <Select disabled defaultValue="a">
        <SelectTrigger className="w-44" aria-label="Disabled">
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Locked option</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-44" aria-label="Scrollable">
          <SelectValue placeholder="Pick a number" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 30 }, (_, i) => (
            <SelectItem key={i} value={String(i + 1)}>
              Option {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

const ROLES = {
  viewer: 'Viewer',
  editor: 'Editor',
  admin: 'Admin',
  owner: 'Owner',
};

/**
 * Invalid state — pass `aria-invalid` to the trigger (or wrap the Select in a
 * `<Field error>`, which wires it for you) to tint the border destructive. Left:
 * a bare invalid trigger; right: the same state surfaced through a `Field` with
 * an error message. This backs the documented `aria-invalid`/`data-invalid` tint.
 */
export function selectInvalid(): ReactNode {
  return (
    <Wrapper className="items-start">
      <Select items={ROLES}>
        <SelectTrigger className="w-56" aria-invalid aria-label="Role (invalid)">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">Viewer</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
        </SelectContent>
      </Select>
      <Field
        label="Role"
        error="Select a role to continue."
        className="w-56"
      >
        <Select items={ROLES} name="role">
          <SelectTrigger aria-invalid>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </Wrapper>
  );
}

const LABELS_BY_VALUE: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  docs: 'Documentation',
  chore: 'Chore',
};

/**
 * Multiple selection — set `multiple` on the root. `value`/`defaultValue` become
 * arrays and the popup stays open after each pick. Provide a render-function
 * child to `SelectValue` to summarise the chosen labels (here a comma-joined
 * list, with a placeholder when nothing is selected).
 */
export function selectMultiple(): ReactNode {
  return (
    <Wrapper>
      <Select multiple defaultValue={['bug', 'docs']}>
        <SelectTrigger className="w-64" aria-label="Labels">
          <SelectValue>
            {(value: string[]) =>
              value.length === 0
                ? 'Select labels'
                : value.map((v) => LABELS_BY_VALUE[v]).join(', ')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="feature">Feature</SelectItem>
          <SelectItem value="docs">Documentation</SelectItem>
          <SelectItem value="chore">Chore</SelectItem>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}

/**
 * `alignItemWithTrigger={false}` — by default Base UI aligns the selected item's
 * text over the trigger value (the popup can overlap the trigger). Set it to
 * `false` and the popup edge aligns to the trigger edge instead, opening below
 * with `side`/`align` applied immediately — the more familiar dropdown behaviour.
 */
export function selectAlignItem(): ReactNode {
  return (
    <Wrapper>
      <Select items={FONTS} defaultValue="serif">
        <SelectTrigger className="w-56" aria-label="Font (edge-aligned popup)">
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="sans">Sans-serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="mono">Monospace</SelectItem>
          <SelectItem value="cursive">Cursive</SelectItem>
        </SelectContent>
      </Select>
    </Wrapper>
  );
}
