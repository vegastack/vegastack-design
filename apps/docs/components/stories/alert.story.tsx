import { defineStory } from '@/lib/story';
import { Alert } from '@/components/ui/alert';

/**
 * Story explorer for `Alert` — controls auto-generated from `AlertProps` by the Story
 * build plugin. Text children render in the content slot; compose `AlertTitle` /
 * `AlertDescription` / `AlertActions` in real usage.
 */
export const story = defineStory({
  Component: Alert,
  args: [
    {
      variant: 'Default',
      initial: {
        children: 'Your changes have been saved.',
      },
    },
    {
      variant: 'Success intent',
      initial: {
        children: 'Deployment finished without errors.',
      },
      fixed: {
        intent: 'success',
      },
    },
  ],
});
