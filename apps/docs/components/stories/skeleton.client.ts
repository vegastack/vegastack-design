'use client';

// Client-boundary shim for the Skeleton Story explorer: the canonical component is deliberately
// SERVER-SAFE (no 'use client' — locked build rule), but Fumadocs Story requires a client
// component reference. Re-exporting through this 'use client' module makes the import a
// client reference without touching the canonical source.
export { Skeleton } from '@/components/ui/skeleton';
