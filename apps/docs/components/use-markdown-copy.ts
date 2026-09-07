"use client";

import * as React from "react";
import { TIMINGS } from "@vegastack/design";
import { toast } from "@/components/ui/sonner";

export type MarkdownCopyStatus = "idle" | "loading" | "copied";

// Keyed by the resolved markdown URL — mirrors fumadocs' own `MarkdownCopyButton` cache so
// re-clicking, or a second button on the same page, never refetches the same generated file.
const markdownCache = new Map<string, Promise<string>>();

function fetchMarkdown(markdownUrl: string) {
  const cached = markdownCache.get(markdownUrl);
  if (cached) return cached;
  const request = fetch(markdownUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Markdown request failed with ${response.status}`);
    }
    return response.text();
  });
  markdownCache.set(markdownUrl, request);
  return request.catch((error: unknown) => {
    markdownCache.delete(markdownUrl);
    throw error;
  });
}

/**
 * `useMarkdownCopy(markdownUrl)` — the ONE fetch-and-copy state machine behind every
 * "copy this page as Markdown" control (DC-10). The page's server component resolves
 * `markdownUrl` through `getPageMarkdownUrl()` (dev staging route vs. the exported `.md` sibling)
 * and passes it down; no client re-derives the URL.
 *
 * `copy(compose)` fetches (cached), lets the caller wrap the markdown (a prompt preamble, or
 * nothing), writes the clipboard, and reports through the toast pair. Clipboard write and fetch
 * can both reject (denied permission, offline, insecure context) — the hook falls back to `idle`
 * rather than claiming a false success.
 */
export function useMarkdownCopy(
  markdownUrl: string,
  messages: { success: string; error: string },
) {
  const [status, setStatus] = React.useState<MarkdownCopyStatus>("idle");
  const revertTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  React.useEffect(() => () => clearTimeout(revertTimer.current), []);

  const copy = React.useCallback(
    async (compose: (markdown: string) => string = (markdown) => markdown) => {
      setStatus("loading");
      try {
        const markdown = await fetchMarkdown(markdownUrl);
        await navigator.clipboard.writeText(compose(markdown));
        setStatus("copied");
        toast.success(messages.success);
        revertTimer.current = setTimeout(
          () => setStatus("idle"),
          TIMINGS.feedbackRevertMs,
        );
      } catch {
        setStatus("idle");
        toast.error(messages.error);
      }
    },
    [markdownUrl, messages.success, messages.error],
  );

  return { status, copy };
}
