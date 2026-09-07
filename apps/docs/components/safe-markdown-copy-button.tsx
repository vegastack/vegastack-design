"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkdownCopy } from "@/components/use-markdown-copy";

/** "Copy Markdown" — the page's agent markdown, verbatim, through the shared `useMarkdownCopy`. */
export function SafeMarkdownCopyButton({
  markdownUrl,
}: {
  markdownUrl: string;
}) {
  const { status, copy } = useMarkdownCopy(markdownUrl, {
    success: "Markdown copied",
    error: "Could not copy the page Markdown",
  });

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="gap-2 [&_svg]:size-(--icon-inline)"
      disabled={status === "loading"}
      aria-busy={status === "loading"}
      onClick={() => copy()}
    >
      {status === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
      {status === "copied" ? "Copied" : "Copy Markdown"}
      <span className="sr-only" role="status">
        {status === "copied" ? "Page Markdown copied" : ""}
      </span>
    </Button>
  );
}
