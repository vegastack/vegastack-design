#!/usr/bin/env node
// The docs-shell contracts (`05-docs-chrome.md` DC-03/06/12, decisions DD-1/4/5, plus BANNER-FIT
// from `docs/ledger/bugs.md` 2026-09-22), asserted in a real browser against the STATIC PUBLIC
// EXPORT — the artefact production serves.
//
// WHY A SCRIPT AND NOT A TEST FILE
//   These assertions used to live in `apps/docs/vrt/docs-shell.spec.ts`, which meant the repo
//   carried a second test runner (`@playwright/test` + `playwright.config.ts` + a `webServer` that
//   rebuilt the site on every invocation) for one file. WP3 deleted that runner. The assertions are
//   not deletable: `design.md` and `apps/docs/app/global.css` both cite them as the proof that the
//   docs chrome obeys the design system it documents, and nothing else measures a COMPUTED style on
//   the built site. So they are re-implemented here with the `playwright` LIBRARY — already in the
//   lockfile as vitest's browser provider for `@vegastack/ui`, pinned to the same version, so the
//   lockfile still resolves exactly one `playwright` and `verify-workflow-security.mjs` can keep
//   deriving the container tag from it — plus `node:assert`. One runner, one dependency, no config.
//
//   It is a DISTRIBUTION check (`pnpm verify:distribution`), not part of affected PR verification,
//   because it reads `apps/docs/out`. It runs immediately after the public export and link check.
//
// WHAT IT REFUSES TO DO
//   Pass without having measured anything. `--self-test` injects, per assertion, the exact defect
//   that assertion exists to catch and requires the assertion to FAIL on it. An assertion that
//   cannot fail is not coverage — that is the lesson of the forced-colors focus check
//   (`docs/ledger/bugs.md`, 2026-07-25), which ran green over a deleted focus ring for months.
//   `--self-test` is wired into the same distribution stage, directly after the real run: it needs the
//   same built export, so it cannot live in `pnpm test:tooling`, which runs with no docs build.
//
// USAGE
//   node tooling/verify-docs-shell.mjs              assert the shell (requires apps/docs/out)
//   node tooling/verify-docs-shell.mjs --self-test  prove each assertion fails on its own defect
//   node tooling/verify-docs-shell.mjs --port 5599  serve on a fixed port instead of a free one
//
// Exit codes: 0 pass · 1 an assertion failed (or, under --self-test, could not fail) · 2 the run
// could not produce a verdict at all.

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

import { ROOT } from "./lib/fs.mjs";

const DOCS = join(ROOT, "apps/docs");
const OUT = join(DOCS, "out");

const HOME = "/";
const COMPONENT = "/docs/components/button";
const FOUNDATIONS = "/docs/foundations/icons";
const GALLERY = "/docs/foundations/icons/gallery";
// The fullscreen preview lives on every component page; the deleted spec measured it on Button.
const FULLSCREEN = COMPONENT;

const USAGE = `Usage: node tooling/verify-docs-shell.mjs [--self-test] [--port <n>]

Requires a built public export at apps/docs/out (SITE_VISIBILITY=public pnpm -F @vegastack/docs build).`;

function fatal(message) {
  console.error(`verify-docs-shell: ${message}`);
  process.exit(2);
}

