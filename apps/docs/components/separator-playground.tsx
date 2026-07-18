'use client';

import type { ReactNode } from 'react';
import { Separator, type SeparatorProps } from '@/components/ui/separator';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type SeparatorPlaygroundKey = 'orientation' | 'decorative';

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
] as const;

const separatorPlaygroundConfig: PlaygroundConfig<SeparatorPlaygroundKey> = {
  controls: [
    {
      type: 'select',
      key: 'orientation',
      label: 'Orientation',
      options: ORIENTATION_OPTIONS,
      defaultValue: 'horizontal',
    },
    // `decorative` has no visual effect — it flips the ARIA exposure
    // (hidden `presentation` vs. an announced `separator`), reflected in the snippet.
    { type: 'switch', key: 'decorative', label: 'Decorative', defaultValue: true },
  ],
  render: (state): ReactNode => {
    const separator = (
      <Separator
        orientation={state.orientation as SeparatorProps['orientation']}
        decorative={Boolean(state.decorative)}
      />
    );
    // A vertical separator needs a parent with height (a fixed-height flex row);
    // the horizontal one divides two stacked text blocks.
    if (state.orientation === 'vertical') {
      return (
        <div className="flex h-8 items-center gap-3">
          <span>Docs</span>
          {separator}
          <span>API</span>
        </div>
      );
    }
    return (
      <div className="flex w-56 flex-col gap-3">
        <span>Profile</span>
        {separator}
        <span>Settings</span>
      </div>
    );
  },
  toCode: (state) => {
    const props: string[] = [];
    if (state.orientation !== 'horizontal') props.push(`orientation="${state.orientation}"`);
    if (!state.decorative) props.push('decorative={false}');
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return `<Separator${propsString} />`;
  },
};

/**
 * `SeparatorPlayground` — interactive props playground for `Separator` (orientation /
 * decorative), rendered between two short text blocks, backed by the generic
 * {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/separator.mdx`.
 */
export function SeparatorPlayground() {
  return <PropsPlayground {...separatorPlaygroundConfig} />;
}
