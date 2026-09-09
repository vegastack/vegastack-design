---
"@vegastack/ui": patch
---

📚 **A component page's `status` and `since` are now machine authorities, not hand-typed prose.**
Both are recorded per component in `packages/ui/component-contracts.json`, written onto the page by
`pnpm design:derived`, and compared against the contract by `tooling/content-lint.mjs`, so a page
cannot claim a status or an origin version the contract does not hold. `status` was 116 identical
`stable` strings with nothing behind them; every component is genuinely `stable` — each has a
registry item, a docs page, a preview and required test coverage, and no ledger, changelog or source
records a deprecation or a preview-quality component. `since` was derived once from
`git log --follow` and is now pinned data, never computed: the values were verified against
/CHANGELOG.md's enumerated release lists (0.2.0 1/1, 0.3.0 12/12, 0.4.0 12/12, 0.5.0 2/2) and
against `packages/ui/registry.json` as it stood at each release commit (0.1.0 82/82). That check
corrected one page — **MediaPlayerControls** now reads `since: 0.7.0`, not 0.5.0: `--follow` had
walked into the `audio-player` source it was extracted from, while the item itself has never
shipped. A component authored between releases carries the next version, and
`tooling/version-sync.mjs` re-stamps it at version time with the version actually being released, so
a different bump than the author guessed cannot publish a wrong `since`.
[docs](https://design.vegastack.com/docs/components/media-player-controls)
