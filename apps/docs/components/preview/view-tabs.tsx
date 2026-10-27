"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ViewTabs, type ViewTabsView } from "@/components/ui/view-tabs";

const VIEWS: ViewTabsView[] = [
  { id: "all", name: "All requests", kind: "grid", scope: "shared" },
  { id: "open", name: "Open by customer", kind: "grid", scope: "shared" },
  { id: "status", name: "By status", kind: "board", scope: "locked" },
  { id: "mine", name: "My follow-ups", kind: "grid", scope: "personal" },
];

export function viewTabs(): ReactNode {
  const [views, setViews] = useState(VIEWS);
  const [value, setValue] = useState("all");
  return (
    <Wrapper className="block">
      <ViewTabs
        views={views}
        value={value}
        onValueChange={setValue}
        // The host's own create step would ask for a name and "Only visible to me"; the
        // preview adds a shared view straight away.
        onCreate={(kind) => {
          const id = `v${views.length + 1}`;
          setViews([
            ...views,
            {
              id,
              name: kind === "board" ? "New board" : "New view",
              kind,
              scope: "shared",
            },
          ]);
          setValue(id);
        }}
        getViewActions={(view) => (
          <>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            {view.scope === "locked" ? null : (
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            )}
          </>
        )}
      />
    </Wrapper>
  );
}

export function viewTabsNarrow(): ReactNode {
  const [value, setValue] = useState("open");
  return (
    <Wrapper className="block">
      <div className="max-w-80">
        <ViewTabs views={VIEWS} value={value} onValueChange={setValue} />
      </div>
    </Wrapper>
  );
}
