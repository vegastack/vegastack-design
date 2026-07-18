'use client';

import type { ReactNode } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/label` (dogfoods the registry) → auto-scanned.
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function label(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-2">
      <Label htmlFor="label-demo-email">Email</Label>
      <Input id="label-demo-email" type="email" placeholder="you@vegastack.com" />
    </Wrapper>
  );
}

export function labelRequired(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-2">
      {/*
       * `required` sets a `data-required` styling/automation hook on the <label>
       * — it renders NO visual asterisk. The label below looks identical to a
       * normal one; inspect it to see `data-required=""`. Convey requiredness on
       * the control itself (`required`) + an inline FieldError on submit.
       */}
      {/* Demonstrate the hook VISIBLY: a consumer can style `data-required` however their
       * product marks required fields — here, a muted "(required)" suffix. The component
       * itself stays mark-free by design. */}
      <Label
        htmlFor="label-demo-name"
        required
        className="data-required:after:ml-1 data-required:after:text-muted-foreground data-required:after:content-['(required)']"
      >
        Full name
      </Label>
      <Input id="label-demo-name" type="text" placeholder="Ada Lovelace" required />
    </Wrapper>
  );
}

export function labelStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      {/* peer path: Tailwind `peer-*` variants only style LATER siblings, so the label
          must FOLLOW the disabled `peer` control in the DOM. */}
      <div className="flex flex-col gap-2">
        <Input id="label-demo-peer" className="peer" type="text" placeholder="API key" disabled />
        <Label htmlFor="label-demo-peer">API key (peer-disabled dim)</Label>
      </div>
      {/* group path: the label sits inside a disabled group container. */}
      <div className="group flex flex-col gap-2" data-disabled="true">
        <Label htmlFor="label-demo-group">Workspace (group-disabled dim)</Label>
        <Input id="label-demo-group" type="text" placeholder="Acme Inc." disabled />
      </div>
    </Wrapper>
  );
}
