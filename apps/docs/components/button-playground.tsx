'use client';

import type { ReactNode } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type ButtonPlaygroundKey = 'variant' | 'size' | 'disabled' | 'loading';

/** All 15 canonical CVA variants — neutral, semantic-filled, semantic-outline, glass, and cta. */
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

/** All 8 canonical sizes — the text scale plus the square `icon-*` scale. */
const SIZE_OPTIONS = [
  { value: 'xs', label: 'Extra small' },
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
  { value: 'icon-xs', label: 'Icon extra small' },
  { value: 'icon-sm', label: 'Icon small' },
  { value: 'icon', label: 'Icon' },
  { value: 'icon-lg', label: 'Icon large' },
] as const;

/** The square `icon-*` sizes swap the text child for an icon and require an `aria-label`. */
function isIconSize(size: string | boolean): boolean {
  return String(size).startsWith('icon');
}

const buttonPlaygroundConfig: PlaygroundConfig<ButtonPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'variant', label: 'Variant', options: VARIANT_OPTIONS, defaultValue: 'default' },
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
    { type: 'switch', key: 'loading', label: 'Loading', defaultValue: false },
  ],
  render: (state): ReactNode => {
    const iconOnly = isIconSize(state.size);
    return (
      <Button
        variant={state.variant as ButtonProps['variant']}
        size={state.size as ButtonProps['size']}
        disabled={Boolean(state.disabled)}
        loading={Boolean(state.loading)}
        aria-label={iconOnly ? 'Add item' : undefined}
      >
        {iconOnly ? <PlusIcon /> : 'Save changes'}
      </Button>
    );
  },
  toCode: (state) => {
    const iconOnly = isIconSize(state.size);
    const props: string[] = [];
    if (state.variant !== 'default') props.push(`variant="${state.variant}"`);
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    if (iconOnly) props.push('aria-label="Add item"');
    if (state.disabled) props.push('disabled');
    if (state.loading) props.push('loading');
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return iconOnly
      ? `<Button${propsString}>\n  <PlusIcon />\n</Button>`
      : `<Button${propsString}>Save changes</Button>`;
  },
};

/**
 * `ButtonPlayground` — interactive props playground for `Button` covering all 15 variants and
 * all 8 sizes (icon sizes switch to an icon child + `aria-label`), plus `disabled` / `loading`.
 * Backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/button.mdx`.
 */
export function ButtonPlayground() {
  return <PropsPlayground {...buttonPlaygroundConfig} />;
}
