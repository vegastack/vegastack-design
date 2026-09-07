import { Badge } from "@/components/ui/badge";
import { SafeMarkdownCopyButton } from "@/components/safe-markdown-copy-button";
import { CopyPromptButton } from "@/components/copy-prompt";
import type { PageStatus } from "@/lib/shared";

/**
 * Deterministic, server-rendered "Last updated" stamp. Replaces fumadocs' `PageLastUpdate`,
 * which renders `toLocaleDateString()` (locale-dependent "7/18/2026") inside a client
 * `useEffect` — numeric US format + a visible hydration pop-in. This formats once on the
 * server as "Jul 18, 2026" with a semantic `<time>` element.
 */
const LAST_UPDATED_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function LastUpdated({ date }: { date: Date }) {
  return (
    <p className="ms-auto text-sm text-muted-foreground">
      Last updated{" "}
      <time dateTime={date.toISOString()}>
        {LAST_UPDATED_FORMAT.format(date)}
      </time>
    </p>
  );
}

const STATUS_INTENT: Record<PageStatus, "default" | "info" | "warning"> = {
  stable: "default",
  preview: "info",
  deprecated: "warning",
};

/**
 * Canon row 0 in the page header: the frontmatter facts a reader — and, through
 * `getLLMText`, an agent — sees before the body. Renders nothing for a page that declares none.
 */
export function PageFacts({
  status,
  since,
  a11y,
}: {
  status?: PageStatus;
  since?: string;
  a11y?: string;
}) {
  if (!status && !since && !a11y) return null;
  return (
    <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {status ? (
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Status</dt>
          <dd>
            <Badge intent={STATUS_INTENT[status]} data-page-status={status}>
              {status}
            </Badge>
          </dd>
        </div>
      ) : null}
      {since ? (
        <div className="flex items-center gap-1.5">
          <dt>Since</dt>
          <dd>
            <code>{since}</code>
          </dd>
        </div>
      ) : null}
      {a11y ? (
        <div className="flex items-center gap-1.5">
          <dt>Accessibility pattern</dt>
          <dd>{a11y}</dd>
        </div>
      ) : null}
    </dl>
  );
}

/**
 * The action row under the title: "Copy Markdown" for every page, "Copy Prompt" ONCE per
 * component page (DC-04/DD-2), the fumadocs view options, and the git-derived timestamp.
 */
export function PageActions({
  markdownUrl,
  registryName,
  lastModified,
  children,
}: {
  markdownUrl: string;
  /** The registry item the page documents; present only on component pages. */
  registryName?: string;
  lastModified?: Date;
  /** The fumadocs `ViewOptionsPopover`, passed in by the page that knows its GitHub path. */
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-2 border-b pb-6">
      <SafeMarkdownCopyButton markdownUrl={markdownUrl} />
      {registryName ? (
        <CopyPromptButton
          componentName={registryName}
          markdownUrl={markdownUrl}
        />
      ) : null}
      {children}
      {lastModified ? <LastUpdated date={lastModified} /> : null}
    </div>
  );
}
