"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Entry,
  EntryActions,
  EntryList,
  EntryMeta,
} from "@/components/ui/entry-list";

export function entryList(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-md">
        <EntryList className="gap-1">
          <Entry>
            <span className="min-w-0">
              Task Install glazing is now Done{" "}
              <EntryMeta>(Asha, 2h ago)</EntryMeta>
            </span>
            <EntryActions>
              <Button variant="ghost" size="xs">
                Open
              </Button>
              <Button variant="ghost" size="xs">
                Looks fine
              </Button>
            </EntryActions>
          </Entry>
          <Entry>
            <span className="min-w-0">
              Product Linear 40 was renamed{" "}
              <EntryMeta>(Sanjay, yesterday)</EntryMeta>
            </span>
            <EntryActions>
              <Button variant="ghost" size="xs">
                Open
              </Button>
            </EntryActions>
          </Entry>
        </EntryList>
      </div>
    </Wrapper>
  );
}

export function entryListStacked(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-md">
        <EntryList className="gap-2">
          <Entry layout="stack">
            <EntryMeta>2h ago · Asha</EntryMeta>
            Rewrote the warranty section
          </Entry>
          <Entry layout="stack">
            <EntryMeta>Yesterday · Sanjay</EntryMeta>
            Added the beam angle table
          </Entry>
        </EntryList>
      </div>
    </Wrapper>
  );
}
