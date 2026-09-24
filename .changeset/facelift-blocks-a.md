---
"@vegastack/ui": minor
---

🧩 Three new blocks: a settings hub, the status pages and a two-pane review page.

- **settings-02**: the settings landing page. It has one section per area, and each area is a container-query grid of whole-tile links, each named by its title and described by one fact. An area that isn't built yet is a plain "TBD" tile, not a tab stop (DS-53). [docs](https://design.vegastack.com/docs/blocks/settings-02)
- **status-pages-01**: `NotFoundPage`, `ForbiddenPage` and `ErrorPage`, each usable in the shell or standalone. Each is an `Empty` whose title is the page's `h1` and gives one way out. The error page adds "Try again" and, when there is a digest, the reference with a copy button (DS-60). [docs](https://design.vegastack.com/docs/blocks/status-pages-01)
- **review-split-01**: `ReviewSplit` puts the summary and action items beside a sticky transcript, with the docked `AudioPlayer` at the end of the column. The block measures its own container: the layout and the switch to tabs change together at 56rem, and each panel mounts once (DS-58). [docs](https://design.vegastack.com/docs/blocks/review-split-01)
