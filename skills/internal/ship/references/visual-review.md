# Visual review during a release

Screenshots are not a gate and are never committed. `tooling/vrt-review.mjs` captures the affected
routes twice on ONE machine — once at the branch's merge-base, once at the working tree — and writes
a report plus before/after/diff images. A person, reading them with their agent, decides what the
change did.

## Division of labour

| Stage          | Who                     | Why                                                              |
| -------------- | ----------------------- | ---------------------------------------------------------------- |
| Measurement    | Playwright's comparator | Deterministic. A 2px shift is a fact; a vision model can miss it |
| Interpretation | the developer's agent   | Reads before/after/diff, judges intended vs unintended           |
| Decision       | the developer           | Authority never leaves the human                                 |

Never let a reading of an image substitute for the pixel count. The numbers decide _what gets looked
at_; the agent decides _what it means_; the human decides _what happens_.

## Run it

```bash
pnpm gates:plan                           # machine reason for selected/full/safely-skipped VRT
node tooling/vrt-review.mjs                 # affected routes, fixture lane, vs origin/main
node tooling/vrt-review.mjs --full-pages    # add the full-page lane (includes docs prose)
node tooling/vrt-review.mjs --all           # every route, skip change detection
node tooling/vrt-review.mjs --base <ref>    # compare against a different ref
node tooling/vrt-review.mjs --routes /docs/components/button,/docs/components/card
```

It clones the merge-base into a temporary git worktree, installs and builds there, captures, then
captures the working tree against that. Expect ~6-10 minutes: two full docs builds dominate.

**Scope.** Only routes the change can reach are captured. A component's own route plus every route
whose component composes it (via `registryDependencies`); a preview file maps to its one page; a
`.mdx` edit maps to that page's full-page capture only. Anything touching tokens, the shared runtime,
the docs shell, the preview infrastructure, or the lockfile forces a full capture. A change touching
no visual surface captures nothing and prints SKIPPED.

Do not infer scope from “docs” or “non-component.” Operational prose can select no pixel surface,
but rendered MDX selects its own full page, and shared docs/runtime/style/config inputs widen. Compare
the plan's VRT lane with the VRT report; disagreement is an error to investigate, not permission to
use the smaller scope. A `safely-skipped` plan must include its machine reason and selector digest.

**Exit codes.** 0 for any pixel outcome — a difference is not a defect. 2 only when no report could
be produced (a failed build, a dead server). A 2 is an infrastructure failure, never evidence.

## Read the output

```
.vrt-review/report.json
.vrt-review/<route-slug>[--full-page]--<project>/{before,after,diff}.png
```

Each entry carries `route`, `lane`, `project`, `status`, `changedPixels`, `totalPixels`,
`percentChanged`, and the image paths. Everything needing a decision sorts first, largest change
first inside that — triage by magnitude rather than opening everything.

| `status`    | Means                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `unchanged` | Captured and identical                                                                                                                    |
| `changed`   | Captured and different — read the images and give a verdict                                                                               |
| `new`       | No base capture existed; the route is new                                                                                                 |
| `removed`   | A base capture with no corresponding test at HEAD                                                                                         |
| `broken`    | The test failed with no pixel evidence — navigation error, timeout, interrupted run. **Not a visual change and not a verdict.** Re-run it |

`dimensions` appears when the capture changed size. `note` carries the failure message on a `broken`
entry.

**Known blind spot.** The fixture lane compares at `maxDiffPixels: 0`, so any change at all is
reported. The full-page lane allows 100 pixels — a fixed, reviewable allowance that stops a tall
page's height from scaling the tolerance. A full-page change under 100 pixels therefore reports as
`unchanged`. If a change is expected to be sub-100-pixel and page-level, capture the fixture lane
(the default) rather than relying on `--full-pages`.

## Protocol

1. Run the tool.
2. Read `.vrt-review/report.json`.
3. Read every artifact available for its status: `changed` = Before/After/Difference; `new` = After
   (plus Difference only when emitted); `removed` = Before; `broken` = report error plus any image
   that exists.
4. Classify each: **intended** (consistent with the changeset), **unintended**, or **uncertain**.
5. Explain the result before presenting the audit table:
   - Use short plain-language bullet points stating what visibly changed, what stayed the same, the
     likely cause, and whether a user would notice. A phrase such as “147 pixels changed” is
     measurement context, not an understandable explanation.
   - Then present the table — route, project, pixels changed, verdict, and one-line reasoning.
   - Resolve every available status-appropriate image against the repository root and provide it as
     an absolute clickable Markdown link, with the absolute report link. Label available artifacts
     **Before**, **After**, and **Difference**; never invent an artifact the status cannot produce.
   - `broken` is not a visual verdict. Explain the error, link any available artifact and the report,
     rerun the capture, and stop until a reviewable result exists.
6. **Stop. The developer decides.** Never self-clear a diff.

Report a SKIPPED run as skipped. It is not evidence of a clean diff.

## Known instabilities to expect, not accept

- A capture taken against a stale server pins outdated content. `reuseExistingServer` is `false` for
  exactly this reason; it has caused a wrong reference twice. Never turn it on.
- JS-driven animation races the capture. The spec emulates `reducedMotion: "reduce"` so those
  components render their settled end state. A component that animates anyway is a component bug.
- `content-visibility: auto` subtrees are not painted by Chromium's full-page screenshotter. The
  spec forces `message-scroller-item` visible for the capture. A new component using
  `content-visibility` needs the same treatment or its coverage is void.
