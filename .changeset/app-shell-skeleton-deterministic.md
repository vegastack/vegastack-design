---
"@vegastack/ui": patch
---

🐛 `AppShellSkeleton` no longer causes a hydration mismatch. Its nav rows used upstream's `SidebarMenuSkeleton`, which picks a random width per mount, so the server HTML and the client's hydration never agreed in a `loading.tsx`. The rows now take their widths from a fixed cycle — same shape, same 50–90% band, identical on server and client.