const options = { selfTest: false, port: null };
for (let index = 2; index < process.argv.length; index += 1) {
  const flag = process.argv[index];
  if (flag === "--self-test") options.selfTest = true;
  else if (flag === "--port") {
    options.port = Number(process.argv[++index]);
    if (!Number.isInteger(options.port) || options.port < 1024)
      fatal("--port must be an integer >= 1024");
  } else if (flag === "--help" || flag === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else fatal(`unknown option ${flag}\n\n${USAGE}`);
}

// ── the static server ────────────────────────────────────────────────────────────────────────────
// Lifted from the deleted `tooling/contracts-run.mjs`, defects and all already paid for:
// an OS-assigned free port so two runs cannot collide, `detached: true` so the `serve` GRANDCHILD
// dies with its `pnpm` parent (killing the wrapper alone orphaned three listening servers), and an
// `lsof -sTCP:LISTEN` sweep that must filter on LISTEN — without it the sweep matched this very
// process's polling socket and SIGKILLed the runner after a clean pass.

/** An OS-assigned free port. A fixed port collides with a parallel run or an orphaned server. */
function reservePort() {
  return new Promise((resolveWith, rejectWith) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", rejectWith);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolveWith(port));
    });
  });
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function assertEventually(read, message, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await read()) return;
    await sleep(50);
  }
  assert.fail(message);
}

async function waitForServer(port, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(3_000),
      });
      if (response.ok || response.status === 404) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(250);
  }
  return false;
}

let server = null;
let serverClosed = false;
let servingPort = null;

function reapServer() {
  if (server && !serverClosed && server.pid) {
    try {
      // Negative pid = the whole group, so `serve` goes with its `pnpm` parent.
      process.kill(-server.pid, "SIGKILL");
    } catch {
      // Already gone, or the group was never created.
    }
  }
  if (servingPort === null) return;
  try {
    const listening = spawnSync(
      "lsof",
      ["-ti", `tcp:${servingPort}`, "-sTCP:LISTEN"],
      { encoding: "utf8" },
    );
    for (const pid of (listening.stdout ?? "").split("\n").filter(Boolean)) {
      const target = Number(pid);
      if (!Number.isInteger(target) || target === process.pid) continue;
      try {
        process.kill(target, "SIGKILL");
      } catch {
        // Not ours any more, or already exited.
      }
    }
  } catch {
    // lsof unavailable — the group kill above is the primary mechanism.
  }
}
process.on("exit", reapServer);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    reapServer();
    process.exit(2);
  });

async function startServer() {
  const port = options.port ?? (await reservePort());
  servingPort = port;
  server = spawn("pnpm", ["exec", "serve", "out", "-l", String(port)], {
    cwd: DOCS,
    stdio: "ignore",
    detached: true,
  });
  server.on("exit", () => {
    serverClosed = true;
  });
  if (!(await waitForServer(port))) {
    reapServer();
    fatal(`the static server never answered on 127.0.0.1:${port}`);
  }
  return `http://127.0.0.1:${port}`;
}

// ── page helpers ─────────────────────────────────────────────────────────────────────────────────

/** Inject a stylesheet. Used only by `--self-test`, to break exactly one measured property. */
const addStyle = (page, css) =>
  page.evaluate((text) => {
    const style = document.createElement("style");
    style.textContent = text;
    document.head.append(style);
  }, css);

/** Resolve a CSS length declared as a custom property, in the document, to used pixels. */
async function openFullscreen(page) {
  await page
    .getByRole("button", { name: "Fullscreen preview" })
    .first()
    .click();
  const dialog = page.locator("[data-preview-fullscreen]");
  await dialog.waitFor({ state: "visible", timeout: 15_000 });
  return dialog;
}

// ── the five assertions ──────────────────────────────────────────────────────────────────────────
// Each carries the defect(s) it exists to catch. `phase` says WHEN a defect is injected: "before"
// is right after navigation; "afterOpen" is inside the check, once the fullscreen dialog is up,
// because a defect in a modal cannot be injected before the modal exists.

