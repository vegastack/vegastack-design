---
"@vegastack/ui": minor
---

🐛 **`AppShell`'s skip link now targets its own content region.** The skip link and
`AppShellContent` both hard-coded the id `main-content`, so a page holding more than one shell
published that id twice and EVERY skip link resolved to the first region — measured on the
`app-shell` docs page, where four embedded previews each carried it and the documented
"Tab once, press Enter" flow landed the reader in the wrong preview from every frame but the first.
`AppShell` now mints the id once with `React.useId()` and shares it to `AppShellContent`, with a new
`contentId` prop for when the id has to be known (a deep link, an external `aria-controls`, a test
harness). Setting `id` on `AppShellContent` moves the element but does not rewire the link; that is
what `contentId` is for. Sharing a generated id is why `app-shell.tsx` now carries a client boundary
at the shell root — `createContext`/`useContext` are unavailable under the `react-server` condition —
which is where `SidebarProvider`'s own client context already lives; page content passed as
`children` still renders on the server.
[docs](https://design.vegastack.com/docs/components/app-shell)
