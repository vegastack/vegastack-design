import { defineStory } from '@/lib/story';
import { Progress } from '@/components/ui/progress';

/**
 * Story explorer for `Progress` — controls auto-generated from `ProgressProps` by the Story
 * build plugin. Complements the curated ProgressPlayground (which emits copyable JSX).
 */
export const story = defineStory({
  Component: Progress,
  args: [
    {
      variant: 'Default',
      initial: {
        value: 60,
        'aria-label': 'Upload progress',
      },
    },
    {
      variant: 'Indeterminate',
      initial: {
        'aria-label': 'Loading',
      },
      fixed: {
        value: null,
      },
    },
  ],
});
