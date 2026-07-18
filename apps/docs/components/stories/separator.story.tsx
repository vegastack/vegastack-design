import { defineStory } from '@/lib/story';
import { Separator } from '@/components/ui/separator';

/**
 * Story explorer for `Separator` — controls auto-generated from `SeparatorProps` by the
 * Story build plugin. Horizontal renders a full-width rule on its own; `vertical` needs
 * a height from its parent, so the default preset stays horizontal.
 */
export const story = defineStory({
  Component: Separator,
  args: [
    {
      variant: 'Default',
      initial: {
        orientation: 'horizontal',
        decorative: true,
      },
    },
  ],
});
