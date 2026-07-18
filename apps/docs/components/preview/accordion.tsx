'use client';

import { type ReactNode, useState } from 'react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/accordion` (dogfoods the registry) → auto-scanned.
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export function accordion(): ReactNode {
  return (
    <Wrapper>
      <Accordion defaultValue={['what']} className="max-w-md">
        <AccordionItem value="what">
          <AccordionTrigger>What is VegaStack Design?</AccordionTrigger>
          <AccordionContent>
            A token-driven component system built on Base UI and Tailwind, distributed as a private
            shadcn registry.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="install">
          <AccordionTrigger>How do I install a component?</AccordionTrigger>
          <AccordionContent>
            Run the shadcn CLI with the registry alias to copy the source straight into your project.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="theme">
          <AccordionTrigger>Can I theme it?</AccordionTrigger>
          <AccordionContent>
            Yes — every value maps to a semantic token, so light and dark themes flow from the
            token layer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Wrapper>
  );
}

export function accordionMultiple(): ReactNode {
  return (
    <Wrapper>
      <Accordion multiple defaultValue={['shipping', 'returns']} className="max-w-md">
        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>
            Orders ship within 2–3 business days. Tracking is emailed once the carrier scans your
            package.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>
            Unused items can be returned within 30 days for a full refund to the original payment
            method.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="warranty" disabled>
          <AccordionTrigger>Warranty (coming soon)</AccordionTrigger>
          <AccordionContent>Warranty details are not yet available.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Wrapper>
  );
}

export function accordionControlled(): ReactNode {
  const [value, setValue] = useState<string[]>(['account']);
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <span>Open section:</span>
          <span className="font-medium text-foreground">
            {value.length > 0 ? value.join(', ') : 'none'}
          </span>
        </div>
        <Accordion value={value} onValueChange={(next) => setValue(next as string[])}>
          <AccordionItem value="account">
            <AccordionTrigger>Account</AccordionTrigger>
            <AccordionContent>
              Manage your profile, email, and password from a single place.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="billing">
            <AccordionTrigger>Billing</AccordionTrigger>
            <AccordionContent>
              Update your payment method and download past invoices.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="notifications">
            <AccordionTrigger>Notifications</AccordionTrigger>
            <AccordionContent>
              Choose which product and security emails you receive.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Wrapper>
  );
}
