# VRT baselines during a release

Baselines are Linux screenshots committed at
`apps/docs/vrt/components.spec.ts-snapshots/*-linux.png`, generated ONLY by CI's pinned
container (never locally — font/rendering drift).

## When they must be refreshed

- A component's rendering changed.
- A docs page's visible content changed (prose edits count — the pages are screenshotted).
- A new route was added to the `PAGES` array in `apps/docs/vrt/components.spec.ts`
  (mandatory for every new showcase/guide page).

## Ordering rule (saves a wasted CI cycle)

Finalize ALL content/prose edits BEFORE dispatching the bootstrap — baselines snapshot the
pushed commit, so editing a page after its bootstrap immediately re-stales its baselines.

## The loop

```bash
gh workflow run vrt.yml -R VegaStack/vegastack-design -f update_baselines=true
# wait for success, then:
gh run download <run-id> -R VegaStack/vegastack-design -n vrt-baselines -D /tmp/vrt
cp /tmp/vrt/components.spec.ts-snapshots/*-linux.png apps/docs/vrt/components.spec.ts-snapshots/
git status --porcelain apps/docs/vrt/   # verify ONLY expected pages changed
git add apps/docs/vrt && git commit
git -c http.postBuffer=524288000 push origin main   # PNG pushes fail with cryptic RPC/400
                                                     # errors at the default buffer size
```

If `gh run download` times out (large artifact, ~200 PNGs), just re-run it — it resumes
from a clean slate and normally completes on the second attempt.

Sanity rule: the changed-file list must match the pages you touched. Unexpected diffs mean
an unintended visual change — investigate before committing.

## Cost note

The release pixel gate only runs when component-visual paths change (path-routed), so
baseline-only and prose-only pushes are cheap. The deploy workflow always runs the full gate.
