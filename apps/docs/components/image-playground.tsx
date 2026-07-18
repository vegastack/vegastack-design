'use client';

import type { ReactNode } from 'react';
import { Image, type ImageProps } from '@/components/ui/image';
import { PropsPlayground, type PlaygroundConfig } from '@/components/playground';

type ImagePlaygroundKey = 'aspectRatio' | 'rounded';

// The same fixed sample the image previews use (components/preview/image.tsx) —
// a deterministic local fixture served from apps/docs/public, never a remote image.
const SAMPLE = '/preview/landscape.svg';

const ASPECT_RATIO_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'square', label: 'Square' },
  { value: 'video', label: 'Video' },
] as const;

const ROUNDED_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'full', label: 'Full' },
] as const;

const imagePlaygroundConfig: PlaygroundConfig<ImagePlaygroundKey> = {
  controls: [
    {
      type: 'select',
      key: 'aspectRatio',
      label: 'Aspect ratio',
      options: ASPECT_RATIO_OPTIONS,
      defaultValue: 'auto',
    },
    { type: 'select', key: 'rounded', label: 'Rounded', options: ROUNDED_OPTIONS, defaultValue: 'md' },
  ],
  render: (state): ReactNode => (
    <div className="w-40">
      <Image
        src={SAMPLE}
        alt="A scenic landscape"
        aspectRatio={state.aspectRatio as ImageProps['aspectRatio']}
        rounded={state.rounded as ImageProps['rounded']}
      />
    </div>
  ),
  toCode: (state) => {
    const props: string[] = [];
    if (state.aspectRatio !== 'auto') props.push(`aspectRatio="${state.aspectRatio}"`);
    if (state.rounded !== 'md') props.push(`rounded="${state.rounded}"`);
    const propsString = props.length > 0 ? ` ${props.join(' ')}` : '';
    return `<Image src={url} alt="A scenic landscape"${propsString} />`;
  },
};

/**
 * `ImagePlayground` — interactive props playground for `Image` (aspectRatio / rounded),
 * rendered from the docs' fixed sample source, backed by the generic {@link PropsPlayground}.
 * Registered in `mdx.tsx`, adopted in `content/docs/components/image.mdx`.
 */
export function ImagePlayground() {
  return <PropsPlayground {...imagePlaygroundConfig} />;
}
