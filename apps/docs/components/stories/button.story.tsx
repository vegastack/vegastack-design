import { defineStory } from '@/lib/story';
import { Button } from '@/components/ui/button';

/**
 * Story explorer for `Button` — controls auto-generated from `ButtonProps` by the Story
 * build plugin. Complements the curated ButtonPlayground (which emits copyable JSX).
 */
export const story = defineStory({
  Component: Button,
  args: [
    {
      variant: 'Default',
      initial: {
        children: 'Save changes',
      },
    },
    {
      variant: 'Destructive',
      initial: {
        children: 'Delete project',
      },
      fixed: {
        variant: 'destructive',
      },
    },
    {
      variant: 'Loading',
      initial: {
        children: 'Saving…',
        loading: true,
      },
    },
  ],
});
