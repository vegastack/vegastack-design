"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  DestinationPicker,
  type Destination,
  type DestinationFolder,
} from "@/components/ui/destination-picker";

const SPACES = [
  { id: "sales", label: "Sales" },
  { id: "design", label: "Design" },
  { id: "mine", label: "My space" },
];

const FOLDERS: Record<string, DestinationFolder[]> = {
  "sales:": [
    { id: "contracts", label: "Contracts" },
    { id: "pricing", label: "Pricing", hasChildren: false },
  ],
  "sales:contracts": [{ id: "2026", label: "2026", hasChildren: false }],
  "design:": [{ id: "brand", label: "Brand", hasChildren: false }],
};

async function loadFolders(spaceId: string, parentId: string | null) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return FOLDERS[`${spaceId}:${parentId ?? ""}`] ?? [];
}

/** A Move to… dialog body: spaces, their folders, recents and a folder search. */
export function destinationPicker(): ReactNode {
  const [value, setValue] = useState<Destination | null>(null);
  return (
    <Wrapper className="block max-w-md">
      <DestinationPicker
        spaces={SPACES}
        loadFolders={loadFolders}
        value={value}
        onValueChange={setValue}
        disabledReason={(d) =>
          d.spaceId === "sales" && d.folderId === "pricing"
            ? "It's already here"
            : undefined
        }
        recents={[
          {
            spaceId: "sales",
            folderId: "contracts",
            label: "Contracts",
            path: "Sales",
          },
        ]}
        search={async (query) =>
          "brand".includes(query.toLowerCase())
            ? [
                {
                  spaceId: "design",
                  folderId: "brand",
                  label: "Brand",
                  path: "Design",
                },
              ]
            : []
        }
      />
    </Wrapper>
  );
}
