// @vegastack board-01@0.23.5 sha256-bKOIjWxpron/UlnbkYIQNh8a28u7gfV8FWM/ltyBJqI=

import { Plus } from "lucide-react";

import { BoardView } from "./components/board-view";
import { AppShellPage } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/**
 * `board-01` — the board page: a `PageHeader` h1 with its create action over `BoardView`, the
 * filtered board. It fills the content region (`AppShellPage size="full"`), because a board uses
 * the whole width and scrolls its lanes sideways inside it.
 *
 * Server-safe: the interactive half is the client leaf it imports.
 *
 * @example
 * // app/tasks/page.tsx, straight after `shadcn add @vegastack/board-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <AppShellPage size="full">
      <PageHeader
        title="Tasks"
        description="Drag a card, or press Space on a focused card to move it with the keyboard."
        actions={
          <Button>
            <Plus />
            New task
          </Button>
        }
      />
      <BoardView />
    </AppShellPage>
  );
}
