# Docs code blocks and component-page changelog retirement

**Status:** implemented and verified
**Date:** 2026-09-15

## Problem

The generated install command uses Fumadocs' `CodeBlock` around the highlighted `<Pre>` returned by
`highlight()`. In Fumadocs 16.15.8 that is the wrong composition: the highlighted `<pre>` retains
Shiki's light-theme inline background inside the outer code-block figure, producing the white strip
shown in dark mode. Fumadocs' installed server implementation instead maps the highlighter's `pre`
node to `CodeBlock` and places only its children in `Pre`.

Every component page also ends with a generated per-component changelog. It adds little reliable
component-local information: 25 of 116 pages render only an empty-state sentence, while many other
pages repeat broad release bullets that mention several components. The selection is heuristic
(docs-link or bold-title matching), so the section is neither a complete nor a clean component
history. `/docs/changelog` remains the canonical, complete release history.

## Decision

1. Use Fumadocs 16.15.8's supported server code-block composition for generated install commands.
2. Retire component-page changelog sections and the `ComponentChangelog` MDX feature completely.
   Keep the root `CHANGELOG.md`, its generated docs page, and their validation unchanged.
3. Make **Do / Don't** the final component-page section and enforce that nothing follows it.

## Implementation

1. Replace the hand-composed `highlight()` + `CodeBlock` wrapper in
   `apps/docs/components/generated-sections.tsx` with
   `ServerCodeBlock` from `fumadocs-ui/components/codeblock.rsc`, preserving Bash highlighting and
   the current light/dark themes.
2. Add a focused regression check for the generated install-command markup so a highlighted
   `<pre>` cannot again be nested as an independently painted surface inside `CodeBlock`.
3. Remove `## Changelog` and `<ComponentChangelog ... />` from all 116 component MDX pages.
4. Remove the now-dead component changelog reader, generated React component, MDX registration,
   runtime placeholder, and agent-markdown renderer.
5. Update `tooling/content-lint.mjs` and its negative self-test: the canon ends at Do / Don't and
   any following section is rejected.
6. Update the current authorities and authoring guidance (`design.md`, `AGENTS.md`, the component
   skill, and the condensed authoring guide). Regenerate the public `design.md` copy and the public
   skill mirror through their owning sync commands. Historical plans/audits remain untouched.

## Verification

- Focused regression check for the install command.
- `node tooling/content-lint.mjs && node tooling/content-lint.mjs --self-test`
- `pnpm design:sync`
- `node tooling/sync-package-skills.mjs`
- `pnpm verify`
- `pnpm verify:release`, because the HTML and agent markdown exports change.
- Manual dark/light inspection of a component page's Install block and final section.

## Outcome

Implemented as approved. The missing Playwright browsers were installed locally; `pnpm verify`
passed all 2,409 Chromium tests, and `pnpm verify:release` passed the private/public exports,
agent-Markdown validation, docs-shell contracts, registry consume proof, Chromium, and Firefox.
WebKit emitted the repository's expected macOS 26.6 host-incompatibility skip. Direct inspection of
the built Dropzone page confirmed transparent pre/line backgrounds in both themes and Do / Don't as
the final heading.
