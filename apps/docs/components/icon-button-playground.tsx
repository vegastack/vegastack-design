'use client';

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { IconButton, type IconButtonProps } from '@/components/ui/icon-button';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type IconButtonPlaygroundKey = 'variant' | 'size' | 'disabled' | 'loading';

/** Every `Button` variant passes straight through the wrapper. */
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

/** The remapped square scale — `xs`/`sm`/`default`/`lg` → Button's `icon-*` sizes. */
const SIZE_OPTIONS = [
  { value: 'xs', label: 'Extra small' },
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const iconButtonPlaygroundConfig: PlaygroundConfig<IconButtonPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'variant', label: 'Variant', options: VARIANT_OPTIONS, defaultValue: 'default' },
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
    { type: 'switch', key: 'loading', label: 'Loading', defaultValue: false },
  ],
  render: (state): ReactNode => (
    // `aria-label` is mandatory (compile-time guarantee) — baked in, not a control.
    <IconButton
      aria-label="Add item"
      variant={state.variant as IconButtonProps['variant']}
      size={state.size as IconButtonProps['size']}
      disabled={Boolean(state.disabled)}
      loading={Boolean(state.loading)}
    >
      <Plus />
    </IconButton>
  ),
  toCode: (state) => {
    const props: string[] = ['aria-label="Add item"'];
    if (state.variant !== 'default') props.push(`variant="${state.variant}"`);
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (state.disabled) props.push('disabled');
    if (state.loading) props.push('loading');
    return `<IconButton ${props.join(' ')}>\n  <Plus />\n</IconButton>`;
  },
};

/**
 * `IconButtonPlayground` — interactive props playground for `IconButton` (all 15 pass-through
 * variants, the square `xs`/`sm`/`default`/`lg` scale, `disabled` / `loading`), backed by the
 * generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/icon-button.mdx`.
 */
export function IconButtonPlayground() {
  return <PropsPlayground {...iconButtonPlaygroundConfig} />;
}
