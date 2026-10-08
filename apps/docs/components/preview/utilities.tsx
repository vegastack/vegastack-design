"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ListView } from "@/components/ui/view-toggle";
import { useViewTransition } from "@/components/ui/use-view-transition";
import { useOptimisticAction } from "@/components/ui/use-optimistic-action";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";

/* ----------------------------------------------------------------------------
 * shimmer
 * --------------------------------------------------------------------------*/

export function shimmer(): ReactNode {
  return (
    <Wrapper>
      <p className="shimmer text-muted-foreground">Generating response…</p>
    </Wrapper>
  );
}

export function shimmerWithMarker(): ReactNode {
  return (
    <Wrapper>
      <Marker className="w-64">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">Reading 4 files…</MarkerContent>
      </Marker>
    </Wrapper>
  );
}

export function shimmerColor(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p className="shimmer shimmer-color-primary">Highlight: primary ink</p>
        <p className="shimmer shimmer-color-info">Highlight: info blue</p>
        <p className="shimmer shimmer-color-info/60">Highlight: info / 60%</p>
      </div>
    </Wrapper>
  );
}

export function shimmerDuration(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p className="shimmer">Default (2s)</p>
        <p className="shimmer shimmer-duration-1000">Faster (1s)</p>
      </div>
    </Wrapper>
  );
}

export function shimmerSpread(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p className="shimmer shimmer-spread-4">Narrow highlight band</p>
        <p className="shimmer shimmer-spread-24">Wide highlight band</p>
      </div>
    </Wrapper>
  );
}

export function shimmerAngle(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <p className="shimmer">Default tilt (20°)</p>
        <p className="shimmer shimmer-angle-45">Steeper tilt (45°)</p>
      </div>
    </Wrapper>
  );
}

export function shimmerReverse(): ReactNode {
  return (
    <Wrapper>
      <p className="shimmer shimmer-reverse text-muted-foreground">
        Reversed sweep direction
      </p>
    </Wrapper>
  );
}

export function shimmerOnce(): ReactNode {
  return (
    <Wrapper>
      <p className="shimmer shimmer-once shimmer-duration-1100 text-foreground">
        Response generated.
      </p>
    </Wrapper>
  );
}

export function shimmerRtl(): ReactNode {
  return (
    <Wrapper>
      <p dir="rtl" className="shimmer text-muted-foreground">
        جارٍ إنشاء الرد…
      </p>
    </Wrapper>
  );
}

/* ----------------------------------------------------------------------------
 * scroll-fade
 * --------------------------------------------------------------------------*/

export function scrollFade(): ReactNode {
  return (
    <Wrapper>
      <div className="scroll-fade h-48 w-64 overflow-y-auto rounded-lg border border-border">
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
            >
              Row {i + 1}
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

export function scrollFadeHorizontal(): ReactNode {
  return (
    <Wrapper>
      <div className="scroll-fade-x flex w-72 gap-2 overflow-x-auto rounded-lg border border-border p-3">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className="flex size-20 shrink-0 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function scrollFadeEdge(): ReactNode {
  return (
    <Wrapper>
      {/* `flex-wrap`: two 160px panels plus the gap exceed a 320px viewport, so the pair
          stacks rather than forcing the page to scroll sideways (WCAG 2.2 §1.4.10). At the
          docs' own width both still sit side by side, unchanged. */}
      <div className="flex flex-wrap justify-center gap-6">
        {(["scroll-fade-t", "scroll-fade-b"] as const).map((edge) => (
          <div key={edge} className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {edge}
            </span>
            <div
              className={`${edge} h-44 w-40 overflow-y-auto rounded-lg border border-border`}
            >
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                  >
                    Row {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

export function scrollFadeSize(): ReactNode {
  return (
    <Wrapper>
      {/* `flex-wrap` for the same reason as `scrollFadeEdge` — see the note there. */}
      <div className="flex flex-wrap justify-center gap-6">
        {(["scroll-fade-4", "scroll-fade-24"] as const).map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {size}
            </span>
            <div
              className={`scroll-fade ${size} h-44 w-40 overflow-y-auto rounded-lg border border-border`}
            >
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                  >
                    Row {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/* ----------------------------------------------------------------------------
 * motion-stagger, view transitions, optimistic Undo
 * --------------------------------------------------------------------------*/

function StaggerDemo(): ReactNode {
  const [loaded, setLoaded] = useState(true);
  const [round, setRound] = useState(0);
  const reload = () => {
    setLoaded(false);
    setTimeout(() => {
      setLoaded(true);
      setRound((r) => r + 1);
    }, 800);
  };
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={reload}
      >
        Reload
      </Button>
      {loaded ? (
        <ul key={round} className="motion-stagger flex flex-col gap-2">
          {[
            "Design review",
            "Ship the release",
            "Write the docs",
            "Plan Q4",
            "Retro",
          ].map((title) => (
            <li key={title} className="rounded-lg border p-3 text-sm">
              {title}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      )}
    </div>
  );
}

export function motionStagger(): ReactNode {
  return (
    <Wrapper>
      <StaggerDemo />
    </Wrapper>
  );
}

function ViewTransitionDemo(): ReactNode {
  const { start } = useViewTransition();
  const [view, setView] = useState<ListView>("list");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <ViewToggle
        value={view}
        onValueChange={(next) => void start(() => setView(next))}
        views={["list", "grid"]}
      />
      <div
        className={
          view === "grid" ? "grid grid-cols-3 gap-2" : "flex flex-col gap-2"
        }
      >
        {["One", "Two", "Three"].map((label) => (
          <div
            key={label}
            className="rounded-lg border p-3 text-sm"
            style={{ viewTransitionName: `vt-demo-${label.toLowerCase()}` }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function viewTransition(): ReactNode {
  return (
    <Wrapper>
      <ViewTransitionDemo />
    </Wrapper>
  );
}

function OptimisticUndoDemo(): ReactNode {
  const [tasks, setTasks] = useState([
    "Design review",
    "Ship the release",
    "Write the docs",
  ]);
  const archive = useOptimisticAction<string>({
    apply: (task) => setTasks((all) => all.filter((t) => t !== task)),
    revert: (task) =>
      setTasks((all) => (all.includes(task) ? all : [...all, task])),
    commit: () => new Promise((resolve) => setTimeout(resolve, 300)),
    message: (task) => `Archived “${task}”`,
  });
  return (
    <ul className="flex w-full max-w-sm flex-col gap-2">
      {tasks.map((task) => (
        <li
          key={task}
          className="flex items-center justify-between rounded-lg border p-2 ps-3 text-sm"
        >
          {task}
          <Button variant="ghost" size="sm" onClick={() => archive.run(task)}>
            Archive
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function optimisticUndo(): ReactNode {
  return (
    <Wrapper>
      <OptimisticUndoDemo />
    </Wrapper>
  );
}
