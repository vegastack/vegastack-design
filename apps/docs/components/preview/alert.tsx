"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/alert` (dogfoods the registry) → auto-scanned.
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function alert(): ReactNode {
  return (
    <Wrapper>
      <div className="grid w-full max-w-md items-start gap-4">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Payment successful</AlertTitle>
          <AlertDescription>
            Your payment of $29.99 has been processed. A receipt has been sent
            to your email address.
          </AlertDescription>
        </Alert>
        <Alert>
          <InfoIcon />
          <AlertTitle>New feature available</AlertTitle>
          <AlertDescription>
            We&apos;ve added dark mode support. You can enable it in your
            account settings.
          </AlertDescription>
        </Alert>
      </div>
    </Wrapper>
  );
}

/** Every part at once — the tree the Anatomy section lists, rendered. */
export function alertComposition(): ReactNode {
  return (
    <Wrapper>
      <Alert className="max-w-md">
        <InfoIcon />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components and dependencies to your app using the CLI.
        </AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline">
            Enable
          </Button>
        </AlertAction>
      </Alert>
    </Wrapper>
  );
}

export function alertBasic(): ReactNode {
  return (
    <Wrapper>
      <Alert className="max-w-md">
        <CheckCircle2Icon />
        <AlertTitle>Account updated successfully</AlertTitle>
        <AlertDescription>
          Your profile information has been saved. Changes will be reflected
          immediately.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

export function alertDestructive(): ReactNode {
  return (
    <Wrapper>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircleIcon />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          Your payment could not be processed. Please check your payment method
          and try again.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

/** Ours: the other three chromatic families (COL-12), each with its own icon (A11Y-8). */
export function alertStatus(): ReactNode {
  return (
    <Wrapper>
      <div className="grid w-full max-w-md items-start gap-4">
        <Alert variant="success">
          <CheckCircle2Icon />
          <AlertTitle>Deployment succeeded</AlertTitle>
          <AlertDescription>Build 4127 is live on production.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>Your subscription expires in 3 days</AlertTitle>
          <AlertDescription>
            Renew now to avoid an interruption in service.
          </AlertDescription>
        </Alert>
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Maintenance window on Sunday</AlertTitle>
          <AlertDescription>
            The API will be read-only between 02:00 and 04:00 UTC.
          </AlertDescription>
        </Alert>
      </div>
    </Wrapper>
  );
}

export function alertAction(): ReactNode {
  return (
    <Wrapper>
      <Alert className="max-w-md">
        <AlertTitle>Dark mode is now available</AlertTitle>
        <AlertDescription>
          Enable it under your profile settings to get started.
        </AlertDescription>
        <AlertAction>
          <Button size="xs">Enable</Button>
        </AlertAction>
      </Alert>
    </Wrapper>
  );
}

/**
 * Ours: upstream customises with the raw Tailwind palette, which COL-20 forbids anywhere in this
 * repository. The same override written in semantic tokens retints per theme for free.
 */
export function alertCustomColors(): ReactNode {
  return (
    <Wrapper>
      <Alert
        variant="warning"
        className="max-w-md border-warning/40 bg-warning/10"
      >
        <TriangleAlertIcon />
        <AlertTitle>Your subscription will expire in 3 days.</AlertTitle>
        <AlertDescription>
          Renew now to avoid service interruption, or upgrade to a paid plan to
          continue using the service.
        </AlertDescription>
      </Alert>
    </Wrapper>
  );
}

export function alertRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="grid w-full max-w-md items-start gap-4" dir="ltr">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Payment successful</AlertTitle>
          <AlertDescription>
            Your payment of $29.99 has been processed.
          </AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline">
              View
            </Button>
          </AlertAction>
        </Alert>
      </div>
      <div className="grid w-full max-w-md items-start gap-4" dir="rtl">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>تم الدفع بنجاح</AlertTitle>
          <AlertDescription>
            تمت معالجة دفعتك البالغة 29.99 دولارًا.
          </AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline">
              عرض
            </Button>
          </AlertAction>
        </Alert>
      </div>
    </Wrapper>
  );
}

export function alertLive(): ReactNode {
  return <AlertLiveExample />;
}

function AlertLiveExample(): ReactNode {
  const [failed, setFailed] = useState(false);
  return (
    <Wrapper>
      <div className="grid w-full max-w-xl gap-3">
        <Button variant="outline" onClick={() => setFailed(true)}>
          Save changes
        </Button>
        {failed ? (
          <Alert variant="destructive" live>
            <AlertCircleIcon />
            <AlertTitle>Your changes were not saved</AlertTitle>
            <AlertDescription>
              The server did not respond. Check your connection and try again.
            </AlertDescription>
          </Alert>
        ) : null}
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Maintenance on Sunday</AlertTitle>
          <AlertDescription>
            Present at load, so it is a polite status and is read in page order.
          </AlertDescription>
        </Alert>
      </div>
    </Wrapper>
  );
}

export function alertActionWidth(): ReactNode {
  return (
    <Wrapper>
      <div className="grid w-full max-w-md gap-3">
        <Alert>
          <InfoIcon />
          <AlertTitle>Your trial ends in three days</AlertTitle>
          <AlertDescription>
            Pick a plan to keep your workspace and its history.
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline">
              Review details
            </Button>
          </AlertAction>
        </Alert>
        <Alert className="max-w-xs">
          <InfoIcon />
          <AlertTitle>Two files were removed (a narrow alert)</AlertTitle>
          <AlertDescription>You can restore them for 30 days.</AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline">
              Undo all
            </Button>
          </AlertAction>
        </Alert>
      </div>
    </Wrapper>
  );
}
