// @vegastack dashboard-01@0.1.0 sha256-Y/pYrxWGCPZZ2pSM0tGLrww5YEd4w6EfahXXRxkN/tA=

/**
 * `loading.tsx` — registry:page, target `app/dashboard/loading.tsx`. Next.js App Router treats a
 * route's `loading.tsx` as an implicit `<Suspense>` boundary — renders `AppShellSkeleton`
 * (`packages/ui/registry/ui/app-shell.tsx`), the documented full-shell loading composition,
 * while `page.tsx`'s data resolves. Server-safe (no hooks, no `'use client'`) — `AppShellSkeleton`
 * itself is server-safe despite composing the client-declared `SidebarMenuSkeleton`; see its own
 * doc for why that's a supported RSC pattern.
 */

import { AppShellSkeleton } from '@/components/ui/app-shell';

export default function Loading() {
  return <AppShellSkeleton navItemCount={5} statCardCount={4} className="h-svh" />;
}
