"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/toast` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { Toaster, createToastManager } from "@/components/ui/toast";

/*
 * An app mounts ONE `<Toaster />` at its root and fires into the module-scope `toast` manager. A
 * docs page stacks several fixtures on one screen, so each one gets its own manager and its own
 * toaster instead — otherwise every viewport on the page would render every toast. In your app,
 * import `toast` from `@/components/ui/toast` and drop the `toastManager` prop.
 */
const demoToast = createToastManager();
const typesToast = createToastManager();
const actionToast = createToastManager();
const promiseToast = createToastManager();

export function toast(): ReactNode {
  function showToast() {
    const id = demoToast.add({
      title: "Event created",
      description: "Sunday, December 3 at 9:00 AM",
      actionProps: {
        children: "Undo",
        onClick() {
          demoToast.close(id);
        },
      },
    });
  }

  return (
    <Wrapper>
      <Toaster toastManager={demoToast}>
        <Button variant="outline" onClick={showToast}>
          Show Toast
        </Button>
      </Toaster>
    </Wrapper>
  );
}

export function toastTypes(): ReactNode {
  return (
    <Wrapper>
      <Toaster toastManager={typesToast}>
        <Button
          variant="outline"
          onClick={() =>
            typesToast.add({ description: "Event has been created." })
          }
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            typesToast.add({
              type: "success",
              description: "Event has been created.",
            })
          }
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            typesToast.add({
              type: "info",
              description: "Arrive 10 minutes before the event.",
            })
          }
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            typesToast.add({
              type: "warning",
              description: "The event cannot start before 8:00 AM.",
            })
          }
        >
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            typesToast.add({
              type: "error",
              description: "The event could not be created.",
              priority: "high",
            })
          }
        >
          Error
        </Button>
      </Toaster>
    </Wrapper>
  );
}

export function toastAction(): ReactNode {
  function showToast() {
    const id = actionToast.add({
      title: "Event created",
      description: "Sunday, December 3 at 9:00 AM",
      actionProps: {
        children: "Undo",
        onClick() {
          actionToast.close(id);
        },
      },
    });
  }

  return (
    <Wrapper>
      <Toaster toastManager={actionToast}>
        <Button variant="outline" onClick={showToast}>
          Create Event
        </Button>
      </Toaster>
    </Wrapper>
  );
}

export function toastPromise(): ReactNode {
  function showToast() {
    promiseToast.promise(
      new Promise<{ name: string }>((resolve) => {
        window.setTimeout(() => resolve({ name: "Event" }), 2000);
      }),
      {
        loading: "Creating event…",
        success: (data) => `${data.name} created.`,
        error: "Could not create event.",
      },
    );
  }

  return (
    <Wrapper>
      <Toaster toastManager={promiseToast}>
        <Button variant="outline" onClick={showToast}>
          Create Event
        </Button>
      </Toaster>
    </Wrapper>
  );
}