const ASSERTIONS = [
  // DC-01 ("the product type scope sets the inherited base, and portals carry it") and DC-02 ("no
  // rendered text exceeds the 400/500 weight ladder") USED TO STAND HERE. Batch 1 of the shadcn
  // reset deleted what both measured — the product/doc two-layer type ladder with its
  // `--type-product-base` and `.vs-type-product` scope, and the 400/500 weight ladder — and said so
  // in `apps/docs/app/global.css`: "the bans are gone and the shell's own values are now on-system
  // by definition ... `text-base` is 16px again for everybody, which is what the docs shell wanted
  // all along and what `.vs-type-product` existed to opt back out of." The two assertions were left
  // behind, failing against a shell that is correct, and nothing noticed because this suite runs
  // only inside `verify:distribution`. Batch 8 removed them (2026-09-18) rather than leave a gate
  // asserting doctrine the system no longer holds. The three that remain — the fullscreen preview's
  // focus contract, the skip link, and the tab-stop roster — are unchanged and untouched by the
  // reset.

  {
    id: "DC-03",
    title:
      "the fullscreen preview traps focus, closes on Escape, restores focus, and isolates the background",
    routes: [FULLSCREEN],
    async check(page, ctx) {
      const article = page.locator("article").first();
      await article.waitFor({ state: "attached", timeout: 15_000 });
      const trigger = page
        .getByRole("button", { name: "Fullscreen preview" })
        .first();
      const triggerElement = await trigger.elementHandle();
      assert.notEqual(
        triggerElement,
        null,
        "the fullscreen trigger was not found before opening the dialog",
      );

      // MEASURED, not assumed. Base UI 1.8.0 isolates with `aria-hidden` + `data-base-ui-inert`,
      // never the `inert` attribute (`FloatingFocusManager` calls
      // `markOthers(…, { ariaHidden: modal, mark: false })` and never passes `inert: true`), and it
      // applies the two markers at DIFFERENT DEPTHS: the outside subtree ROOT (`#nd-docs-layout`)
      // gets `data-base-ui-inert`, while `aria-hidden="true"` lands on the outside elements one
      // level in — the article's own children, not `<article>` itself. The deleted spec asserted
      // `article.closest("[aria-hidden='true']")`, which is FALSE against this build; that it was
      // nonetheless green is evidence the file was executed by no gate. So the probe reads the
      // page heading for the AT marker and the article for the inert marker, which is what
      // modality actually rests on, and fails the moment either half regresses.
      const isolation = () =>
        page.evaluate(() => {
          const heading = document.querySelector("article h1");
          const element = document.querySelector("article");
          return {
            ariaHidden: heading?.closest("[aria-hidden='true']") != null,
            marked: element?.closest("[data-base-ui-inert]") != null,
          };
        });
      assert.deepEqual(await isolation(), { ariaHidden: false, marked: false });

      const dialog = await openFullscreen(page);
      await ctx.inject("afterOpen");

      assert.deepEqual(
        await isolation(),
        { ariaHidden: true, marked: true },
        "the docs article behind the fullscreen dialog is not hidden from assistive tech",
      );
      assert.deepEqual(
        await dialog.evaluate((element) => ({
          ariaHidden: element.closest("[aria-hidden='true']") !== null,
          marked: element.closest("[data-base-ui-inert]") !== null,
        })),
        { ariaHidden: false, marked: false },
        "the dialog's own content is caught by its background isolation",
      );
      assert.equal(
        await triggerElement.evaluate(
          (element) => element.closest("[inert]") !== null,
        ),
        true,
        "the fullscreen trigger behind the dialog does not have a native inert ancestor",
      );

      // Base UI's guards transiently hand focus to <body>, so body itself is accepted. No
      // interactive outside element is: native inert on the body roots must make the next Tab
      // return to the popup/guard instead of restarting in the docs chrome.
      const escaped = [];
      for (let step = 0; step < 25; step += 1) {
        await page.keyboard.press("Tab");
        const outside = await page.evaluate(() => {
          const active = document.activeElement;
          if (!active || active === document.body) return null;
          if (active.closest("[data-preview-fullscreen]")) return null;
          if (active.hasAttribute("data-base-ui-focus-guard")) return null;
          return {
            tag: active.tagName.toLowerCase(),
            role: active.getAttribute("role"),
            label:
              active.getAttribute("aria-label") ??
              active.textContent?.trim().slice(0, 40) ??
              "",
          };
        });
        if (outside) escaped.push({ step: step + 1, ...outside });
      }
      assert.deepEqual(
        escaped,
        [],
        `focus escaped the fullscreen dialog: ${JSON.stringify(escaped)}`,
      );

      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 5_000 });
      // A leaked `aria-hidden` silences the whole page, so release is asserted too.
      assert.deepEqual(await isolation(), { ariaHidden: false, marked: false });
      await assertEventually(
        () =>
          triggerElement.evaluate(
            (element) => document.activeElement === element,
          ),
        "focus did not return to the fullscreen trigger",
      );
    },
    defects: [
      {
        name: "the background is not hidden from assistive tech",
        phase: "afterOpen",
        apply: (page) =>
          page.evaluate(() => {
            for (const element of document.querySelectorAll(
              "[data-base-ui-inert], article [aria-hidden='true']",
            )) {
              element.removeAttribute("data-base-ui-inert");
              element.removeAttribute("aria-hidden");
            }
          }),
      },
      {
        name: "native inert is removed from the outside roots",
        phase: "afterOpen",
        apply: (page) =>
          page.evaluate(() => {
            const popup = document.querySelector("[data-preview-fullscreen]");
            const portal = popup?.closest("[data-base-ui-portal]");
            for (const element of document.querySelectorAll("[inert]")) {
              if (!(element instanceof HTMLElement)) continue;
              if (
                element === portal ||
                element.contains(portal) ||
                portal?.contains(element)
              )
                continue;
              element.inert = false;
            }
          }),
      },
      {
        name: "Escape no longer reaches the dialog",
        phase: "afterOpen",
        apply: (page) =>
          page.evaluate(() => {
            window.addEventListener(
              "keydown",
              (event) => {
                if (event.key === "Escape") event.stopPropagation();
              },
              true,
            );
          }),
      },
    ],
  },

  {
    id: "DC-06",
    title: "the skip link is the first tab stop and reaches the content",
    routes: [HOME, COMPONENT, FOUNDATIONS, GALLERY],
    async check(page, ctx, route) {
      await page.keyboard.press("Tab");
      const first = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return null;
        return {
          tag: active.tagName.toLowerCase(),
          role: active.getAttribute("role"),
          href: active.getAttribute("href"),
          text: active.textContent?.trim().slice(0, 40) ?? "",
        };
      });
      assert.notEqual(first, null, `${route}: Tab reached nothing`);
      assert.equal(
        first.href,
        "#content",
        `${route}: the first tab stop is <${first.tag}> linking to ${first.href}, not the #content skip link`,
      );
      const reached = await page.evaluate(
        (selector) => document.querySelector(selector) !== null,
        first.href,
      );
      assert.ok(
        reached,
        `${route}: the skip link targets ${first.href}, which does not exist`,
      );
    },
    defects: [
      {
        name: "the skip link is removed, so Tab lands in the chrome",
        phase: "before",
        apply: (page) =>
          // Hiding the link through a persistent rule models its absence without racing Next's
          // hydration. Removing the server-rendered node here used to be fail-open: hydration
          // could recreate it before the following Tab press, so the injected defect vanished
          // and the self-test reported a false pass.
          addStyle(page, "a[href='#content'] { display: none !important; }"),
      },
      {
        name: "the skip link targets an anchor that does not exist",
        phase: "before",
        apply: (page) =>
          page.evaluate(() => {
            document
              .querySelector("a[href='#content']")
              ?.setAttribute("href", "#nowhere");
          }),
      },
    ],
  },

  {
    // NOT a `DC-` id. That register is `docs/audits/2026-09-07-system-audit/05-docs-chrome.md`, a
    // closed point-in-time audit whose rows run DC-01…DC-17; a new row there would be invented
    // history. This assertion's provenance is `docs/ledger/bugs.md`, 2026-09-22.
    id: "BANNER-FIT",
    title:
      "the sticky banner's content fits the fixed-height box it declares, at 320px",
    routes: [COMPONENT],
    async check(page, ctx) {
      // Fumadocs' `Banner` writes ONE `height` into both its own inline style and
      // `--fd-banner-height`, which every sticky offset below it is measured from. So the box
      // cannot grow to fit its text: text that needs more lines simply overflows, and at `z-40`
      // over the header's `z-30` it paints on top of the site header. The layout boxes still do
      // not overlap and there is no horizontal scroll, which is exactly why nothing else catches
      // this — it is content escaping its container, not a broken grid.
      //
      // Measured at 320px because that is where the copy is under the most pressure, and stated as
      // an invariant about FIT rather than about which clause is hidden: the point is that the
      // banner's content must fit whatever box it declares, so this stays true if the copy, the
      // breakpoint or the height ever change, and fails the moment the copy outgrows the box again.
      await page.setViewportSize({ width: 320, height: 720 });
      await ctx.inject("narrow");

      // The union of everything the banner actually paints — element boxes AND the bare text
      // nodes, which have no element of their own and are most of this banner.
      const measure = () =>
        page.evaluate(() => {
          const banner = document.querySelector("#registry-auth");
          if (!banner) return null;
          const box = banner.getBoundingClientRect();
          if (box.height === 0) return null;
          const range = document.createRange();
          range.selectNodeContents(banner);
          const text = range.getBoundingClientRect();
          let bottom = text.bottom;
          let top = text.top;
          for (const element of banner.querySelectorAll("*")) {
            if (element.tagName === "STYLE" || element.tagName === "SCRIPT")
              continue;
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;
            bottom = Math.max(bottom, rect.bottom);
            top = Math.min(top, rect.top);
          }
          return {
            boxTop: Math.round(box.top),
            boxBottom: Math.round(box.bottom),
            contentTop: Math.round(top),
            contentBottom: Math.round(bottom),
          };
        });

      // `assertEventually` waits; it does not hand back what it read. So wait for the banner to
      // be laid out at the new viewport, then take the measurement the assertions below use.
      await assertEventually(
        measure,
        "the registry-auth banner never rendered with a measurable height at 320px",
      );
      const measured = await measure();

      // 1px of slack for sub-pixel line-box rounding; the real defect was 72px.
      assert.ok(
        measured.contentBottom <= measured.boxBottom + 1,
        `the banner's content ends at ${measured.contentBottom}px but its box ends at ${measured.boxBottom}px — ` +
          `${measured.contentBottom - measured.boxBottom}px overflows the sticky box and paints over the header below it`,
      );
      assert.ok(
        measured.contentTop >= measured.boxTop - 1,
        `the banner's content starts at ${measured.contentTop}px, above its box at ${measured.boxTop}px`,
      );
    },
    defects: [
      {
        // The exact regression: the trailing enumeration back on at 320px, which is what the
        // banner shipped before 2026-09-22 and what a future copy edit would reintroduce.
        name: "the full notice is shown at 320px, so it overflows its fixed-height box",
        phase: "narrow",
        apply: (page) =>
          addStyle(page, "#registry-auth span { display: inline !important; }"),
      },
    ],
  },

  {
    id: "DC-12",
    title: "every tab stop has a role and an accessible name",
    routes: [COMPONENT, FOUNDATIONS, GALLERY],
    async check(page, ctx, route) {
      // A focusable div is legitimate when it carries a role that explains it (Fumadocs'
      // `role="tabpanel"` panels and `role="region"` scroll containers are the correct pattern);
      // it is a defect when a screen reader reaches a stop it cannot name. So: role-and-name, not
      // `div`. `AnimatedIconCard` was 439 nameless tab stops on the icons page.
      const offenders = await page.evaluate(() =>
        [...document.querySelectorAll("div[tabindex]:not([tabindex='-1'])")]
          .filter((element) => !element.getAttribute("role"))
          .map((element) => element.outerHTML.slice(0, 120)),
      );
      assert.deepEqual(offenders, [], `${route}: roleless focusable <div>`);
    },
    defects: [
      {
        name: "a nameless focusable <div> is reachable by Tab",
        phase: "before",
        apply: (page) =>
          page.evaluate(() => {
            document.body.insertAdjacentHTML(
              "beforeend",
              '<div tabindex="0">nameless</div>',
            );
          }),
      },
    ],
  },
];

