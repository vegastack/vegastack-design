"use client";

/**
 * Batch 2 review harness — VegaStack side, AFTER the reset.
 *
 * NOT COMMITTED and not part of the docs site. It is dropped into `apps/docs/app/compare/page.tsx`
 * for the capture run and removed afterwards. `compare-b2-before.tsx` is the same sections written
 * against the PRE-RESET API, and `compare-b2-upstream.tsx` the same sections written against
 * shadcn's own scaffold, so a `<section>` and a `data-capture` name mean the same thing in all
 * three targets.
 *
 * Every control carries `data-capture="<component>.<case>"`. The Playwright driver enumerates
 * those, forces `:hover`, `:active` and `:focus-visible` through CDP `CSS.forcePseudoState`, and
 * clips the element's box.
 */

import * as React from "react";
import {
  BellIcon,
  CheckIcon,
  InfoIcon,
  PlusIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-section={id}
      className="border-b border-border px-8 py-6 last:border-b-0"
    >
      <h2 className="mb-1 text-sm font-medium text-foreground">{title}</h2>
      {note ? (
        <p className="mb-4 text-xs text-muted-foreground">{note}</p>
      ) : null}
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;
const BUTTON_SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;
const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
  "success",
  "warning",
  "info",
] as const;
const ALERT_VARIANTS = [
  "default",
  "destructive",
  "success",
  "warning",
  "info",
] as const;
const AVATAR_SRC = "https://github.com/shadcn.png";

