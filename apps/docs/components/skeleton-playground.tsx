'use client';

import type { ReactNode } from 'react';
import { Skeleton, type SkeletonProps } from '@/components/ui/skeleton';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type SkeletonPlaygroundKey = 'shape' | 'count';

const SHAPE_OPTIONS = [
  { value: 'line', label: 'Line' },
  { value: 'circle', label: 'Circle' },
  { value: 'rect', label: 'Rect' },
  { value: 'card', label: 'Card' },
] as const;

const COUNT_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const;

const skeletonPlaygroundConfig: PlaygroundConfig<SkeletonPlaygroundKey> = {
  controls: [
    { type: 'select', key: 'shape', label: 'Shape', options: SHAPE_OPTIONS, defaultValue: 'line' },
    { type: 'select', key: 'count', label: 'Count', options: COUNT_OPTIONS, defaultValue: '1' },
  ],
  render: (state): ReactNode => (
    // The width-filling shapes (line / rect / card) need a sized container in the
    // centered preview area, so the skeleton itself stays wrapper-free.
    <div className="w-full max-w-xs">
      <Skeleton
        shape={state.shape as SkeletonProps['shape']}
        count={Number(state.count)}
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.shape !== 'line') props.push(`shape="${state.shape}"`);
    if (state.count !== '1') props.push(`count={${state.count}}`);
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return `<Skeleton${propsString} />`;
  },
};

/**
 * `SkeletonPlayground` — interactive props playground for `Skeleton` (shape / count),
 * backed by the generic {@link PropsPlayground}. Registered in `mdx.tsx`, adopted in
 * `content/docs/components/skeleton.mdx`.
 */
export function SkeletonPlayground() {
  return <PropsPlayground {...skeletonPlaygroundConfig} />;
}
