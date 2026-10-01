// @vegastack page-editor-01@0.23.114 sha256-aoX5Qs34wtRnAu+j4WRWdkSMpjyz8vPBmVkWKXMEgUw=

import { PageEditor } from "./components/page-editor";
import { AppShellPage } from "@/components/ui/app-shell";

/**
 * `page-editor-01` — a document page (Notion style) with comments beside the text: a header with
 * the breadcrumb, save state, who else is here, the comment count and version history; an outline
 * rail; the page itself (`TextEdit` with comment highlights); the threads in a margin on wide
 * screens and in a popover below that; and a version sheet with a diff and "Restore this version".
 *
 * Server-safe: the interactive half is the client leaf it imports.
 *
 * @example
 * // app/library/[id]/page.tsx, straight after `shadcn add @vegastack/page-editor-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <AppShellPage size="full">
      <PageEditor />
    </AppShellPage>
  );
}
