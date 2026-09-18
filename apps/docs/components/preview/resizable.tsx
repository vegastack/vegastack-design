"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/resizable` (dogfoods the registry) → auto-scanned.
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

/*
 * Upstream's own examples, adapted only for import paths and — for RTL — for the fact that
 * upstream's `useTranslation`/`language-selector` pair does not exist here. This component is not a
 * Base UI part, so its reading direction comes from the `dir` attribute upstream's own example
 * sets, not from `DirectionProvider`.
 */

export function resizable(): ReactNode {
  return (
    <Wrapper>
      <ResizablePanelGroup
        orientation="horizontal"
        className="max-w-sm rounded-lg border"
      >
        <ResizablePanel defaultSize="50%">
          <div className="flex h-[200px] items-center justify-center p-6">
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="25%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Two</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="75%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Three</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}

export function resizableAbout(): ReactNode {
  return (
    <Wrapper>
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[160px] max-w-sm rounded-lg border"
      >
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Drag the bar,
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize panels" />
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            or focus it and use the arrow keys.
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}

export function resizableComposition(): ReactNode {
  return (
    <Wrapper>
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[160px] max-w-sm rounded-lg border"
      >
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="50%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Two</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}

export function resizableVertical(): ReactNode {
  return (
    <Wrapper>
      <ResizablePanelGroup
        orientation="vertical"
        className="min-h-[200px] max-w-sm rounded-lg border"
      >
        <ResizablePanel defaultSize="25%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Header</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="75%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}

/**
 * Groups nest either way round: a horizontal group inside a vertical panel, which puts the inner
 * handle's end against the outer handle and forms a T-junction. The geometry lane excludes this
 * fixture by name — the crossing handles are what it is excluded for.
 */
export function resizableNested(): ReactNode {
  return (
    <Wrapper>
      <ResizablePanelGroup
        orientation="vertical"
        className="min-h-[220px] max-w-sm rounded-lg border"
      >
        <ResizablePanel defaultSize="30%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Header</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="70%">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize="40%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">List</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="60%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Detail</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}

export function resizableHandle(): ReactNode {
  return (
    <Wrapper>
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[200px] max-w-sm rounded-lg border"
      >
        <ResizablePanel defaultSize="25%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="75%">
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}

/** Upstream drives its RTL copy through `useTranslation`; the Arabic strings are inline here. */
const arabic = { one: "واحد", two: "اثنان", three: "ثلاثة" };

export function resizableRtl(): ReactNode {
  return (
    <Wrapper dir="rtl">
      <ResizablePanelGroup
        orientation="horizontal"
        className="max-w-sm rounded-lg border"
        dir="rtl"
      >
        <ResizablePanel defaultSize="50%">
          <div className="flex h-[200px] items-center justify-center p-6">
            <span className="font-semibold">{arabic.one}</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%">
          <ResizablePanelGroup orientation="vertical" dir="rtl">
            <ResizablePanel defaultSize="25%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">{arabic.two}</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="75%">
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">{arabic.three}</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Wrapper>
  );
}