// ── the run ──────────────────────────────────────────────────────────────────────────────────────

if (!existsSync(join(OUT, "index.html")))
  fatal(
    "apps/docs/out/index.html is missing — build the public export first:\n" +
      "  SITE_VISIBILITY=public pnpm -F @vegastack/docs build",
  );

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (error) {
  fatal(
    `cannot load the \`playwright\` library — ${error.message}\n` +
      "  it is a root devDependency pinned to the version @vegastack/ui already resolves",
  );
}

const origin = await startServer();
const browser = await chromium.launch();
const context = await browser.newContext();

/** Run one assertion over one route, optionally with one defect injected. Resolves to an error. */
async function runOnce(assertion, route, defect) {
  const page = await context.newPage();
  const applied = new Set();
  const ctx = {
    async inject(phase) {
      if (defect && defect.phase === phase && !applied.has(defect)) {
        applied.add(defect);
        await defect.apply(page);
      }
    },
  };
  try {
    const response = await page.goto(`${origin}${route}`, {
      waitUntil: "load",
      timeout: 60_000,
    });
    if (!response || !response.ok())
      throw new Error(
        `${route} served ${response ? response.status() : "no response"}`,
      );
    await ctx.inject("before");
    await assertion.check(page, ctx, route);
    if (defect && !applied.has(defect))
      throw new Error(
        `the "${defect.name}" defect was never injected — its "${defect.phase}" phase was not reached`,
      );
    return null;
  } catch (error) {
    return error;
  } finally {
    await page.close();
  }
}

