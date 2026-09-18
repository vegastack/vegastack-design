"use client";

import type { ReactNode } from "react";
import { LoaderIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/spinner` (dogfoods the registry).
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export function spinner(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Item variant="muted">
          <ItemMedia>
            <Spinner />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="line-clamp-1">
              Processing payment...
            </ItemTitle>
          </ItemContent>
          <ItemContent className="flex-none justify-end">
            <span className="text-sm tabular-nums">$100.00</span>
          </ItemContent>
        </Item>
      </div>
    </Wrapper>
  );
}

export function spinnerCustomization(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Spinner />
      <LoaderIcon
        role="status"
        aria-label="Loading"
        className="size-4 animate-spin"
      />
    </Wrapper>
  );
}

export function spinnerSize(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </Wrapper>
  );
}

export function spinnerButton(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <Button disabled size="sm">
        <Spinner data-icon="inline-start" />
        Loading...
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Please wait
      </Button>
      <Button variant="secondary" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Processing
      </Button>
    </Wrapper>
  );
}

export function spinnerBadge(): ReactNode {
  return (
    <Wrapper className="gap-4">
      <Badge>
        <Spinner data-icon="inline-start" />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner data-icon="inline-start" />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner data-icon="inline-start" />
        Processing
      </Badge>
    </Wrapper>
  );
}

/**
 * Upstream's example composes `InputGroup`, which this system does not ship. The equivalent here
 * is `Input`'s own `suffix` addon slot and a spinner row beside a `Textarea`.
 */
export function spinnerInputGroup(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-full max-w-md flex-col gap-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Send a message..."
            disabled
            aria-label="Send a message"
          />
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Send a message..."
            disabled
            aria-label="Send a long message"
          />
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Validating...
          </p>
        </div>
      </div>
    </Wrapper>
  );
}

export function spinnerEmpty(): ReactNode {
  return (
    <Wrapper>
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>
          <EmptyTitle>Processing your request</EmptyTitle>
          <EmptyDescription>
            Please wait while we process your request. Do not refresh the page.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function spinnerRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div
        className="flex w-full max-w-xs flex-col gap-4 self-center"
        dir="ltr"
      >
        <Item variant="muted">
          <ItemMedia>
            <Spinner />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="line-clamp-1">
              Processing payment...
            </ItemTitle>
          </ItemContent>
          <ItemContent className="flex-none justify-end">
            <span className="text-sm tabular-nums">$100.00</span>
          </ItemContent>
        </Item>
      </div>
      <div
        className="flex w-full max-w-xs flex-col gap-4 self-center"
        dir="rtl"
      >
        <Item variant="muted" dir="rtl">
          <ItemMedia>
            <Spinner />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="line-clamp-1">جاري معالجة الدفع...</ItemTitle>
          </ItemContent>
          <ItemContent className="flex-none justify-end">
            <span className="text-sm tabular-nums">١٠٠.٠٠ دولار</span>
          </ItemContent>
        </Item>
      </div>
    </Wrapper>
  );
}
