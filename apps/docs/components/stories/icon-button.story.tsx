import { defineStory } from '@/lib/story';
import { IconButtonStory } from './icon-button.client';

/**
 * Story explorer for `IconButton`, hosted by the narrow {@link IconButtonStory} wrapper —
 * see its JSDoc for why the raw component's prop type hangs the Story dev analyzer.
 */
export const story = defineStory({
  Component: IconButtonStory,
  args: [
    {
      variant: 'Default',
      initial: {},
    },
  ],
});
