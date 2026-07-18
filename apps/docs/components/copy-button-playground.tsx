'use client';

import type { ReactNode } from 'react';
import { CopyButton, type CopyButtonProps } from '@/components/ui/copy-button';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type CopyButtonPlaygroundKey = 'variant' | 'size' | 'disabled';

/** The string written to the clipboard — fixed, so the playground stays a props explorer. */
const COPY_VALUE = 'pnpm dlx shadcn@latest add @vegastack/button';

/** Every `Button` variant is forwarded unchanged; the component's own default is `ghost`. */
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

/** The square `icon-*` sizes — the icon child has no text, so these keep the button square. */
const SIZE_OPTIONS = [
  { value: 'icon-xs', label: 'Icon extra small' },
  { value: 'icon-sm', label: 'Icon small' },
  { value: 'icon', label: 'Icon' },
  { value: 'icon-lg', label: 'Icon large' },
] as const;

const copyButtonPlaygroundConfig: PlaygroundConfig<CopyButtonPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'variant', label: 'Variant', options: VARIANT_OPTIONS, defaultValue: 'ghost' },
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'icon-sm' },
    { type: 'switch', key: 'disabled', label: 'Disabled', defaultValue: false },
  ],
  render: (state): ReactNode => (
    <CopyButton
      value={COPY_VALUE}
      variant={state.variant as CopyButtonProps['variant']}
      size={state.size as CopyButtonProps['size']}
      disabled={Boolean(state.disabled)}
    />
  ),
  toCode: (state) => {
    const props: string[] = [`value="${COPY_VALUE}"`];
    // Component defaults are `ghost` / `icon-sm` — omit them for minimal JSX.
    if (state.variant !== 'ghost') props.push(`variant="${state.variant}"`);
    if (state.size !== 'icon-sm') props.push(`size="${state.size}"`);
    if (state.disabled) props.push('disabled');
    return `<CopyButton ${props.join(' ')} />`;
  },
};

/**
 * `CopyButtonPlayground` — interactive props playground for `CopyButton` (pass-through `variant`
 * and square `size` axes plus `disabled`, over a fixed `value`), backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/copy-button.mdx`.
 */
export function CopyButtonPlayground() {
  return <PropsPlayground {...copyButtonPlaygroundConfig} />;
}
