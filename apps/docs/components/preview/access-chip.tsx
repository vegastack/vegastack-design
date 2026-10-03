"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AccessChip } from "@/components/ui/access-chip";

/** One chip per reach; each is a button that opens Share, with the full sentence on hover and focus. */
export function accessChip(): ReactNode {
  return (
    <Wrapper>
      <AccessChip
        access={{
          kind: "space",
          space: { name: "Product", access: "open", hue: "purple" },
        }}
      />
      <AccessChip access={{ kind: "invited" }} />
      <AccessChip access={{ kind: "personal" }} />
      <AccessChip
        access={{
          kind: "hidden",
          hint: { kind: "personal", ownerName: "Priya" },
        }}
      />
      <AccessChip access={{ kind: "hidden", hint: { kind: "private" } }} />
      <AccessChip
        access={{
          kind: "space",
          space: { name: "General", access: "open", hue: "blue" },
        }}
        published
      />
    </Wrapper>
  );
}

/** `iconOnly` for a narrow header; the name moves into the accessible label. */
export function accessChipIconOnly(): ReactNode {
  return (
    <Wrapper>
      <AccessChip
        iconOnly
        access={{
          kind: "space",
          space: { name: "Product", access: "open", hue: "purple" },
        }}
      />
      <AccessChip iconOnly access={{ kind: "invited" }} published />
      <AccessChip iconOnly access={{ kind: "personal" }} />
    </Wrapper>
  );
}
