import { defineStory } from '@/lib/story';
import { AnimatedNumber } from '@/components/ui/animated-number';

/**
 * Story explorer for `AnimatedNumber` — controls auto-generated from
 * `AnimatedNumberProps` by the Story build plugin. Change `value` to watch the tween.
 */
export const story = defineStory({
  Component: AnimatedNumber,
  args: [
    {
      variant: 'Default',
      initial: {
        value: 1204,
      },
    },
    {
      variant: 'Currency',
      initial: {
        value: 1204,
      },
      fixed: {
        format: { style: 'currency', currency: 'USD' },
      },
    },
  ],
});
