"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/card` (dogfoods the registry) → auto-scanned.
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function card(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Account activity</CardTitle>
          <CardDescription>A summary of your recent sign-ins.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          You signed in from 3 devices in the last 7 days.
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export function cardSizes(): ReactNode {
  return (
    <Wrapper className="items-start">
      <Card size="default" className="w-full max-w-64">
        <CardHeader>
          <CardTitle>Default density</CardTitle>
          <CardDescription>size=&quot;default&quot;</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Roomier padding (py-4 / px-4), gap-4, and a base-size title.
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>
      <Card size="sm" className="w-full max-w-64">
        <CardHeader>
          <CardTitle>Compact density</CardTitle>
          <CardDescription>size=&quot;sm&quot;</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Tighter padding (py-3 / px-3), gap-3, and a smaller title.
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function cardWithFooter(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Team plan</CardTitle>
          <CardDescription>
            $20 / user / month, billed annually.
          </CardDescription>
          <CardAction>
            <Badge intent="info">Popular</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Everything in Pro, plus SSO, audit logs, and priority support.
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Upgrade</Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}