export default function ComparePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Section id="button.variants" title="Button — variants">
        {BUTTON_VARIANTS.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            data-capture={`button.variant-${variant}`}
          >
            {variant}
          </Button>
        ))}
      </Section>

      <Section id="button.sizes" title="Button — sizes">
        {BUTTON_SIZES.map((size) =>
          size.startsWith("icon") ? (
            <Button
              key={size}
              size={size}
              variant="outline"
              aria-label={size}
              data-capture={`button.size-${size}`}
            >
              <PlusIcon />
            </Button>
          ) : (
            <Button
              key={size}
              size={size}
              variant="outline"
              data-capture={`button.size-${size}`}
            >
              {size}
            </Button>
          ),
        )}
      </Section>

      <Section id="button.states" title="Button — states">
        <Button data-capture="button.rest">Rest</Button>
        <Button disabled data-capture="button.disabled">
          Disabled
        </Button>
        <Button loading data-capture="button.loading">
          Loading
        </Button>
        <Button aria-invalid data-capture="button.invalid">
          Invalid
        </Button>
        <Button variant="outline" data-capture="button.with-icon">
          <PlusIcon data-icon="inline-start" /> With icon
        </Button>
        <Button className="rounded-full" data-capture="button.rounded">
          Rounded
        </Button>
      </Section>

      <Section id="button-group" title="Button Group">
        <ButtonGroup data-capture="button-group.horizontal">
          <Button variant="outline">One</Button>
          <Button variant="outline">Two</Button>
          <Button variant="outline">Three</Button>
        </ButtonGroup>
        <ButtonGroup
          orientation="vertical"
          data-capture="button-group.vertical"
        >
          <Button variant="outline">One</Button>
          <Button variant="outline">Two</Button>
        </ButtonGroup>
        <ButtonGroup data-capture="button-group.separator">
          <Button variant="outline">Copy</Button>
          <ButtonGroupSeparator />
          <Button variant="outline">Paste</Button>
        </ButtonGroup>
        <ButtonGroup data-capture="button-group.text">
          <ButtonGroupText>https://</ButtonGroupText>
          <Button variant="outline">Open</Button>
        </ButtonGroup>
      </Section>

      <Section id="badge" title="Badge — variants">
        {BADGE_VARIANTS.map((variant) => (
          <Badge
            key={variant}
            variant={variant}
            data-capture={`badge.variant-${variant}`}
          >
            {variant}
          </Badge>
        ))}
        <Badge variant="secondary" data-capture="badge.with-icon">
          <CheckIcon data-icon="inline-start" /> Verified
        </Badge>
      </Section>

      <Section id="alert" title="Alert — variants">
        {ALERT_VARIANTS.map((variant) => (
          <Alert
            key={variant}
            variant={variant}
            className="max-w-sm"
            data-capture={`alert.variant-${variant}`}
          >
            <InfoIcon />
            <AlertTitle>{variant}</AlertTitle>
            <AlertDescription>
              A short explanation of what happened.
            </AlertDescription>
          </Alert>
        ))}
        <Alert className="max-w-sm" data-capture="alert.with-action">
          <TriangleAlertIcon />
          <AlertTitle>With an action</AlertTitle>
          <AlertDescription>The action sits in the corner.</AlertDescription>
          <AlertAction>
            <Button size="icon-xs" variant="ghost" aria-label="Dismiss">
              <XIcon />
            </Button>
          </AlertAction>
        </Alert>
      </Section>

      <Section id="card" title="Card">
        <Card className="w-64" data-capture="card.default">
          <CardHeader>
            <CardTitle>Default</CardTitle>
            <CardDescription>Card description</CardDescription>
            <CardAction>
              <Button size="icon-xs" variant="ghost" aria-label="More">
                <PlusIcon />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>Body copy inside the card.</CardContent>
        </Card>
        <Card size="sm" className="w-64" data-capture="card.sm">
          <CardHeader>
            <CardTitle>Small</CardTitle>
            <CardDescription>Tighter density</CardDescription>
          </CardHeader>
          <CardContent>Body copy inside the card.</CardContent>
        </Card>
        <Card className="w-64" data-capture="card.with-footer">
          <CardHeader>
            <CardTitle>With a footer</CardTitle>
          </CardHeader>
          <CardContent>Body copy inside the card.</CardContent>
          <CardFooter>
            <Button size="sm">Confirm</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section id="item" title="Item">
        <Item className="w-80" data-capture="item.default">
          <ItemMedia variant="icon">
            <BellIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Default</ItemTitle>
            <ItemDescription>A row of structured content.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              Open
            </Button>
          </ItemActions>
        </Item>
        <Item variant="outline" className="w-80" data-capture="item.outline">
          <ItemContent>
            <ItemTitle>Outline</ItemTitle>
            <ItemDescription>Bordered variant.</ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="muted" className="w-80" data-capture="item.muted">
          <ItemContent>
            <ItemTitle>Muted</ItemTitle>
            <ItemDescription>Filled variant.</ItemDescription>
          </ItemContent>
        </Item>
        <Item size="sm" className="w-80" data-capture="item.size-sm">
          <ItemContent>
            <ItemTitle>Small</ItemTitle>
          </ItemContent>
        </Item>
        <Item size="xs" className="w-80" data-capture="item.size-xs">
          <ItemContent>
            <ItemTitle>Extra small</ItemTitle>
          </ItemContent>
        </Item>
        <ItemGroup className="w-80" data-capture="item.group">
          <Item>
            <ItemContent>
              <ItemTitle>First</ItemTitle>
            </ItemContent>
          </Item>
          <ItemSeparator />
          <Item>
            <ItemContent>
              <ItemTitle>Second</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </Section>

      <Section id="empty" title="Empty">
        <Empty className="w-80" data-capture="empty.default">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>No notifications</EmptyTitle>
            <EmptyDescription>You are all caught up.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">Refresh</Button>
          </EmptyContent>
        </Empty>
        <Empty className="w-80 border" data-capture="empty.outline">
          <EmptyHeader>
            <EmptyTitle>Drop files here</EmptyTitle>
            <EmptyDescription>Or click to browse.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Section>

      <Section id="avatar" title="Avatar">
        <Avatar data-capture="avatar.image">
          <AvatarImage src={AVATAR_SRC} alt="" />
          <AvatarFallback>VS</AvatarFallback>
        </Avatar>
        <Avatar data-capture="avatar.fallback">
          <AvatarFallback>VS</AvatarFallback>
        </Avatar>
        <Avatar size="sm" data-capture="avatar.size-sm">
          <AvatarFallback>VS</AvatarFallback>
        </Avatar>
        <Avatar size="lg" data-capture="avatar.size-lg">
          <AvatarFallback>VS</AvatarFallback>
        </Avatar>
        <Avatar data-capture="avatar.badge">
          <AvatarFallback>VS</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <AvatarGroup data-capture="avatar.group">
          <Avatar>
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>B</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Section>

      <Section id="toggle" title="Toggle">
        <Toggle data-capture="toggle.default">Bold</Toggle>
        <Toggle variant="outline" data-capture="toggle.outline">
          Outline
        </Toggle>
        <Toggle defaultPressed data-capture="toggle.on">
          Pressed
        </Toggle>
        <Toggle disabled data-capture="toggle.disabled">
          Disabled
        </Toggle>
        <Toggle loading data-capture="toggle.loading">
          Loading
        </Toggle>
        <Toggle size="sm" data-capture="toggle.size-sm">
          Small
        </Toggle>
        <Toggle size="lg" data-capture="toggle.size-lg">
          Large
        </Toggle>
      </Section>

      <Section id="toggle-group" title="Toggle Group">
        <ToggleGroup defaultValue={["a"]} data-capture="toggle-group.single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          variant="outline"
          defaultValue={["a"]}
          data-capture="toggle-group.outline"
        >
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          spacing={0}
          defaultValue={["a"]}
          data-capture="toggle-group.spacing-0"
        >
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          orientation="vertical"
          defaultValue={["a"]}
          data-capture="toggle-group.vertical"
        >
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
          defaultValue={["a"]}
          data-capture="toggle-group.size-sm"
        >
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section id="tooltip" title="Tooltip">
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger
              render={
                <Button variant="outline" data-capture="tooltip.trigger" />
              }
            >
              Hover me
            </TooltipTrigger>
            <TooltipContent data-capture="tooltip.open">
              Tooltip content
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Section>

      <Section id="kbd" title="Kbd">
        <Kbd data-capture="kbd.single">K</Kbd>
        <KbdGroup data-capture="kbd.group">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Section>

      <Section id="label" title="Label">
        <Label data-capture="label.default">Email address</Label>
        <div data-disabled="true" className="group">
          <Label data-capture="label.disabled">Disabled label</Label>
        </div>
      </Section>

      <Section id="separator" title="Separator">
        <div className="w-64" data-capture="separator.horizontal">
          <p className="text-sm">Above</p>
          <Separator className="my-2" />
          <p className="text-sm">Below</p>
        </div>
        <div
          className="flex h-8 items-center gap-2"
          data-capture="separator.vertical"
        >
          <span className="text-sm">Left</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Right</span>
        </div>
      </Section>

      <Section id="skeleton" title="Skeleton">
        <Skeleton className="h-4 w-40" data-capture="skeleton.line" />
        <Skeleton
          className="size-10 rounded-full"
          data-capture="skeleton.circle"
        />
        <Skeleton className="h-24 w-40" data-capture="skeleton.card" />
      </Section>

      <Section id="spinner" title="Spinner">
        <Spinner data-capture="spinner.default" />
        <Button variant="outline" disabled data-capture="spinner.in-button">
          <Spinner data-icon="inline-start" /> Loading
        </Button>
      </Section>

      <Section id="aspect-ratio" title="Aspect Ratio">
        <div className="w-40" data-capture="aspect-ratio.square">
          <AspectRatio ratio={1} className="rounded-lg bg-muted" />
        </div>
        <div className="w-40" data-capture="aspect-ratio.portrait">
          <AspectRatio ratio={3 / 4} className="rounded-lg bg-muted" />
        </div>
        <div className="w-40" data-capture="aspect-ratio.video">
          <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted" />
        </div>
      </Section>
    </div>
  );
}
