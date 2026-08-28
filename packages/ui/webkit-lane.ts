// Host-conditional WebKit for the two cross-engine browser lanes — the cross-browser smoke subset
// (vitest.smoke.config.ts) and the full three-engine suite (vitest.all-browsers.config.ts). Both
// add WebKit + Firefox on top of the base Chromium config; this module decides whether WebKit is
// actually included on the current host.
//
// WHY (2026-08-28): Playwright's WebKit render child (WebContent) links the system WebKit.framework
// by ABSOLUTE path and needs the `_OBJC_CLASS_$__WKBrowserContext` symbol. webkit-2311 targets the
// macOS 26.2 SDK and runs on macOS ~26.2–26.5; macOS 26.6.2 dropped that symbol from the system
// framework, so the child crashes on launch and the browser session never connects — a fixed 60s
// timeout that fails the whole lane. Newer Playwright builds (webkit-2336 / -2355) fail identically;
// Playwright has not yet shipped a 26.6.2-compatible WebKit. Rather than fail a cross-engine lane on
// a host where WebKit PHYSICALLY cannot launch, we probe WebKit once and include it only when it
// actually starts. A Mac in the 26.2–26.5 window still enforces WebKit; a host that can't run it
// skips WebKit with a loud, auditable banner while Chromium + Firefox still run.
//
//   WEBKIT_LANE=auto   (default) probe once; include WebKit iff it launches on this host
//   WEBKIT_LANE=off              skip WebKit without probing (zero latency on a known-bad host)
//   WEBKIT_LANE=require          include WebKit unconditionally — fail-closed, for CI/ship on a
//                                known-good host where an unlaunchable WebKit SHOULD fail the lane
//   (SMOKE_WEBKIT is accepted as a backward-compatible alias for WEBKIT_LANE.)
//
// The skip is never silent: it prints a WEBKIT-LANE-SKIPPED banner to stderr so a receipt reviewer
// can see the run covered two engines, not three.

const SKIP_BANNER = "WEBKIT-LANE-SKIPPED";

function skip(reason: string): false {
  console.warn(
    `\n${SKIP_BANNER} — WebKit could not launch on this host; the cross-engine lane is running ` +
      `Chromium + Firefox only.\n` +
      `  reason: ${reason}\n` +
      `  Expected on macOS outside WebKit's ~26.2–26.5 window (e.g. 26.6.2, which dropped the\n` +
      `  _WKBrowserContext symbol). Use WEBKIT_LANE=off to skip this 20s probe on a known-bad\n` +
      `  host, or WEBKIT_LANE=require to force WebKit (the lane then fails if it cannot launch).\n`,
  );
  return false;
}

// Probe WebKit in a THROWAWAY subprocess. A timed-out webkit.launch() can leave an orphaned
// pipe/handle behind; isolating it in a child that exits means the OS reclaims anything it leaks and
// the vitest main process (which never touches Playwright here) still exits cleanly. The child
// resolves playwright from packages/ui (this module's dir) and exits 0 on launch, 1 otherwise.
async function webkitLaunches(): Promise<boolean> {
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const cwd = fileURLToPath(new URL(".", import.meta.url));
  const probe =
    "import('playwright').then(async ({ webkit }) => { " +
    "const b = await webkit.launch({ headless: true, timeout: 20000 }); " +
    "await b.close(); process.exit(0); }).catch((e) => { " +
    "console.error(String((e && e.message) || e).split('\\n')[0]); process.exit(1); });";
  return new Promise<boolean>((resolve) => {
    const child = spawn(
      process.execPath,
      ["--input-type=module", "-e", probe],
      {
        cwd,
        stdio: ["ignore", "ignore", "pipe"],
        timeout: 35000,
        killSignal: "SIGKILL",
      },
    );
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => resolve(skip(error.message)));
    child.on("exit", (code) => {
      if (code === 0) return resolve(true);
      const reason =
        stderr.trim().split("\n").pop() || `probe exited with code ${code}`;
      resolve(skip(reason));
    });
  });
}

// Vitest evaluates a config more than once per run (main process + browser context), so the
// decision — the 20s probe and its banner — is memoized to run at most once per process.
let webkitDecision: Promise<boolean> | undefined;
function includeWebkit(): Promise<boolean> {
  return (webkitDecision ??= (async () => {
    const mode = (
      process.env.WEBKIT_LANE ??
      process.env.SMOKE_WEBKIT ??
      "auto"
    ).toLowerCase();
    if (mode === "off" || mode === "false" || mode === "0") {
      console.warn(
        `\n${SKIP_BANNER} — WEBKIT_LANE=off; running Chromium + Firefox only.\n`,
      );
      return false;
    }
    if (mode === "require" || mode === "on" || mode === "1") return true;
    return webkitLaunches();
  })());
}

// The engines a cross-engine lane adds on top of the base Chromium config: Firefox always, WebKit
// only when it can actually launch on this host. mergeConfig UNIONS these with the base
// [{ browser: "chromium" }], so the lane runs chromium+firefox(+webkit).
export async function crossEngineInstances(): Promise<
  Array<{ browser: string }>
> {
  const webkit = await includeWebkit();
  return [...(webkit ? [{ browser: "webkit" }] : []), { browser: "firefox" }];
}
