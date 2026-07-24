import { defineStory } from "@/lib/story";
import { RelativeTime } from "@/components/ui/relative-time";

/** Module-scope fixture so the first render shows a real "2 hours ago". */
const TWO_HOURS_AGO = new Date(Date.now() - 2 * 3_600_000);

/**
 * Story explorer for `RelativeTime` — controls auto-generated from `RelativeTimeProps`
 * by the Story build plugin.
 */
export const story = defineStory({
  Component: RelativeTime,
  args: [
    {
      variant: "Default",
      initial: {
        date: TWO_HOURS_AGO,
      },
    },
    {
      variant: "Day mode",
      initial: {
        date: TWO_HOURS_AGO,
      },
      fixed: {
        mode: "day",
      },
    },
  ],
});
