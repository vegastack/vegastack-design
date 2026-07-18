import { defineStory } from '@/lib/story';
import { CopyButton } from '@/components/ui/copy-button';

/**
 * Story explorer for `CopyButton` — controls auto-generated from `CopyButtonProps` by the
 * Story build plugin. The copy/check icons and transient feedback are internal; only the
 * `value` (and labels/variant/size) are configurable.
 */
export const story = defineStory({
  Component: CopyButton,
  args: [
    {
      variant: 'Default',
      initial: {
        value: 'npm install @vegastack/design',
      },
    },
    {
      variant: 'Outline',
      initial: {
        value: 'sk-live-4242',
      },
      fixed: {
        variant: 'outline',
        size: 'icon',
      },
    },
  ],
});
