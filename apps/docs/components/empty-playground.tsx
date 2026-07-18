'use client';

import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  type EmptyMediaProps,
  type EmptyProps,
} from '@/components/ui/empty';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type EmptyPlaygroundKey = 'size' | 'variant' | 'intent' | 'surface' | 'bordered';

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const MEDIA_VARIANT_OPTIONS = [
  { value: 'default', label: 'Default (bare)' },
  { value: 'icon', label: 'Icon chip' },
] as const;

const INTENT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'info', label: 'Info' },
  { value: 'destructive', label: 'Destructive' },
] as const;

const SURFACE_OPTIONS = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'card', label: 'Card' },
] as const;

const emptyPlaygroundConfig: PlaygroundConfig<EmptyPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    { type: 'select', key: 'variant', label: 'Media variant', options: MEDIA_VARIANT_OPTIONS, defaultValue: 'icon' },
    { type: 'select', key: 'intent', label: 'Intent', options: INTENT_OPTIONS, defaultValue: 'default' },
    { type: 'select', key: 'surface', label: 'Surface', options: SURFACE_OPTIONS, defaultValue: 'transparent' },
    { type: 'switch', key: 'bordered', label: 'Bordered', defaultValue: false },
  ],
  render: (state): ReactNode => (
    // The outer div is preview-only chrome (constrains the demo width); the generated JSX
    // mirrors the `Empty` element itself.
    <div className="w-full max-w-md">
      <Empty
        size={state.size as EmptyProps['size']}
        surface={state.surface as EmptyProps['surface']}
        bordered={Boolean(state.bordered)}
      >
        <EmptyHeader>
          <EmptyMedia
            variant={state.variant as EmptyMediaProps['variant']}
            intent={state.intent as EmptyMediaProps['intent']}
          >
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No messages</EmptyTitle>
          <EmptyDescription>Your inbox is empty.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
  toCode: (state) => {
    const rootProps: string[] = [];
    if (state.size !== 'default') rootProps.push(`size="${state.size}"`);
    if (state.surface !== 'transparent') rootProps.push(`surface="${state.surface}"`);
    if (state.bordered) rootProps.push('bordered');
    const mediaProps: string[] = [];
    if (state.variant !== 'icon') mediaProps.push(`variant="${state.variant}"`);
    if (state.intent !== 'default') mediaProps.push(`intent="${state.intent}"`);
    const root = rootProps.length > 0 ? ` ${rootProps.join(' ')}` : '';
    const media = mediaProps.length > 0 ? ` ${mediaProps.join(' ')}` : '';
    return `<Empty${root}>
  <EmptyHeader>
    <EmptyMedia${media}>
      <Inbox />
    </EmptyMedia>
    <EmptyTitle>No messages</EmptyTitle>
    <EmptyDescription>Your inbox is empty.</EmptyDescription>
  </EmptyHeader>
</Empty>`;
  },
};

/**
 * `EmptyPlayground` — interactive props playground for `Empty` (size / media variant / intent /
 * surface / bordered), backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`,
 * adopted in `content/docs/components/empty.mdx`.
 */
export function EmptyPlayground() {
  return <PropsPlayground {...emptyPlaygroundConfig} />;
}
