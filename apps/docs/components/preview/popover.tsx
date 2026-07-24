"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/popover` (dogfoods the registry) → auto-scanned.
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverTitle,
  PopoverDescription,
  PopoverArrow,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function popover(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Rename project</Button>}
        />
        <PopoverContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <PopoverTitle>Rename project</PopoverTitle>
              <PopoverDescription>
                Give this project a new display name.
              </PopoverDescription>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="popover-name">Name</Label>
              <Input id="popover-name" defaultValue="acme-platform" />
            </div>
            <div className="flex justify-end gap-2">
              <PopoverClose
                render={
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                }
              />
              <PopoverClose render={<Button size="sm">Save name</Button>} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverForm(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Set dimensions</Button>}
        />
        <PopoverContent className="w-80">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <PopoverTitle>Dimensions</PopoverTitle>
              <PopoverDescription>
                Set the width and height for the selected layer.
              </PopoverDescription>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-3">
                <Label htmlFor="popover-width">Width</Label>
                <Input
                  id="popover-width"
                  defaultValue="100%"
                  className="col-span-2"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-3">
                <Label htmlFor="popover-height">Height</Label>
                <Input
                  id="popover-height"
                  defaultValue="24px"
                  className="col-span-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <PopoverClose
                render={
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                }
              />
              <PopoverClose render={<Button size="sm">Save</Button>} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverSides(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Top</Button>} />
        <PopoverContent side="top" className="w-auto">
          On top
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Right</Button>} />
        <PopoverContent side="right" className="w-auto">
          On the right
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Bottom</Button>} />
        <PopoverContent side="bottom" className="w-auto">
          On the bottom
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Left</Button>} />
        <PopoverContent side="left" className="w-auto">
          On the left
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverAlign(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Align start</Button>}
        />
        <PopoverContent align="start" className="w-auto">
          Aligned to the start edge
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Align center</Button>}
        />
        <PopoverContent align="center" className="w-auto">
          Centered on the trigger
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Align end</Button>} />
        <PopoverContent align="end" className="w-auto">
          Aligned to the end edge
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverArrow(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Show details</Button>}
        />
        <PopoverContent arrow>
          <div className="flex flex-col gap-1">
            <PopoverTitle>Connected</PopoverTitle>
            <PopoverDescription>
              The arrow points back at the trigger so the anchor stays obvious.
            </PopoverDescription>
          </div>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverArrowComposed(): ReactNode {
  return (
    <Wrapper>
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline">Composed arrow</Button>}
        />
        <PopoverContent>
          <PopoverArrow />
          <div className="flex flex-col gap-1">
            <PopoverTitle>Direct compose</PopoverTitle>
            <PopoverDescription>
              Render <code>PopoverArrow</code> yourself instead of passing the{" "}
              <code>arrow</code> prop.
            </PopoverDescription>
          </div>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}

export function popoverNonModal(): ReactNode {
  return (
    <Wrapper>
      <Popover modal={false}>
        <PopoverTrigger
          render={<Button variant="outline">Non-blocking popover</Button>}
        />
        <PopoverContent>
          <div className="flex flex-col gap-1">
            <PopoverTitle>modal=false</PopoverTitle>
            <PopoverDescription>
              The rest of the page stays scrollable and interactive while this
              is open.
            </PopoverDescription>
          </div>
        </PopoverContent>
      </Popover>
    </Wrapper>
  );
}
