import { defineStory } from '@/lib/story';
import { Spinner } from './spinner.client';

/**
 * Story explorer for `Spinner` — controls auto-generated from `SpinnerProps` by the Story
 * build plugin. Renders standalone from props; color follows the ancestor text color.
 */
export const story = defineStory({
  Component: Spinner,
  args: [
    {
      variant: 'Default',
      initial: {
        label: 'Loading',
      },
    },
    {
      variant: 'Large',
      initial: {
        label: 'Loading dashboard',
      },
      fixed: {
        size: 'lg',
      },
    },
  ],
});
