'use client';

import type { ReactNode } from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
} from '@/components/ui/toggle-group';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type ToggleGroupPlaygroundKey = 'size' | 'orientation' | 'multiple';

/** `size` set once on the root flows to every item via context. */
const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
] as const;

const toggleGroupPlaygroundConfig: PlaygroundConfig<ToggleGroupPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'size', label: 'Size', options: SIZE_OPTIONS, defaultValue: 'default' },
    {
      type: 'select',
      key: 'orientation',
      label: 'Orientation',
      options: ORIENTATION_OPTIONS,
      defaultValue: 'horizontal',
    },
    { type: 'switch', key: 'multiple', label: 'Multiple', defaultValue: false },
  ],
  render: (state): ReactNode => (
    // `multiple` changes the selection model (radio-like vs checkbox-like), so the group is
    // keyed on it to remount with a clean selection when the control flips.
    <ToggleGroup
      key={String(state.multiple)}
      aria-label="Text alignment"
      multiple={Boolean(state.multiple)}
      orientation={state.orientation as ToggleGroupProps['orientation']}
      size={state.size as ToggleGroupProps['size']}
    >
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  toCode: (state) => {
    const props: string[] = ['aria-label="Text alignment"'];
    if (state.multiple) props.push('multiple');
    if (state.orientation !== 'horizontal') props.push(`orientation="${state.orientation}"`);
    if (state.size !== 'default') props.push(`size="${state.size}"`);
    return `<ToggleGroup ${props.join(' ')}>
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight />
  </ToggleGroupItem>
</ToggleGroup>`;
  },
};

/**
 * `ToggleGroupPlayground` — interactive props playground for `ToggleGroup` (`size`,
 * `orientation`, `multiple`) over three alignment items, backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/toggle-group.mdx`.
 */
export function ToggleGroupPlayground() {
  return <PropsPlayground {...toggleGroupPlaygroundConfig} />;
}
