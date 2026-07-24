"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { TIMINGS } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

const markdownCache = new Map<string, Promise<string>>();

export function SafeMarkdownCopyButton({
  markdownUrl,
}: {
  markdownUrl: string;
}) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "copied">(
    "idle",
  );
  const revertTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  React.useEffect(() => () => clearTimeout(revertTimer.current), []);

  const copy = React.useCallback(async () => {
    setStatus("loading");
    try {
      const cached = markdownCache.get(markdownUrl);
      const request =
        cached ??
        fetch(markdownUrl).then((response) => {
          if (!response.ok)
            throw new Error(`Markdown request failed with ${response.status}`);
          return response.text();
        });
      if (!cached) markdownCache.set(markdownUrl, request);
      const markdown = await request.catch((error) => {
        markdownCache.delete(markdownUrl);
        throw error;
      });
      await navigator.clipboard.writeText(markdown);
      setStatus("copied");
      toast.success("Markdown copied");
      revertTimer.current = setTimeout(
        () => setStatus("idle"),
        TIMINGS.feedbackRevertMs,
      );
    } catch {
      setStatus("idle");
      toast.error("Could not copy the page Markdown");
    }
  }, [markdownUrl]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="gap-2 [&_svg]:size-(--icon-inline)"
      disabled={status === "loading"}
      aria-busy={status === "loading"}
      onClick={copy}
    >
      {status === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
      {status === "copied" ? "Copied" : "Copy Markdown"}
      <span className="sr-only" role="status">
        {status === "copied" ? "Page Markdown copied" : ""}
      </span>
    </Button>
  );
}
