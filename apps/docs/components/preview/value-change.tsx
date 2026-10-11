"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { ValueChange } from "@/components/ui/value-change";

export function valueChange(): ReactNode {
  return (
    <Wrapper>
      <p className="text-sm">
        Status <ValueChange before="Draft" after="Published" />
      </p>
    </Wrapper>
  );
}

export function valueChangeKinds(): ReactNode {
  return (
    <Wrapper>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Price</dt>
        <dd>
          <ValueChange before="₹1,200" after="₹1,450" />
        </dd>
        <dt className="text-muted-foreground">Owner</dt>
        <dd>
          <ValueChange before={null} after="Asha Kumar" />
        </dd>
        <dt className="text-muted-foreground">Due date</dt>
        <dd>
          <ValueChange before="25 Oct" after={null} />
        </dd>
      </dl>
    </Wrapper>
  );
}

export function valueChangeNarrow(): ReactNode {
  return (
    <Wrapper>
      <div className="w-56 rounded-lg border border-border p-3 text-sm">
        <ValueChange
          before="Stainless steel, brushed finish"
          after="Anodised aluminium, matte black"
        />
      </div>
    </Wrapper>
  );
}
