// @vegastack board-01@0.9.1 sha256-0k1cjv9FStrSO4B3smlS3NVNcYd6k5Qk1fdtIDVZxPw=

import { Plus } from "lucide-react";

import { BoardView } from "./components/board-view";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Drag a card, or press Space on a focused card to move it with the
            keyboard.
          </p>
        </div>
        <Button size="sm">
          <Plus />
          New task
        </Button>
      </div>
      <BoardView />
    </div>
  );
}
