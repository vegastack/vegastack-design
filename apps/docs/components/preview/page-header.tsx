'use client';

import { useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
// Copied INTO apps/docs via `shadcn add @vegastack/page-header` (dogfoods the registry) → auto-scanned.
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { IconButton } from '@/components/ui/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wrapper } from './wrapper';

export function pageHeader(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Spaces"
        description="Organize work into shared spaces."
        favorite={{ defaultActive: true }}
        actions={<Button>New space</Button>}
      />
    </Wrapper>
  );
}

export function pageHeaderWithBreadcrumb(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        backHref="#"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Workspace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>API Keys</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title="API Keys"
        description="Manage keys for this workspace."
        actions={
          <>
            <Button variant="outline">Docs</Button>
            <Button>Create key</Button>
          </>
        }
      />
    </Wrapper>
  );
}

export function pageHeaderMinimal(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader title="Profile" />
    </Wrapper>
  );
}

export function pageHeaderBack(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Select plan"
        description="Choose a plan to continue. The back button closes the picker."
        onBack={() => {
          // app-local imperative action, e.g. closePlanPicker()
        }}
        actions={<Button>Continue</Button>}
      />
    </Wrapper>
  );
}

export function pageHeaderSecondaryMenu(): ReactNode {
  return (
    <Wrapper className="block">
      <PageHeader
        title="Spaces"
        description="The overflow menu renders to the right of the actions."
        actions={<Button>New space</Button>}
        secondaryMenu={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton variant="ghost" aria-label="More actions">
                  <MoreVertical />
                </IconButton>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </Wrapper>
  );
}

export function pageHeaderLongTitle(): ReactNode {
  return (
    <Wrapper className="block">
      {/* Constrained to demonstrate truncation regardless of viewport width — in a real app the
          title row shrinks naturally against the page's own width. */}
      <div className="mx-auto w-full max-w-sm">
        <PageHeader
          title="Q3 Platform Reliability & Performance Engineering Initiative Retrospective"
          description="An overlong tenant or workspace title truncates instead of overflowing, and reveals in full on hover or focus (tap on touch)."
          actions={<Button>Export</Button>}
        />
      </div>
    </Wrapper>
  );
}

export function pageHeaderFavoriteControlled(): ReactNode {
  const [starred, setStarred] = useState(false);
  return (
    <Wrapper className="block">
      <div className="flex flex-col gap-6">
        {/* Controlled — the host owns the starred state */}
        <PageHeader
          title="Q3 Roadmap"
          description={`Controlled star — currently ${starred ? 'starred' : 'not starred'}.`}
          favorite={{ active: starred, onToggle: setStarred }}
        />
        {/* Disabled — toggle removed from the tab order */}
        <PageHeader
          title="Archived doc"
          description="Disabled star — non-interactive and out of the tab order."
          favorite={{ defaultActive: true, disabled: true }}
        />
      </div>
    </Wrapper>
  );
}
