'use client';

import type { ReactNode } from 'react';
import { Bell, ChevronRight, FileText, Mail, ShieldCheck } from 'lucide-react';
import { Wrapper } from './wrapper';
// Copied INTO apps/docs via `shadcn add @vegastack/item` (dogfoods the registry) → auto-scanned.
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';

// Local fixture — no live third-party image dependencies in demos/VRT.
const THUMBNAIL = '/preview/avatar-2.svg';

export function itemDemo(): ReactNode {
  return (
    <Wrapper>
      <ItemGroup className="w-full max-w-md gap-2">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <Mail />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>New message</ItemTitle>
            <ItemDescription>Ada Lovelace sent you a message.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              View
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>
    </Wrapper>
  );
}

export function itemDemoVariants(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      {(['default', 'outline', 'muted'] as const).map((variant) => (
        <Item key={variant} variant={variant} className="w-full">
          <ItemContent>
            <ItemTitle>
              variant=<code>{variant}</code>
            </ItemTitle>
            <ItemDescription>
              {variant === 'default' && 'No surface — blends into the parent background.'}
              {variant === 'outline' && 'A hairline border around the row.'}
              {variant === 'muted' && 'A filled neutral wash — reads as a self-contained block.'}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </Wrapper>
  );
}

export function itemDemoMedia(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <Item variant="outline" className="w-full">
        <ItemMedia>
          <Avatar fallback="AL" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Ada Lovelace</ItemTitle>
          <ItemDescription>Default media — bare children (e.g. an Avatar).</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline" className="w-full">
        <ItemMedia variant="icon">
          <ShieldCheck />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Two-factor authentication</ItemTitle>
          <ItemDescription>Icon media — a bordered chip around a lucide icon.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline" className="w-full">
        <ItemMedia variant="image">
          <img src={THUMBNAIL} alt="" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Q3 roadmap.pdf</ItemTitle>
          <ItemDescription>Image media — a clipped square thumbnail tile.</ItemDescription>
        </ItemContent>
      </Item>
    </Wrapper>
  );
}

export function itemDemoActions(): ReactNode {
  return (
    <Wrapper>
      <Item variant="outline" className="w-full max-w-md">
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Q3-roadmap.pdf</ItemTitle>
          <ItemDescription>2.4 MB · Uploaded 3 days ago</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge variant="subtle" intent="info">
            Shared
          </Badge>
          <IconButton aria-label="More actions" variant="ghost" size="sm">
            <ChevronRight />
          </IconButton>
        </ItemActions>
      </Item>
    </Wrapper>
  );
}

export function itemDemoLink(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <Item render={<a href="#billing" />} variant="outline" className="w-full">
        <ItemMedia variant="icon">
          <Bell />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Notification settings</ItemTitle>
          <ItemDescription>
            The whole row is a link via <code>render</code> — keyboard-focusable, keeps the
            native <code>link</code> role.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ChevronRight aria-hidden className="size-(--icon-default) text-muted-foreground" />
        </ItemActions>
      </Item>
    </Wrapper>
  );
}

export function itemDemoGroup(): ReactNode {
  return (
    <Wrapper>
      <ItemGroup className="w-full max-w-md">
        <Item size="sm">
          <ItemMedia>
            <Avatar size="sm" fallback="AL" />
          </ItemMedia>
          <ItemContent>
            <ItemHeader>
              <ItemTitle>Ada Lovelace</ItemTitle>
              <span className="text-sm text-muted-foreground">2m ago</span>
            </ItemHeader>
            <ItemDescription>Approved the pull request.</ItemDescription>
          </ItemContent>
        </Item>
        <ItemSeparator />
        <Item size="sm">
          <ItemMedia>
            <Avatar size="sm" fallback="GH" />
          </ItemMedia>
          <ItemContent>
            <ItemHeader>
              <ItemTitle>Grace Hopper</ItemTitle>
              <span className="text-sm text-muted-foreground">1h ago</span>
            </ItemHeader>
            <ItemDescription>Left a comment on the design doc.</ItemDescription>
            <ItemFooter>
              <Button size="sm" variant="ghost">
                Reply
              </Button>
            </ItemFooter>
          </ItemContent>
        </Item>
      </ItemGroup>
    </Wrapper>
  );
}
