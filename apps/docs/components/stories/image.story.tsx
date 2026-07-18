import { defineStory } from '@/lib/story';
import { Image } from '@/components/ui/image';

/**
 * Story explorer for `Image` — controls auto-generated from `ImageProps` by the Story
 * build plugin. Uses the local `/preview/landscape.svg` fixture so the first render is
 * deterministic. Complements the curated ImagePlayground.
 */
export const story = defineStory({
  Component: Image,
  args: [
    {
      variant: 'Default',
      initial: {
        src: '/preview/landscape.svg',
        alt: 'A minimal landscape illustration',
        aspectRatio: 'video',
        className: 'max-w-md',
      },
    },
    {
      variant: 'Fallback',
      initial: {
        alt: 'Ada Lovelace',
        aspectRatio: 'square',
        className: 'w-24',
      },
      fixed: {
        fallback: 'AL',
      },
    },
  ],
});
