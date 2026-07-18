'use client';

import * as React from 'react';
import { usePathname } from 'fumadocs-core/framework';
import { Check, Sparkles } from 'lucide-react';
import { TIMINGS } from '@vegastack/design';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { docsContentRoute, docsRoute } from '@/lib/shared';

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
// refetches the same `content.md`.
const markdownCache = new Map<string, Promise<string>>();

function toTitleCase(slug: string) {
  return slug
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

/**
 * `CopyPromptButton` — copies an LLM-ready prompt for the current component page to the
 * clipboard: the component name, its `shadcn add` install command, and the page's raw markdown
 * (fetched at runtime from the same static `.md` sibling route fumadocs' own "Copy Markdown"
 * button uses — see `getPageMarkdownUrl` in `lib/source.ts`). Paste the result straight into an
 * AI assistant to scaffold usage.
 *
 * Static-export-friendly: the markdown is fetched client-side from a pre-rendered route
 * (`/llms.mdx/docs/**\/content.md`), not read from disk at request time.
 */
export function CopyPromptButton({ componentName, displayName }: CopyPromptButtonProps) {
  const pathname = usePathname();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'copied'>('idle');
  const revertTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(revertTimer.current), []);

  const name = displayName ?? toTitleCase(componentName);

  const handleClick = React.useCallback(async () => {
    const relativePath = pathname.startsWith(docsRoute) ? pathname.slice(docsRoute.length) : pathname;
    const markdownUrl = `${docsContentRoute}${relativePath}/content.md`;

    setStatus('loading');
    try {
      const cached = markdownCache.get(markdownUrl);
      const promise = cached ?? fetch(markdownUrl).then((res) => res.text());
      if (!cached) markdownCache.set(markdownUrl, promise);
      const markdown = await promise;

      const installCommand = `pnpm dlx shadcn@latest add @vegastack/${componentName}`;
      const prompt = [
        `Use the VegaStack ${name} component in this project.`,
        '',
        'Install it:',
        '```bash',
        installCommand,
        '```',
        '',
        'Component docs and usage, from the VegaStack design system:',
        '',
        markdown.trim(),
      ].join('\n');

      await navigator.clipboard.writeText(prompt);
      setStatus('copied');
      toast.success(`${name} prompt copied — paste it into your AI assistant`);
      revertTimer.current = setTimeout(() => setStatus('idle'), TIMINGS.feedbackRevertMs);
    } catch {
      // Clipboard write / fetch can both reject (denied permission, offline, insecure context) —
      // fall back to idle rather than claim a false success.
      setStatus('idle');
      toast.error('Could not copy the prompt');
    }
  }, [componentName, name, pathname]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-slot="copy-prompt-button"
      className="gap-1.5 [&_svg]:size-3.5"
      disabled={status === 'loading'}
      onClick={handleClick}
    >
      {status === 'copied' ? <Check aria-hidden /> : <Sparkles aria-hidden />}
      {status === 'copied' ? 'Copied' : 'Copy Prompt'}
      <span className="sr-only" role="status">
        {status === 'copied' ? `${name} prompt copied` : ''}
      </span>
    </Button>
  );
}
