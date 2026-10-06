"use client";
import { useState, type ReactNode } from "react";
import { IconPicker } from "@/components/ui/icon-picker";
import type { IconValue } from "@/lib/icon-data";
import type { AvatarHue } from "@/components/ui/avatar";
import { Wrapper } from "./wrapper";
/** Combined identity picker, including nested colours. */
export function iconPicker(): ReactNode {
  const [value, setValue] = useState<IconValue | null>({
    kind: "icon",
    name: "briefcase-business",
  });
  const [hue, setHue] = useState<AvatarHue | null>("blue");
  return (
    <Wrapper>
      <IconPicker
        value={value}
        onValueChange={setValue}
        hue={hue}
        onHueChange={setHue}
        closeOnSelect={false}
        onRemove={() => setValue(null)}
      />
    </Wrapper>
  );
}