let failures = 0;
const started = Date.now();

if (options.selfTest) {
  console.log(
    "verify-docs-shell --self-test: each assertion must FAIL on its own injected defect\n",
  );
  for (const assertion of ASSERTIONS) {
    for (const defect of assertion.defects) {
      const route = assertion.routes[0];
      const error = await runOnce(assertion, route, defect);
      if (error) {
        console.log(
          `  ✓ ${assertion.id} ${route} rejects "${defect.name}"\n      ${String(error.message).split("\n")[0].slice(0, 160)}`,
        );
      } else {
        failures += 1;
        console.error(
          `  ✗ ${assertion.id} ${route} PASSED with "${defect.name}" injected — the assertion is fail-open`,
        );
      }
    }
  }
} else {
  for (const assertion of ASSERTIONS) {
    for (const route of assertion.routes) {
      const error = await runOnce(assertion, route, null);
      if (error) {
        failures += 1;
        console.error(`  ✗ ${assertion.id} ${route} — ${assertion.title}`);
        console.error(
          String(error.message)
            .split("\n")
            .map((line) => `      ${line}`)
            .join("\n"),
        );
      } else {
        console.log(`  ✓ ${assertion.id} ${route} — ${assertion.title}`);
      }
    }
  }
}

await context.close();
await browser.close();
reapServer();

const seconds = ((Date.now() - started) / 1000).toFixed(1);
const label = options.selfTest
  ? "verify-docs-shell --self-test"
  : "verify-docs-shell";
if (failures) {
  console.error(`\n✗ ${label}: ${failures} failure(s) in ${seconds}s`);
  process.exit(1);
}
console.log(
  options.selfTest
    ? `\n✓ ${label}: all ${ASSERTIONS.reduce((total, a) => total + a.defects.length, 0)} injected defects were rejected by their assertion (${seconds}s)`
    : `\n✓ ${label}: ${ASSERTIONS.length} docs-shell contracts hold (${seconds}s)`,
);
process.exit(0);
