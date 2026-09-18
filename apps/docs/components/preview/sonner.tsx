"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/sonner` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

/*
 * An app mounts ONE `<Toaster />` at its root and calls `toast(...)` with no `toasterId`. A docs
 * page stacks several fixtures on one screen, so each one takes an `id` and each call names it —
 * otherwise sonner's single global store would render every toast into every viewport here. In
 * your app, drop the `id` and the `toasterId`.
 */
const DEMO = "sonner-demo";
const TYPES = "sonner-types";
const ACTION = "sonner-action";
const PROMISE = "sonner-promise";

export function sonner(): ReactNode {
  return (
    <Wrapper>
      <Toaster id={DEMO} />
      <Button
        variant="outline"
        onClick={() =>
          toast("Event created", {
            toasterId: DEMO,
            description: "Sunday, December 3 at 9:00 AM",
          })
        }
      >
        Show Toast
      </Button>
    </Wrapper>
  );
}

export function sonnerTypes(): ReactNode {
  return (
    <Wrapper>
      <Toaster id={TYPES} />
      <Button
        variant="outline"
        onClick={() => toast("Event has been created.", { toasterId: TYPES })}
      >
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Event has been created.", { toasterId: TYPES })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Arrive 10 minutes before the event.", {
            toasterId: TYPES,
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("The event cannot start before 8:00 AM.", {
            toasterId: TYPES,
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("The event could not be created.", { toasterId: TYPES })
        }
      >
        Error
      </Button>
    </Wrapper>
  );
}

export function sonnerAction(): ReactNode {
  return (
    <Wrapper>
      <Toaster id={ACTION} />
      <Button
        variant="outline"
        onClick={() =>
          toast("Event created", {
            toasterId: ACTION,
            description: "Sunday, December 3 at 9:00 AM",
            action: {
              label: "Undo",
              onClick: () => toast.dismiss(),
            },
          })
        }
      >
        Create Event
      </Button>
    </Wrapper>
  );
}

export function sonnerPromise(): ReactNode {
  function showToast() {
    toast.promise(
      new Promise<{ name: string }>((resolve) => {
        window.setTimeout(() => resolve({ name: "Event" }), 2000);
      }),
      {
        toasterId: PROMISE,
        loading: "Creating event…",
        success: (data) => `${data.name} created.`,
        error: "Could not create event.",
      },
    );
  }

  return (
    <Wrapper>
      <Toaster id={PROMISE} />
      <Button variant="outline" onClick={showToast}>
        Create Event
      </Button>
    </Wrapper>
  );
}
