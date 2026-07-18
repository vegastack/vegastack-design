'use client';

import type { ReactNode } from 'react';
import {
  SplitButton,
  type SplitButtonAction,
  type SplitButtonProps,
} from '@/components/ui/split-button';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type SplitButtonPlaygroundKey = 'variant' | 'size' | 'destructiveAction' | 'disabled' | 'loading';

/** `variant` passes straight through to both halves — the full 15-value Button scale. */
const VARIANT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'link', label: 'Link' },
  { value: 'destructive', label: 'Destructive' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'glass', label: 'Glass' },
  { value: 'destructive-outline', label: 'Destructive outline' },
  { value: 'success-outline', label: 'Success outline' },
  { value: 'warning-outline', label: 'Warning outline' },
  { value: 'info-outline', label: 'Info outline' },
  { value: 'cta', label: 'CTA' },
] as const;

/** The text sizes, mirroring `Button` — the square `icon-*` sizes make no sense on a labeled split. */
const SIZE_OPTIONS = [
  { value: 'xs', label: 'Extra small' },
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

// `destructive` is a per-action flag (`SplitButtonAction.destructive`), not a root prop — the
// "Destructive action" switch flips the second menu item between a plain and a destructive row.
const DEFAULT_ACTIONS: [SplitButtonAction, ...SplitButtonAction[]] = [
  { label: 'Save and continue' },
  { label: 'Save as draft' },
];
const DESTRUCTIVE_ACTIONS: [SplitButtonAction, ...SplitButtonAction[]] = [
  { label: 'Save and continue' },
  { label: 'Discard changes', destructive: true },
];

const splitButtonPlaygroundConfig: PlaygroundConfig<SplitButtonPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'variant', label: 'Variant', options: VARIANT_OPTIONS, defaultValue: 'default' },
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'destructiveAction', label: 'Destructive action', defaultValue: false },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
    { type: 'switch', key: 'loading', label: 'Loading', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <SplitButton
      variant={state.variant as SplitButtonProps['variant']}
      size={state.size as SplitButtonProps['size']}
      disabled={Boolean(state.disabled)}
      loading={Boolean(state.loading)}
      actions={state.destructiveAction ? DESTRUCTIVE_ACTIONS : DEFAULT_ACTIONS}
    >
      Save
    </SplitButton>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.variant !== 'default') props.push(`variant="${state.variant}"`);
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (state.disabled) props.push('disabled');
    if (state.loading) props.push('loading');
    const propsString = props.length > 0 ? `\n  ${props.join(' ')}` : '';
    const secondAction = state.destructiveAction
      ? `{ label: 'Discard changes', destructive: true },`
      : `{ label: 'Save as draft' },`;
    return `<SplitButton${propsString}
  actions={[
    { label: 'Save and continue' },
    ${secondAction}
  ]}
>
  Save
</SplitButton>`;
  },
};

/**
 * `SplitButtonPlayground` — interactive props playground for `SplitButton` (pass-through
 * `variant` / `size`, `disabled` / `loading`, and a per-action `destructive` flag on the menu),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/split-button.mdx`.
 */
export function SplitButtonPlayground() {
  return <PropsPlayground {...splitButtonPlaygroundConfig} />;
}
