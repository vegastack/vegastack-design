// Node test (no vitest in this package) for the registry post-write comparator's import handling.
// Run: node test/compare.test.mjs  (wired into `pnpm test` for @vegastack/design).
import assert from "node:assert/strict";
import {
  compareFile,
  parseCliArgs,
  parseImportLine,
  rewriteRegistrySpecifier,
  isSanctionedAliasRewrite,
  resolveTargetPath,
  readConsumerConfiguration,
  assertRegistryRequest,
  assertItemName,
  assertExistingPathInside,
  itemHash,
  writeNewPrivateFile,
} from "../bin/verify-registry-item.mjs";
import { resolve, join } from "node:path";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

let passed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
}

t("strict CLI parser accepts one unambiguous pre-write invocation", () => {
  assert.deepEqual(
    parseCliArgs(["--hash-only", "--save", "/private/item.json", "button"]),
    {
      hashOnly: true,
      postWrite: false,
      savePath: "/private/item.json",
      itemPath: undefined,
      expectedIntegrity: undefined,
      targetDir: ".",
      positionals: ["button"],
      name: "button",
    },
  );
});

t(
  "strict CLI parser rejects unknown, duplicate, missing-value, and extra arguments",
  () => {
    for (const args of [
      ["--wat", "button"],
      ["--hash-only", "--hash-only", "button"],
      ["--save", "--hash-only", "button"],
      ["button", "dialog"],
      ["--post-write", "--item", "saved.json", "button"],
      ["--post-write", "--item", "saved.json", "--hash-only"],
      [
        "--post-write",
        "--item",
        "saved.json",
        "--expected-integrity",
        "invalid",
      ],
      ["--expected-integrity", `sha256-${"A".repeat(43)}=`, "button"],
      ["--item", "saved.json", "button"],
    ]) {
      assert.throws(() => parseCliArgs(args));
    }
  },
);

t("strict CLI parser accepts an integrity-pinned post-write invocation", () => {
  const expectedIntegrity = `sha256-${"A".repeat(43)}=`;
  assert.deepEqual(
    parseCliArgs([
      "--post-write",
      "--item",
      "saved.json",
      "--expected-integrity",
      expectedIntegrity,
      "--target-dir",
      ".",
    ]),
    {
      hashOnly: false,
      postWrite: true,
      savePath: undefined,
      itemPath: "saved.json",
      expectedIntegrity,
      targetDir: ".",
      positionals: [],
      name: undefined,
    },
  );
});

t("pre-write network failures exit 2 without a raw Node stack", () => {
  const verifier = fileURLToPath(
    new URL("../bin/verify-registry-item.mjs", import.meta.url),
  );
  const result = spawnSync(
    process.execPath,
    [verifier, "--hash-only", "button"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        VEGASTACK_REGISTRY: "http://127.0.0.1:9/r",
        CF_ACCESS_CLIENT_ID: "",
        CF_ACCESS_CLIENT_SECRET: "",
      },
    },
  );
  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /verification failed: integrity manifest request failed/,
  );
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});

