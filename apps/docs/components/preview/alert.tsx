"use client";

import { type ReactNode, useState } from "react";
import { Bell } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/alert` (dogfoods the registry) → auto-scanned.
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function alert(): ReactNode {
  return (
    <Wrapper>
      <Alert intent="info" className="max-w-md">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>
          This is an informational alert with a leading icon.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

export function alertVariants(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Alert intent="default" className="max-w-md">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>
          A neutral message with no status connotation.
        </AlertDescription>
      </Alert>
      <Alert intent="info" className="max-w-md">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>
          Useful context the user should be aware of.
        </AlertDescription>
      </Alert>
      <Alert intent="success" className="max-w-md">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your changes have been saved.</AlertDescription>
      </Alert>
      <Alert intent="warning" className="max-w-md">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your subscription expires in 3 days.
        </AlertDescription>
      </Alert>
      <Alert intent="destructive" className="max-w-md">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your last payment could not be processed.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

export function alertDismissable(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Alert intent="warning" dismissable className="max-w-md">
        <AlertTitle>Subscription expiring</AlertTitle>
        <AlertDescription>
          Renew within 3 days to avoid interruption.
        </AlertDescription>
      </Alert>
      <Alert intent="default" dismissable className="max-w-md">
        <AlertTitle>New feature</AlertTitle>
        <AlertDescription>
          Check out the new dashboard analytics.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

// Controlled dismiss: `onDismiss` updates external state instead of letting the
// alert self-remove, and the action row (`AlertActions`) renders alongside the
// dismiss button. This is the recommended production path. Live — click to dismiss.
export function alertActions(): ReactNode {
  const [open, setOpen] = useState(true);
  return (
    <Wrapper className="flex-col items-stretch">
      {open ? (
        <Alert
          intent="warning"
          dismissable
          onDismiss={() => setOpen(false)}
          className="max-w-md"
        >
          <AlertTitle>Subscription expiring</AlertTitle>
          <AlertDescription>
            Renew within 3 days to avoid interruption.
          </AlertDescription>
          <AlertActions>
            <Button variant="warning-outline" size="sm">
              Renew now
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Dismiss
            </Button>
          </AlertActions>
        </Alert>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setOpen(true)}
        >
          Restore alert
        </Button>
      )}
    </Wrapper>
  );
}

// Icon controls: a custom leading `icon` (any lucide element) overrides the
// variant default; `hideIcon` drops the leading gutter entirely.
export function alertIconOptions(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Alert intent="info" icon={<Bell />} className="max-w-md">
        <AlertTitle>Custom icon</AlertTitle>
        <AlertDescription>
          Pass any lucide icon via the `icon` prop.
        </AlertDescription>
      </Alert>
      <Alert intent="success" hideIcon className="max-w-md">
        <AlertTitle>No icon</AlertTitle>
        <AlertDescription>
          `hideIcon` removes the leading icon gutter.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

// Matrix: each variant in its plain (icon-only) form beside the same variant
// carrying an `AlertActions` row, so the icon gutter and action layout read
// per tone.
export function alertMatrix(): ReactNode {
  const variants = [
    "default",
    "info",
    "success",
    "warning",
    "destructive",
  ] as const;
  return (
    <Wrapper className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
      {variants.map((variant) => (
        <Alert key={`${variant}-plain`} intent={variant}>
          <AlertTitle className="capitalize">{variant}</AlertTitle>
          <AlertDescription>With its default leading icon.</AlertDescription>
        </Alert>
      ))}
      {variants.map((variant) => (
        <Alert key={`${variant}-actions`} intent={variant}>
          <AlertTitle className="capitalize">{variant}</AlertTitle>
          <AlertDescription>With an action row below.</AlertDescription>
          <AlertActions>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </AlertActions>
        </Alert>
      ))}
    </Wrapper>
  );
}
export function alertStrip(): ReactNode {
  // The compact info-ribbon (settings banners, inline notices).
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <Alert variant="strip" intent="default">
        <AlertDescription>
          Changes to your profile apply to all of your workspaces.
        </AlertDescription>
      </Alert>
      <Alert variant="strip" intent="warning">
        <AlertDescription>Your trial ends in 3 days.</AlertDescription>
      </Alert>
    </Wrapper>
  );
}
