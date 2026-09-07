"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkdownCopy } from "@/components/use-markdown-copy";

export interface CopyPromptButtonProps {
  /**
   * Registry component name (e.g. `"button"`) — drives the composed
   * `pnpm dlx shadcn@latest add @vegastack/<name>` install command.
   */
  componentName: string;
  /** The page's markdown URL, resolved by the server page through `getPageMarkdownUrl()`. */
  markdownUrl: string;
  /**
   * Human-facing name used in the composed prompt text.
   * @default a title-cased version of `componentName`
   */
  displayName?: string;
}

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * `CopyPromptButton` — copies an LLM-ready prompt for the current component page to the
 * clipboard: the component name, its `shadcn add` install command, and the page's agent markdown
 * (the same `.md` the "Copy Markdown" button fetches — fixture source and flat API tables
 * included). Rendered ONCE per page in the header (DC-04/DD-2), never per preview frame.
 */
export function CopyPromptButton({
  componentName,
  markdownUrl,
  displayName,
}: CopyPromptButtonProps) {
  const name = displayName ?? toTitleCase(componentName);
  const { status, copy } = useMarkdownCopy(markdownUrl, {
    success: `${name} prompt copied — paste it into your AI assistant`,
    error: "Could not copy the prompt",
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-slot="copy-prompt-button"
      className="gap-1.5 [&_svg]:size-(--icon-inline)"
      disabled={status === "loading"}
      aria-busy={status === "loading"}
      onClick={() =>
        copy((markdown) =>
          [
            `Use the VegaStack ${name} component in this project.`,
            "",
            "Install it:",
            "```bash",
            `pnpm dlx shadcn@latest add @vegastack/${componentName}`,
            "```",
            "",
            "Component docs and usage, from the VegaStack design system:",
            "",
            markdown.trim(),
          ].join("\n"),
        )
      }
    >
      {status === "copied" ? <Check aria-hidden /> : <Sparkles aria-hidden />}
      {status === "copied" ? "Copied" : "Copy Prompt"}
      <span className="sr-only" role="status">
        {status === "copied" ? `${name} prompt copied` : ""}
      </span>
    </Button>
  );
}
