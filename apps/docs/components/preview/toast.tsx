"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/toast` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Toast,
  ToastArrow,
  ToastContent,
  ToastPortal,
  ToastPositioner,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  createToastManager,
  useToastManager,
  type ToastPosition,
} from "@/components/ui/toast";

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
const positionToast = createToastManager();
const anchoredToast = createToastManager();
const customToast = createToastManager();
const updateToast = createToastManager();

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

const POSITIONS = [
  "top-start",
  "top-center",
  "top-end",
  "bottom-start",
  "bottom-center",
  "bottom-end",
] as const satisfies readonly ToastPosition[];

export function toastPosition(): ReactNode {
  function Demo() {
    const [position, setPosition] = useState<ToastPosition>("bottom-end");

    return (
      <Toaster toastManager={positionToast} position={position}>
        {POSITIONS.map((corner) => (
          <Button
            key={corner}
            variant={corner === position ? "default" : "outline"}
            onClick={() => {
              setPosition(corner);
              positionToast.add({
                title: "Event created",
                description: `Pinned to ${corner}.`,
              });
            }}
          >
            {corner}
          </Button>
        ))}
      </Toaster>
    );
  }

  return (
    <Wrapper>
      <Demo />
    </Wrapper>
  );
}

export function toastAnchored(): ReactNode {
  function AnchoredList({ anchor }: { anchor: Element | null }) {
    const { toasts } = useToastManager();

    return toasts.map((item) => (
      // An anchored toast is not in the corner stack, so it sizes itself rather than filling a
      // viewport — the width lives on the positioner. The root needs nothing: `Toast` reads the
      // positioner from context and drops the stack recipe itself (OVL-15).
      <ToastPositioner
        key={item.id}
        toast={item}
        anchor={anchor}
        side="top"
        sideOffset={8}
        className="w-56"
      >
        <Toast toast={item}>
          <ToastContent>
            <ToastTitle />
          </ToastContent>
          <ToastArrow />
        </Toast>
      </ToastPositioner>
    ));
  }

  function Demo() {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

    return (
      <ToastProvider toastManager={anchoredToast}>
        <Button
          ref={setAnchor}
          variant="outline"
          onClick={() => anchoredToast.add({ title: "Copied to clipboard" })}
        >
          Copy link
        </Button>
        <ToastPortal>
          <ToastViewport>
            <AnchoredList anchor={anchor} />
          </ToastViewport>
        </ToastPortal>
      </ToastProvider>
    );
  }

  return (
    <Wrapper>
      <Demo />
    </Wrapper>
  );
}

export function toastCustom(): ReactNode {
  function showToast() {
    const id = customToast.add({
      data: {
        render: () => (
          <div className="flex w-full items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              VS
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">Ada Lovelace</span>
              <span className="truncate text-sm text-muted-foreground">
                Mentioned you in Analytics
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => customToast.close(id)}
            >
              Reply
            </Button>
          </div>
        ),
      },
    });
  }

  return (
    <Wrapper>
      <Toaster toastManager={customToast}>
        <Button variant="outline" onClick={showToast}>
          Show notification
        </Button>
      </Toaster>
    </Wrapper>
  );
}

export function toastUpdate(): ReactNode {
  function showToast() {
    const id = updateToast.add({
      type: "loading",
      title: "Uploading report.pdf",
      timeout: 0,
    });
    window.setTimeout(() => {
      updateToast.update(id, {
        type: "success",
        title: "report.pdf uploaded",
        description: "2.4 MB · Analytics",
        timeout: 5000,
      });
    }, 1600);
  }

  return (
    <Wrapper>
      <Toaster toastManager={updateToast}>
        <Button variant="outline" onClick={showToast}>
          Upload file
        </Button>
      </Toaster>
    </Wrapper>
  );
}
