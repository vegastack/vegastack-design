"use client";

import type { ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Local fixture — no live third-party image dependencies in demos.
const COVER = "/preview/landscape.svg";

export function card(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          <CardAction>
            <Button variant="link">Sign Up</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="card-email">Email</Label>
              <Input id="card-email" type="email" placeholder="m@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-password">Password</Label>
              <Input id="card-password" type="password" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full">Login</Button>
          <Button variant="outline" className="w-full">
            Login with Google
          </Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

/** Every part at once — the tree the Anatomy section lists, rendered. */
export function cardComposition(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
          <CardAction>
            <Badge variant="secondary">Card Action</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function cardSize(): ReactNode {
  return (
    <Wrapper>
      <Card size="sm" className="w-full max-w-xs">
        <CardHeader>
          <CardTitle>Scheduled reports</CardTitle>
          <CardDescription>
            Weekly snapshots. No more manual exports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 py-2 text-sm">
            <li className="flex gap-2">
              <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>Choose a schedule (daily, or weekly).</span>
            </li>
            <li className="flex gap-2">
              <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>Send to channels or specific teammates.</span>
            </li>
            <li className="flex gap-2">
              <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>Include charts, tables, and key metrics.</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button size="sm" className="w-full">
            Set up scheduled reports
          </Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function cardVariant(): ReactNode {
  return (
    <Wrapper>
      <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Default</CardTitle>
            <CardDescription>
              A raised surface with the card fill.
            </CardDescription>
          </CardHeader>
          <CardContent>Open deals: 12</CardContent>
        </Card>
        <Card size="sm" variant="outline">
          <CardHeader>
            <CardTitle>Outline</CardTitle>
            <CardDescription>The border only, on the page.</CardDescription>
          </CardHeader>
          <CardContent>Open deals: 12</CardContent>
        </Card>
      </div>
    </Wrapper>
  );
}

export function cardSpacing(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["[--card-spacing:--spacing(3)]", "12px"],
            ["[--card-spacing:--spacing(4)]", "16px"],
            ["[--card-spacing:--spacing(6)]", "24px"],
          ] as const
        ).map(([className, label]) => (
          <Card key={label} className={className}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>Section gap and part inset.</CardDescription>
            </CardHeader>
            <CardFooter>
              <p className="text-muted-foreground">Footer</p>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>
            Review the terms before accepting the agreement.
          </CardDescription>
        </CardHeader>
        <CardContent className="-mb-(--card-spacing)">
          <div className="-mx-(--card-spacing) max-h-40 space-y-4 overflow-y-scroll border-t bg-muted/50 px-(--card-spacing) py-4 text-sm leading-relaxed">
            <p>
              These terms govern your use of the workspace, including access to
              shared documents, project files, and collaboration tools.
            </p>
            <p>
              You are responsible for the content you upload and for ensuring
              that your team has the appropriate permissions to view or edit it.
            </p>
            <p>
              By continuing, you agree to keep your account credentials secure
              and to follow your organization&apos;s acceptable use policies.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function cardImage(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm pt-0">
        <img src={COVER} alt="" className="aspect-video w-full object-cover" />
        <CardHeader>
          <CardAction>
            <Badge variant="secondary">Featured</Badge>
          </CardAction>
          <CardTitle>Design systems meetup</CardTitle>
          <CardDescription>
            A practical talk on component APIs, accessibility, and shipping
            faster.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full">View Event</Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function cardRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Card className="w-full max-w-sm" dir="ltr">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          <CardAction>
            <Button variant="link">Sign Up</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="card-email-ltr">Email</Label>
            <Input
              id="card-email-ltr"
              type="email"
              placeholder="m@example.com"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Login</Button>
        </CardFooter>
      </Card>
      <Card className="w-full max-w-sm" dir="rtl">
        <CardHeader>
          <CardTitle>تسجيل الدخول إلى حسابك</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك
          </CardDescription>
          <CardAction>
            <Button variant="link">إنشاء حساب</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="card-email-rtl">البريد الإلكتروني</Label>
            <Input
              id="card-email-rtl"
              type="email"
              placeholder="m@example.com"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">تسجيل الدخول</Button>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function cardAsHeading(): ReactNode {
  return (
    <Wrapper>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle render={<h3 />}>Usage this month</CardTitle>
          <CardDescription>Seats in use across the workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">12 of 20</p>
        </CardContent>
      </Card>
    </Wrapper>
  );
}
