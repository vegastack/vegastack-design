// @vegastack sidebar-16@0.9.1 sha256-In29Ptsvg6/MI35gm08qZ2u6SQ5fO6/so/Pnic6KH4c=

import { Label } from "@/components/ui/label";
import { SidebarInput } from "@/components/ui/sidebar";
import { SearchIcon } from "lucide-react";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          placeholder="Type to search..."
          className="h-8 ps-7"
        />
        <SearchIcon className="pointer-events-none absolute top-1/2 start-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  );
}
