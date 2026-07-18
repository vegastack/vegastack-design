import { defineStory } from '@/lib/story';
import { Input } from '@/components/ui/input';

/**
 * Story explorer for `Input` — controls auto-generated from `InputProps` by the Story
 * build plugin. Uncontrolled by default; the addon preset fixes the `prefix`/`suffix`
 * ReactNode slots (plain strings render as muted label text).
 */
export const story = defineStory({
  Component: Input,
  args: [
    {
      variant: 'Default',
      initial: {
        placeholder: 'you@example.com',
        type: 'email',
      },
    },
    {
      variant: 'With addons',
      initial: {
        placeholder: 'acme',
      },
      fixed: {
        prefix: 'https://',
        suffix: '.vegastack.com',
      },
    },
  ],
});
