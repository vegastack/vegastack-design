import { defineStory } from "@/lib/story";
import { OTPInput } from "@/components/ui/otp-input";

/**
 * Story explorer for `OTPInput` — controls auto-generated from `OTPInputProps` by the
 * Story build plugin. Uncontrolled here; pair `value` + `onValueChange` in real usage.
 */
export const story = defineStory({
  Component: OTPInput,
  args: [
    {
      variant: "Default",
      initial: {
        "aria-label": "Verification code",
      },
    },
    {
      variant: "Grouped",
      initial: {
        "aria-label": "Two-factor code",
      },
      fixed: {
        groups: [3, 3],
      },
    },
  ],
});