t(
  "post-write rejects a saved item changed after pre-write verification",
  () => {
    const root = mkdtempSync(join(tmpdir(), "vega-postwrite-integrity-"));
    try {
      const original = {
        name: "button",
        files: [
          { target: "@ui/button.tsx", content: "export const Button = 1;\n" },
        ],
        meta: { version: "1.0.0" },
      };
      original.meta.integrity = itemHash(original);
      const tampered = structuredClone(original);
      tampered.files[0].content = "export const Button = 2;\n";
      tampered.meta.integrity = itemHash(tampered);
      const saved = join(root, "button.json");
      writeFileSync(saved, JSON.stringify(tampered));
      const verifier = fileURLToPath(
        new URL("../bin/verify-registry-item.mjs", import.meta.url),
      );
      const result = spawnSync(
        process.execPath,
        [
          verifier,
          "--post-write",
          "--item",
          saved,
          "--expected-integrity",
          original.meta.integrity,
          "--target-dir",
          root,
        ],
        { encoding: "utf8" },
      );
      assert.equal(result.status, 2);
      assert.match(
        result.stderr,
        /does not match the independently retained pre-write integrity/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

const ALIAS_ROOTS = ["@/components/ui", "#components/ui", "~/components/ui"];

// --- single-line import: alias rewrite is sanctioned (regression) ---
t("single-line import alias rewrite passes for every alias root", () => {
  for (const root of ALIAS_ROOTS) {
    const exp = `import { Button } from '@/components/ui/button';`;
    const act = `import { Button } from '${root}/button';`;
    assert.deepEqual(
      compareFile(exp, act, "x.tsx", { ui: root }),
      [],
      `root ${root}`,
    );
  }
});

// --- MULTILINE import: closing line `} from '<spec>'` rewrite is sanctioned (Codex R6 bug) ---
const MULTILINE_EXPECTED = [
  `import {`,
  `  Command,`,
  `  CommandInput,`,
  `  CommandList,`,
  `} from '@/components/ui/command';`,
  ``,
  `export const x = 1;`,
].join("\n");

t(
  "multiline import: closing-line specifier rewrite passes for every alias root",
  () => {
    for (const root of ALIAS_ROOTS) {
      const act = MULTILINE_EXPECTED.replace(
        `'@/components/ui/command'`,
        `'${root}/command'`,
      );
      assert.deepEqual(
        compareFile(MULTILINE_EXPECTED, act, "command-consumer.tsx", {
          ui: root,
        }),
        [],
        `root ${root}`,
      );
    }
  },
);

t("parseImportLine recognizes a multiline-import closing line", () => {
  const parsed = parseImportLine(`} from '@/components/ui/command';`);
  assert.ok(parsed, "closing line should parse as an import");
  assert.equal(parsed.spec, "@/components/ui/command");
});

// --- CRITICAL (Codex R8): alias retargeting to a DIFFERENT module must FAIL ---
// shadcn rewrites only the alias ROOT SYMBOL (@/ ↔ # ↔ ~/); the category + path after it are
// invariant. A change that keeps an aliased form but repoints to a different target (same root or
// cross root) is tampering, not a rewrite, and must be rejected by the post-write verifier.
t(
  "rewriteRegistrySpecifier uses the exact configured alias and longest canonical prefix",
  () => {
    const aliases = { ui: "src/components/ui", components: "src/components" };
    assert.equal(
      rewriteRegistrySpecifier("@/components/ui/button", aliases),
      "src/components/ui/button",
    );
    assert.equal(
      rewriteRegistrySpecifier("@/components/card", aliases),
      "src/components/card",
    );
  },
);

t(
  "isSanctionedAliasRewrite: only the components.json-derived target is sanctioned",
  () => {
    const aliases = { ui: "~/components/ui", lib: "~/lib" };
    assert.equal(
      isSanctionedAliasRewrite(
        "@/components/ui/button",
        "~/components/ui/button",
        aliases,
      ),
      true,
    );
    assert.equal(
      isSanctionedAliasRewrite(
        "@/components/ui/button",
        "#components/ui/button",
        aliases,
      ),
      false,
    );
    // tampering — same root, different target
    assert.equal(
      isSanctionedAliasRewrite(
        "@/components/ui/button",
        "@/components/ui/evil",
        aliases,
      ),
      false,
    );
    // tampering — cross root, different target
    assert.equal(
      isSanctionedAliasRewrite(
        "@/components/ui/button",
        "~/components/ui/evil",
        aliases,
      ),
      false,
    );
    // tampering — cross category
    assert.equal(
      isSanctionedAliasRewrite(
        "@/components/ui/button",
        "@/lib/button",
        aliases,
      ),
      false,
    );
  },
);

t("SAME-ROOT alias retarget to a different module fails the comparator", () => {
  const exp = `import { Button } from '@/components/ui/button';`;
  const act = `import { Button } from '@/components/ui/evil';`;
  assert.notEqual(compareFile(exp, act, "x.tsx").length, 0);
});

t(
  "CROSS-ROOT alias retarget to a different module fails the comparator",
  () => {
    const exp = `import { Button } from '@/components/ui/button';`;
    const act = `import { Button } from '~/components/ui/evil';`;
    assert.notEqual(
      compareFile(exp, act, "x.tsx", { ui: "~/components/ui" }).length,
      0,
    );
  },
);

t("multiline closing-line retarget to a different module fails", () => {
  const act = MULTILINE_EXPECTED.replace(
    `'@/components/ui/command'`,
    `'~/components/ui/evil'`,
  );
  assert.notEqual(
    compareFile(MULTILINE_EXPECTED, act, "x.tsx", { ui: "~/components/ui" })
      .length,
    0,
  );
});

t(
  "real shadcn provenance-header removal and non-default alias rewrite pass together",
  () => {
    const expected =
      "// @vegastack button@0.2.0 sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\n\n" +
      `import { cn } from '@/lib/utils';\n` +
      `import { Spinner } from '@/components/ui/spinner';\n`;
    const actual =
      `import { cn } from 'src/lib/utils';\n` +
      `import { Spinner } from 'src/components/ui/spinner';\n`;
    assert.deepEqual(
      compareFile(expected, actual, "button.tsx", {
        ui: "src/components/ui",
        utils: "src/lib/utils",
        lib: "src/lib",
      }),
      [],
    );
  },
);

t(
  "real shadcn line and block leading-comment prologue removal is narrowly accepted",
  () => {
    const expected =
      "// mirror source\n" +
      "/* generated note */\n\n" +
      `import { cn } from '@/lib/utils';\n` +
      "export const x = 1;\n";
    const actual = `import { cn } from '~/lib/utils';\nexport const x = 1;\n`;
    assert.deepEqual(
      compareFile(
        expected,
        actual,
        "x.tsx",
        { utils: "~/lib/utils" },
        "registry:ui",
      ),
      [],
    );
  },
);

t("leading comments remain exact for raw registry:file entries", () => {
  const expected = "// meaningful raw-file prologue\nexport const x = 1;\n";
  const actual = "export const x = 1;\n";
  assert.notEqual(
    compareFile(expected, actual, "x.ts", {}, "registry:file").length,
    0,
  );
});

t(
  "an altered actual leading comment is not hidden by prologue tolerance",
  () => {
    const expected = "// expected note\nexport const x = 1;\n";
    const actual = "// attacker note\nexport const x = 1;\n";
    assert.notEqual(
      compareFile(expected, actual, "x.tsx", {}, "registry:ui").length,
      0,
    );
  },
);

t("internal comment removal is rejected", () => {
  const expected =
    "// removed by shadcn\nexport const x = 1;\n// internal stays\nexport const y = 2;\n";
  const actual = "export const x = 1;\nexport const y = 2;\n";
  assert.notEqual(
    compareFile(expected, actual, "x.tsx", {}, "registry:ui").length,
    0,
  );
});

t("unterminated leading block comments are never sanctioned", () => {
  const expected = "/* unterminated\nexport const x = 1;\n";
  const actual = "export const x = 1;\n";
  assert.notEqual(
    compareFile(expected, actual, "x.tsx", {}, "registry:ui").length,
    0,
  );
});

t(
  "an unconfigured alternate alias root is rejected even when the suffix matches",
  () => {
    const expected = `import { Button } from '@/components/ui/button';`;
    const actual = `import { Button } from '~/components/ui/button';`;
    assert.notEqual(
      compareFile(expected, actual, "x.tsx", { ui: "@/components/ui" }).length,
      0,
    );
  },
);

// --- tamper detection still fails (multiline context must not weaken it) ---
t("multiline import repointed to a NON-alias specifier fails", () => {
  const act = MULTILINE_EXPECTED.replace(
    `'@/components/ui/command'`,
    `'evil-pkg/command'`,
  );
  assert.notEqual(compareFile(MULTILINE_EXPECTED, act, "x.tsx").length, 0);
});

t("a tampered NON-import line inside a multiline-import file fails", () => {
  const act = MULTILINE_EXPECTED.replace(
    `export const x = 1;`,
    `export const x = 2; // exfil`,
  );
  assert.notEqual(compareFile(MULTILINE_EXPECTED, act, "x.tsx").length, 0);
});

t(
  "a smuggled extra binding on the import-open line fails (open line compared literally)",
  () => {
    const act = MULTILINE_EXPECTED.replace(
      `  CommandList,`,
      `  CommandList, evilExfil,`,
    );
    assert.notEqual(compareFile(MULTILINE_EXPECTED, act, "x.tsx").length, 0);
  },
);

t("line-count mismatch fails", () => {
  assert.notEqual(
    compareFile(MULTILINE_EXPECTED, MULTILINE_EXPECTED + "\nextra", "x.tsx")
      .length,
    0,
  );
});

// --- shadcn @ui/ target placeholder resolves via the consumer's components.json aliases (Codex R12) ---
t(
  "resolveTargetPath: @ui/ placeholder resolves to the DEFAULT consumer ui dir",
  () => {
    const aliases = {
      ui: "@/components/ui",
      components: "@/components",
      lib: "@/lib",
      hooks: "@/hooks",
    };
    const got = resolveTargetPath(
      { target: "@ui/button.tsx" },
      "/consumer",
      aliases,
    );
    assert.equal(got, resolve("/consumer", "components/ui", "button.tsx"));
  },
);

t(
  "resolveTargetPath: @ui/ honors a NON-DEFAULT (src/components/ui) layout",
  () => {
    const aliases = { ui: "src/components/ui", components: "src/components" };
    const got = resolveTargetPath(
      { target: "@ui/button.tsx" },
      "/consumer",
      aliases,
    );
    assert.equal(got, resolve("/consumer", "src/components/ui", "button.tsx"));
  },
);

t(
  "resolveTargetPath: standard @ alias follows a JSONC tsconfig into src/",
  () => {
    const root = mkdtempSync(join(tmpdir(), "vega-standard-src-"));
    try {
      writeFileSync(
        join(root, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui", components: "@/components" },
        }),
      );
      writeFileSync(
        join(root, "tsconfig.json"),
        '{\n  // standard Next alias\n  "compilerOptions": { "paths": { "@/*": ["./src/*",], }, },\n}\n',
      );
      const configuration = readConsumerConfiguration(root);
      const got = resolveTargetPath(
        { target: "@ui/button.tsx" },
        root,
        configuration.aliases,
        configuration.paths,
      );
      assert.equal(got, resolve(root, "src/components/ui/button.tsx"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

t(
  "resolveTargetPath: compilerOptions.baseUrl participates in alias resolution",
  () => {
    const root = mkdtempSync(join(tmpdir(), "vega-base-url-src-"));
    try {
      writeFileSync(
        join(root, "components.json"),
        JSON.stringify({
          aliases: { ui: "@/components/ui", components: "@/components" },
        }),
      );
      writeFileSync(
        join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { baseUrl: "src", paths: { "@/*": ["*"] } },
        }),
      );
      const configuration = readConsumerConfiguration(root);
      const got = resolveTargetPath(
        { target: "@ui/button.tsx" },
        root,
        configuration.aliases,
        configuration.paths,
      );
      assert.equal(got, resolve(root, "src/components/ui/button.tsx"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

t("resolveTargetPath: inherited tsconfig paths match shadcn resolution", () => {
  const root = mkdtempSync(join(tmpdir(), "vega-extended-tsconfig-"));
  try {
    writeFileSync(
      join(root, "components.json"),
      JSON.stringify({
        aliases: { ui: "@/components/ui", components: "@/components" },
      }),
    );
    writeFileSync(
      join(root, "tsconfig.base.json"),
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } },
      }),
    );
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({ extends: "./tsconfig.base.json" }),
    );
    const configuration = readConsumerConfiguration(root);
    const got = resolveTargetPath(
      { target: "@ui/button.tsx" },
      root,
      configuration.aliases,
      configuration.paths,
    );
    assert.equal(got, resolve(root, "src/components/ui/button.tsx"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

t("resolveTargetPath: nested @ui/ subpath is preserved", () => {
  const aliases = { ui: "@/components/ui" };
  const got = resolveTargetPath(
    { target: "@ui/ai/prompt-input.tsx" },
    "/c",
    aliases,
  );
  assert.equal(got, resolve("/c", "components/ui", "ai/prompt-input.tsx"));
});

t(
  "resolveTargetPath: falls back to strip-leading-segment when no alias map is known",
  () => {
    const got = resolveTargetPath(
      { target: "@ui/button.tsx" },
      "/consumer",
      {},
    );
    assert.equal(got, resolve("/consumer", "ui/button.tsx"));
  },
);

t(
  "resolveTargetPath: direct block target stays root-relative in the default layout",
  () => {
    const aliases = { ui: "@/components/ui", components: "@/components" };
    const got = resolveTargetPath(
      { type: "registry:page", target: "app/dashboard/page.tsx" },
      "/consumer",
      aliases,
    );
    assert.equal(got, resolve("/consumer", "app/dashboard/page.tsx"));
  },
);

t(
  "resolveTargetPath: direct block targets follow a src-layout consumer",
  () => {
    const aliases = { ui: "src/components/ui", components: "src/components" };
    for (const file of [
      { type: "registry:page", target: "app/dashboard/page.tsx" },
      { type: "registry:file", target: "app/dashboard/data.json" },
      {
        type: "registry:component",
        target: "app/dashboard/components/stat-cards.tsx",
      },
    ]) {
      const got = resolveTargetPath(file, "/consumer", aliases);
      assert.equal(got, resolve("/consumer", "src", file.target));
    }
  },
);

t("resolveTargetPath: rejects traversal in a direct target", () => {
  assert.throws(
    () =>
      resolveTargetPath(
        { type: "registry:file", target: "../outside.ts" },
        "/consumer",
        {},
      ),
    /escapes the consumer root/,
  );
});

t("resolveTargetPath: rejects traversal through a configured alias", () => {
  assert.throws(
    () =>
      resolveTargetPath({ target: "@ui/button.tsx" }, "/consumer", {
        ui: "../../outside",
      }),
    /escapes the consumer root/,
  );
});

t("resolveTargetPath: rejects absolute registry targets", () => {
  assert.throws(
    () => resolveTargetPath({ target: "/etc/passwd" }, "/consumer", {}),
    /escapes the consumer root/,
  );
});

t(
  "post-write containment rejects a symlink that resolves outside the consumer root",
  () => {
    const root = mkdtempSync(join(tmpdir(), "vega-consumer-"));
    const outside = mkdtempSync(join(tmpdir(), "vega-outside-"));
    try {
      mkdirSync(join(root, "components"), { recursive: true });
      writeFileSync(join(outside, "secret.tsx"), "secret\n");
      symlinkSync(
        join(outside, "secret.tsx"),
        join(root, "components", "button.tsx"),
      );
      assert.throws(
        () =>
          assertExistingPathInside(
            root,
            join(root, "components", "button.tsx"),
            "registry target",
          ),
        /traverses a symlink/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  },
);

t(
  "post-write containment rejects a symlink that repoints within the consumer root",
  () => {
    const root = mkdtempSync(join(tmpdir(), "vega-consumer-"));
    try {
      mkdirSync(join(root, "components"), { recursive: true });
      writeFileSync(join(root, "package.json"), "component-shaped bytes\n");
      symlinkSync(
        join(root, "package.json"),
        join(root, "components", "button.tsx"),
      );
      assert.throws(
        () =>
          assertExistingPathInside(
            root,
            join(root, "components", "button.tsx"),
            "registry target",
          ),
        /traverses a symlink/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

t("explicit verified-item save refuses a pre-existing symlink", () => {
  const root = mkdtempSync(join(tmpdir(), "vega-save-"));
  try {
    const victim = join(root, "victim.json");
    const save = join(root, "predictable.json");
    writeFileSync(victim, "unchanged\n");
    symlinkSync(victim, save);
    assert.throws(() => writeNewPrivateFile(save, "replacement\n"), /EEXIST/);
    assert.equal(readFileSync(victim, "utf8"), "unchanged\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

t(
  "credentialed registry requests require the exact trusted HTTPS origin",
  () => {
    const previous = process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN;
    process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN =
      "https://registry.example.test";
    try {
      assert.doesNotThrow(() =>
        assertRegistryRequest("https://registry.example.test/r/button.json", {
          "CF-Access-Client-Secret": "secret",
        }),
      );
      assert.throws(
        () =>
          assertRegistryRequest("https://attacker.example/r/button.json", {
            "CF-Access-Client-Secret": "secret",
          }),
        /refusing to send registry credentials/,
      );
      assert.throws(
        () =>
          assertRegistryRequest("http://registry.example.test/r/button.json", {
            "CF-Access-Client-Secret": "secret",
          }),
        /refusing to send registry credentials/,
      );
    } finally {
      if (previous == null)
        delete process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN;
      else process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN = previous;
    }
  },
);

// The trusted-origin check above is scoped to requests carrying credential HEADERS. A URL carrying
// the token in a query string skipped it entirely and WAS fetched — proven end-to-end against a
// local sink, which received the Cloudflare Access service token over plain http while the CLI
// exited 0. These lock the URL-side bar shut.
t("registry credentials are refused in the URL regardless of origin", () => {
  const previousSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  const previousId = process.env.CF_ACCESS_CLIENT_ID;
  const previousTrusted = process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN;
  process.env.CF_ACCESS_CLIENT_SECRET = "example-service-token-not-real";
  process.env.CF_ACCESS_CLIENT_ID = "client-id-abcdefgh";
  process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN =
    "https://registry.example.test";
  try {
    // untrusted origin, NO headers — the case that leaked
    assert.throws(
      () =>
        assertRegistryRequest(
          "http://attacker.example/r.json?k=example-service-token-not-real",
          {},
        ),
      /refusing to put \$\{CF_ACCESS_CLIENT_SECRET\} in a registry URL/,
    );
    // the TRUSTED origin is not an exemption: a URL is still logged by servers/proxies/CDNs
    assert.throws(
      () =>
        assertRegistryRequest(
          "https://registry.example.test/r.json?k=example-service-token-not-real",
          {},
        ),
      /refusing to put \$\{CF_ACCESS_CLIENT_SECRET\} in a registry URL/,
    );
    // the client-id half is credential material too, and its NAME matches no secret-ish pattern
    assert.throws(
      () =>
        assertRegistryRequest(
          "https://registry.example.test/r.json?u=client-id-abcdefgh",
          {},
        ),
      /refusing to put \$\{CF_ACCESS_CLIENT_ID\} in a registry URL/,
    );
    // percent-encoded form must be caught: reserved characters are escaped once interpolated
    process.env.CF_ACCESS_CLIENT_SECRET = "p@ss/w+rd=SECRET";
    assert.throws(
      () =>
        assertRegistryRequest(
          `https://registry.example.test/r.json?k=${encodeURIComponent("p@ss/w+rd=SECRET")}`,
          {},
        ),
      /refusing to put \$\{CF_ACCESS_CLIENT_SECRET\} in a registry URL/,
    );
    // and a clean URL to the trusted origin still passes, with and without credentials
    process.env.CF_ACCESS_CLIENT_SECRET = "example-service-token-not-real";
    assert.doesNotThrow(() =>
      assertRegistryRequest("https://registry.example.test/r/button.json", {}),
    );
    assert.doesNotThrow(() =>
      assertRegistryRequest("https://registry.example.test/r/button.json", {
        "CF-Access-Client-Secret": "example-service-token-not-real",
      }),
    );
  } finally {
    for (const [k, v] of [
      ["CF_ACCESS_CLIENT_SECRET", previousSecret],
      ["CF_ACCESS_CLIENT_ID", previousId],
      ["VEGASTACK_TRUSTED_REGISTRY_ORIGIN", previousTrusted],
    ]) {
      if (v == null) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

// An uncredentialed plain-http localhost registry is LEGITIMATE and must keep working:
// tooling/verify-shadcn-consume.mjs serves the real registry that way to exercise the shadcn CLI.
t("uncredentialed local http registries are still allowed", () => {
  const previous = process.env.CF_ACCESS_CLIENT_SECRET;
  delete process.env.CF_ACCESS_CLIENT_SECRET;
  try {
    assert.doesNotThrow(() =>
      assertRegistryRequest("http://127.0.0.1:8731/r/button.json", {}),
    );
  } finally {
    if (previous == null) delete process.env.CF_ACCESS_CLIENT_SECRET;
    else process.env.CF_ACCESS_CLIENT_SECRET = previous;
  }
});

t("registry item names cannot contain path syntax", () => {
  assert.equal(assertItemName("button-group"), "button-group");
  for (const name of [
    "../button",
    "foo/bar",
    "/absolute",
    "Button",
    "button.json",
  ]) {
    assert.throws(() => assertItemName(name), /invalid registry item name/);
  }
});

if (process.exitCode) {
  console.error("\n✗ compare.test.mjs: failures above");
} else {
  console.log(`✓ compare.test.mjs: ${passed} test(s) passed`);
}
