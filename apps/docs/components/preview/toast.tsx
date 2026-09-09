"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
// `toast` is the imperative API from the copied-in Toast component. The `<Toaster />` itself is
// already mounted in `VegaStackProvider`, so previews just call toast().
import { toast } from "@/components/ui/toast";

export function toastDemo(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => toast.success("Changes saved")}>
        Save changes
      </Button>
    </Wrapper>
  );
}

export function toastTypes(): ReactNode {
  return (
    <Wrapper>
      <Button variant="outline" onClick={() => toast("Event created")}>
        Default
      </Button>
      <Button
        variant="soft"
        tone="success"
        onClick={() =>
          toast.success("Project deployed", {
            description: "main@a1f7c2 is live",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="soft"
        tone="info"
        onClick={() => toast.info("A new version is available")}
      >
        Info
      </Button>
      <Button
        variant="soft"
        tone="warning"
        onClick={() => toast.warning("Storage is almost full")}
      >
        Warning
      </Button>
      <Button
        variant="soft"
        tone="destructive"
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

export function toastStates(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() =>
          toast("Invitation sent", {
            description: "sent to jane@vegastack.com",
            actionProps: {
              children: "Undo",
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

export function toastLoading(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading("Uploading file…");
          // A `loading` toast never auto-dismisses. Resolve it in place with the same id —
          // `toast.update` swaps the type and restarts the auto-dismiss timer, rather than
          // stacking a second toast.
          setTimeout(
            () => toast.update(id, { type: "success", title: "File uploaded" }),
            2000,
          );
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

export function toastStacking(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() => {
          toast("Build queued", { description: "main@a1f7c2" });
          toast.success("Tests passed", { description: "482 of 482" });
          toast.info("Preview ready", {
            description: "deploy-a1f7c2.vercel.app",
          });
        }}
      >
        Fire three toasts
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Deduplicated", {
            id: "dedupe-demo",
            description: "Firing this again updates the same toast in place.",
          })
        }
      >
        Fire the same id twice
      </Button>
    </Wrapper>
  );
}

export function toastCustom(): ReactNode {
  return (
    <Wrapper>
      <Button
        variant="outline"
        onClick={() =>
          // `toast.custom` renders the toast BODY yourself — stacking, swipe-to-dismiss,
          // Escape and the live-region announcement all still apply, because it is still a
          // real toast.
          toast.custom((item) => (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-base font-medium">Subscription expiring</p>
              <p className="text-base text-muted-foreground">
                Your plan renews in 3 days.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="self-start"
                onClick={() => toast.dismiss(item.id)}
              >
                Manage plan
              </Button>
            </div>
          ))
        }
      >
        Custom body
      </Button>
    </Wrapper>
  );
}

export function toastToasterOptions(): ReactNode {
  return (
    <Wrapper>
      {/*
        NEVER mount a second <Toaster /> for a demo — every toast() lands in the one provider
        mounted at the app root, so a local viewport would render each toast twice. Host-level
        defaults (position, limit, timeout) belong on that single mount; anything per-toast goes
        on the toast() call itself, which is what this demo shows.
      */}
      <Button
        variant="outline"
        onClick={() =>
          toast("Deployment queued", {
            description: "Building from main@a1f7c2 — this one stays for 15s.",
            timeout: 15000,
          })
        }
      >
        Longer-lived toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning("Session expiring", {
            description: "Stays until you dismiss it.",
            timeout: 0,
          })
        }
      >
        Never auto-dismiss
      </Button>
    </Wrapper>
  );
}
