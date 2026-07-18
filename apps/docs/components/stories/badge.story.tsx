import { defineStory } from '@/lib/story';
import { Badge } from '@/components/ui/badge';

/**
 * Story explorer for `Badge` — controls auto-generated from `BadgeProps` by the Story
 * build plugin. Complements the curated BadgePlayground (which emits copyable JSX).
 */
export const story = defineStory({
  Component: Badge,
  args: [
    {
      variant: 'Default',
      initial: {
        children: 'Active',
      },
    },
    {
      variant: 'Solid intent',
      initial: {
        children: 'Deployed',
      },
      fixed: {
        variant: 'solid',
        intent: 'success',
      },
    },
  ],
});
