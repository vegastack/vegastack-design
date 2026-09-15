// @vegastack dashboard-01@0.9.1 sha256-RuID/kEb8I7cZv4w10CmKv6vs+CHURA+0z++nvOvQyE=

/**
 * `loading.tsx` — registry:page, target `app/dashboard/loading.tsx`. Next.js App Router treats a
 * route's `loading.tsx` as an implicit `<Suspense>` boundary — renders `AppShellSkeleton`
 * (`packages/ui/registry/ui/app-shell.tsx`), the documented full-shell loading composition,
 * while `page.tsx`'s data resolves. Server-safe (no hooks, no `'use client'`) — `AppShellSkeleton`
 * itself is server-safe despite composing the client-declared `SidebarMenuSkeleton`; see its own
 * doc for why that's a supported RSC pattern.
 */

import { AppShellSkeleton } from "@/components/ui/app-shell";

/**
 * Full-shell route fallback for the dashboard starter.
 * @example <Loading />
 */
export default function Loading() {
  return (
    <AppShellSkeleton navItemCount={5} statCardCount={4} className="h-svh" />
  );
}
