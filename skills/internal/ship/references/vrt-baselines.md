# VRT baselines during a release

Baselines are pinned-Linux screenshots committed under `apps/docs/vrt/**/*-snapshots/`. They are
generated **only** by CI's pinned container — never locally, because font and rendering drift makes a
darwin PNG useless as a Linux reference.

Completeness fails closed and is a **blocking job in `vrt.yml`, `deploy.yml`, and `release.yml`**.
Check the real number rather than trusting any figure written down:

```bash
pnpm --filter @vegastack/docs verify:vrt-baselines
```

It reports required vs. present across every lane. There is more than one snapshot directory — the
full-page suite, the element-scoped component fixtures, and the icon chunks each write their own —
so always copy the whole `*-snapshots` tree, never one directory.

## When baselines must be refreshed

- A component's rendering changed.
- A docs page's visible content changed — prose edits count, the pages are screenshotted.
- A new route was added. Component and block routes come from
  `apps/docs/vrt/contract-routes.generated.ts` (regenerate with `pnpm design:derived` after editing
  the component contract — never hand-edit the generated file); supplemental routes such as guides
  pages are listed explicitly in the spec.

## Ordering rule (saves a wasted CI cycle)

Finalize ALL content and prose edits BEFORE dispatching the bootstrap. Baselines snapshot the pushed
commit, so editing a page after its bootstrap immediately re-stales its baselines.

## The loop

```bash
gh workflow run vrt.yml -R VegaStack/vegastack-design --ref <release-branch> -f update_baselines=true

# wait for success, then pull the artifact (it contains every snapshot directory):
gh run download <run-id> -R VegaStack/vegastack-design -n vrt-baselines -D /tmp/vrt
rsync -a /tmp/vrt/ apps/docs/vrt/

git status --porcelain apps/docs/vrt/
pnpm --filter @vegastack/docs verify:vrt-baselines    # must now pass
git add apps/docs/vrt && git commit

# PNG pushes fail with cryptic RPC/400 errors at the default buffer size:
git -c http.postBuffer=524288000 push
```

If `gh run download` times out on a large artifact, just re-run it — it resumes from a clean slate
and normally completes on the second attempt.

**Sanity rule:** during a completeness bootstrap, newly added PNGs must exactly fill the verifier's
previously missing inventory. Existing PNGs may change only for pages intentionally changed by the
release. Any other replacement is an unintended visual change—investigate before committing, never
bulk-accept.

**Never "fix" a suspect baseline with `--update-snapshots`.** It overwrites in place even when the
current baseline was already wrong (for example captured mid-animation), and on a tall page
`maxDiffPixelRatio: 0.01` can mask a large absolute pixel count as within tolerance. Delete the PNG
and let the suite regenerate it, then review that fresh capture explicitly.

## Cost note

The release pixel gate is path-routed and runs only when component-visual paths change, so
baseline-only and prose-only pushes are cheap. The deploy workflow always runs the full gate.
