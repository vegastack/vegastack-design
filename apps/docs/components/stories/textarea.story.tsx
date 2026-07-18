import { defineStory } from '@/lib/story';
import { Textarea } from './textarea.client';

/**
 * Story explorer for `Textarea` — controls auto-generated from `TextareaProps` by the
 * Story build plugin. Uncontrolled; the auto-grow preset sizes to content via CSS
 * `field-sizing`.
 */
export const story = defineStory({
  Component: Textarea,
  args: [
    {
      variant: 'Default',
      initial: {
        placeholder: 'Add a comment…',
      },
    },
    {
      variant: 'Auto-grow',
      initial: {
        placeholder: 'Type to grow…',
        autoGrow: true,
        rows: 2,
      },
    },
  ],
});
