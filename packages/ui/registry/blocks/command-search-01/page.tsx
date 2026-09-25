// @vegastack command-search-01@0.23.30 sha256-X05RvG8S1wYpUDzOMOliiLVIIZ+Rt0i0AIf6CbJTqAc=

"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { CommandSearch } from "./components/command-search";
import { RECENTS, sampleSearch } from "./components/sample-search";
import { AppShellPage } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatShortcut,
  isEditableTarget,
  usePlatform,
} from "@/components/ui/use-platform";

/**
 * `command-search-01` — the search palette on a page: a Search button (and ⌘K / Ctrl+K) opening
 * `CommandSearch` over the sample index. In an app, mount the palette once in the shell and open
 * it from the sidebar's Search row.
 *
 * @example
 * // app/search-demo/page.tsx, straight after `shadcn add @vegastack/command-search-01`
 * export { default } from "./page";
 */
export default function Page() {
  const { os } = usePlatform();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event)) return;
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AppShellPage size="narrow">
      <PageHeader
        title="Search"
        description="Find meetings, tasks, products, customers and pages."
      />
      <Button
        variant="outline"
        className="justify-start gap-2 text-muted-foreground"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
      >
        <Search />
        Search…
        <Kbd aria-hidden className="ms-auto">
          {formatShortcut(["mod", "K"], os)}
        </Kbd>
      </Button>
      <CommandSearch
        search={sampleSearch}
        recents={RECENTS}
        open={open}
        onOpenChange={setOpen}
      />
    </AppShellPage>
  );
}
