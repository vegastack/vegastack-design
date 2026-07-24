"use client";

import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
// `toast` is re-exported from the copied-in Sonner component. The `<Toaster />`
// itself is already mounted in `VegaStackProvider`, so previews just call toast().
import { toast } from "@/components/ui/sonner";

export function toastDemo(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => toast.success("Changes saved")}>
        Save changes
      </Button>
    </Wrapper>
  );
}

export function sonnerVariants(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => toast("Event created")}>
        Default
      </Button>
      <Button
        variant="success"
        onClick={() =>
          toast.success("Project deployed", {
            description: "main@a1f7c2 is live",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="info"
        onClick={() => toast.info("A new version is available")}
      >
        Info
      </Button>
      <Button
        variant="warning"
        onClick={() => toast.warning("Storage is almost full")}
      >
        Warning
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast.error("Could not save changes", {
            description: "Check your connection and try again",
          })
        }
      >
        Error
      </Button>
    </Wrapper>
  );
}

export function sonnerStates(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() =>
          toast("Invitation sent", {
            description: "sent to jane@vegastack.com",
            action: {
              label: "Undo",
              onClick: () => toast("Invitation revoked"),
            },
          })
        }
      >
        With action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
            loading: "Saving…",
            success: "Changes saved",
            error: "Save failed",
          })
        }
      >
        Promise
      </Button>
    </Wrapper>
  );
}

export function sonnerLoading(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading("Uploading file…");
          // Resolve the pending toast after the async work completes — call
          // `toast.success` (or `toast.dismiss`) with the same id to update it
          // in place rather than stacking a second toast.
          setTimeout(() => toast.success("File uploaded", { id }), 2000);
        }}
      >
        Loading → success
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading("Connecting…");
          setTimeout(() => toast.dismiss(id), 1500);
        }}
      >
        Loading → dismiss
      </Button>
    </Wrapper>
  );
}

export function sonnerMessageCustom(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() =>
          toast.message("New comment", {
            description: "Jane replied to your thread in #design.",
          })
        }
      >
        Message
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          // `toast.custom` renders fully custom JSX instead of the default
          // surface — useful for branded or richly-structured notifications.
          toast.custom((id) => (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-overlay">
              <CircleAlert
                className="size-(--icon-default) text-warning-text"
                aria-hidden
              />
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium">Subscription expiring</p>
                <p className="text-base text-muted-foreground">
                  Your plan renews in 3 days.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.dismiss(id)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))
        }
      >
        Custom JSX
      </Button>
    </Wrapper>
  );
}

export function sonnerToasterOptions(): ReactNode {
  return (
    <Wrapper>
      {/*
        NEVER mount a second <Toaster /> for a demo — Sonner BROADCASTS every toast() to
        every mounted toaster, so a local one duplicates each toast (once here, once from
        the app-root toaster in VegaStackProvider). Host-level defaults (position, expand)
        belong on that single root mount; anything per-toast — including `position` — can
        be passed to the toast() call itself, which is what this demo shows.
      */}
      <Button
        variant="outline"
        onClick={() =>
          toast("Deployment queued", {
            description: "Building from main@a1f7c2 — shown top-center.",
            position: "top-center",
          })
        }
      >
        Show top-center toast
      </Button>
    </Wrapper>
  );
}
