"use client";

import * as React from "react";
import { usePathname } from "fumadocs-core/framework";
import { Check, Sparkles } from "lucide-react";
import { TIMINGS } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { docsRoute } from "@/lib/shared";

export interface CopyPromptButtonProps {
  /**
   * Registry component name (e.g. `"button"`) — drives the composed
   * `pnpm dlx shadcn@latest add @vegastack/<name>` install command.
   */
  componentName: string;
  /**
   * Human-facing name used in the composed prompt text.
   * @default a title-cased version of `componentName`
   */
  displayName?: string;
}

// Keyed by the resolved markdown URL — mirrors fumadocs' own `MarkdownCopyButton` cache
// (`page-actions.tsx`) so re-clicking, or a second ComponentPreview on the same page, never
// refetches the same generated Markdown file.
const markdownCache = new Map<string, Promise<string>>();

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * `CopyPromptButton` — copies an LLM-ready prompt for the current component page to the
 * clipboard: the component name, its `shadcn add` install command, and the page's raw markdown
 * (fetched at runtime from the same static `.md` sibling route fumadocs' own "Copy Markdown"
 * button uses — see `getPageMarkdownUrl` in `lib/source.ts`). Paste the result straight into an
 * AI assistant to scaffold usage.
 *
 * Static-export-friendly: production fetches the materialized `.md` sibling. Development uses
 * the pre-rendered Fumadocs staging route before the export postprocessor runs.
 */
export function CopyPromptButton({
  componentName,
  displayName,
}: CopyPromptButtonProps) {
  const pathname = usePathname();
  const [status, setStatus] = React.useState<"idle" | "loading" | "copied">(
    "idle",
  );
  const revertTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  React.useEffect(() => () => clearTimeout(revertTimer.current), []);

  const name = displayName ?? toTitleCase(componentName);

  const handleClick = React.useCallback(async () => {
    const relativePath = pathname.startsWith(docsRoute)
      ? pathname.slice(docsRoute.length)
      : pathname;
    const markdownUrl =
      process.env.NODE_ENV === "development"
        ? `/llms.mdx/docs${relativePath}/content.md`
        : `${pathname}.md`;

    setStatus("loading");
    try {
      const cached = markdownCache.get(markdownUrl);
      const promise =
        cached ??
        fetch(markdownUrl).then((res) => {
          if (!res.ok)
            throw new Error(`Markdown request failed with ${res.status}`);
          return res.text();
        });
      if (!cached) markdownCache.set(markdownUrl, promise);
      const markdown = await promise.catch((error) => {
        markdownCache.delete(markdownUrl);
        throw error;
      });

      const installCommand = `pnpm dlx shadcn@latest add @vegastack/${componentName}`;
      const prompt = [
        `Use the VegaStack ${name} component in this project.`,
        "",
        "Install it:",
        "```bash",
        installCommand,
        "```",
        "",
        "Component docs and usage, from the VegaStack design system:",
        "",
        markdown.trim(),
      ].join("\n");

      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
      toast.success(`${name} prompt copied — paste it into your AI assistant`);
      revertTimer.current = setTimeout(
        () => setStatus("idle"),
        TIMINGS.feedbackRevertMs,
      );
    } catch {
      // Clipboard write / fetch can both reject (denied permission, offline, insecure context) —
      // fall back to idle rather than claim a false success.
      setStatus("idle");
      toast.error("Could not copy the prompt");
    }
  }, [componentName, name, pathname]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-slot="copy-prompt-button"
      className="gap-1.5 [&_svg]:size-(--icon-inline)"
      disabled={status === "loading"}
      onClick={handleClick}
    >
      {status === "copied" ? <Check aria-hidden /> : <Sparkles aria-hidden />}
      {status === "copied" ? "Copied" : "Copy Prompt"}
      <span className="sr-only" role="status">
        {status === "copied" ? `${name} prompt copied` : ""}
      </span>
    </Button>
  );
}
