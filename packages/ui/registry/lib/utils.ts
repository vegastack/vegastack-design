// Local re-export so `@/lib/utils` resolves in this repo. Copy-in consumers get
// `cn` from their own `@/lib/utils` (shadcn `utils` item) or `@vegastack/design`.
export { cn } from "@vegastack/design";
export type { ClassValue } from "@vegastack/design";
