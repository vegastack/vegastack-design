#!/usr/bin/env node
// Fail-closed parity gate for generated theme scopes. `.dark` and
// `.vs-marketing` must be two selectors over one resolved dark dictionary; a
// hand-maintained subset or one-value drift is a build failure.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_THEME_CSS = "packages/design-tokens/dist/theme.css";
const SELECTORS = [":root", ".dark", ".vs-marketing"];

function selectorBlocks(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blocks = [];
  const re = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^{}]*)\\}`, "g");
  for (const match of css.matchAll(re)) blocks.push(match[1]);
  return blocks;
}

function parseThemeBlock(block, selector, source) {
  const declarations = new Map();
  const re = /(?:^|\n)\s*(color-scheme|--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  for (const match of block.matchAll(re)) {
    const [, property, rawValue] = match;
    if (declarations.has(property)) {
      throw new Error(
        `${source}: ${selector} declares ${property} more than once`,
      );
    }
    declarations.set(property, rawValue.trim().replace(/\s+/g, " "));
  }
  return declarations;
}

function resolvedTheme(css, selector, source) {
  const candidates = selectorBlocks(css, selector)
    .map((block) => parseThemeBlock(block, selector, source))
    .filter((declarations) => declarations.has("color-scheme"));

  if (candidates.length !== 1) {
    throw new Error(
      `${source}: expected exactly one ${selector} theme block with color-scheme; found ${candidates.length}`,
    );
  }
  return candidates[0];
}

function customProperties(declarations) {
  return new Map(
    [...declarations].filter(([property]) => property.startsWith("--")),
  );
}

function compareDictionaries(
  actual,
  expected,
  actualName,
  expectedName,
  source,
) {
  const missing = [...expected.keys()].filter((key) => !actual.has(key));
  const extra = [...actual.keys()].filter((key) => !expected.has(key));
  const changed = [...expected].filter(
    ([key, value]) => actual.has(key) && actual.get(key) !== value,
  );

  if (missing.length || extra.length || changed.length) {
    const details = [
      missing.length ? `missing: ${missing.join(", ")}` : "",
      extra.length ? `extra: ${extra.join(", ")}` : "",
      changed.length
        ? `different: ${changed
            .map(
              ([key, value]) =>
                `${key} (${actualName}=${actual.get(key)}; ${expectedName}=${value})`,
            )
            .join(", ")}`
        : "",
    ].filter(Boolean);
    throw new Error(
      `${source}: ${actualName} does not match ${expectedName} (${details.join("; ")})`,
    );
  }
}

export function verifyThemeParity(css, { source = "<theme css>" } = {}) {
  const parsed = Object.fromEntries(
    SELECTORS.map((selector) => [
      selector,
      resolvedTheme(css, selector, source),
    ]),
  );

  const schemes = {
    ":root": "light",
    ".dark": "dark",
    ".vs-marketing": "dark",
  };
  for (const [selector, expected] of Object.entries(schemes)) {
    const actual = parsed[selector].get("color-scheme");
    if (actual !== expected) {
      throw new Error(
        `${source}: ${selector} color-scheme must be ${expected}; found ${actual}`,
      );
    }
  }

  const light = customProperties(parsed[":root"]);
  const dark = customProperties(parsed[".dark"]);
  const marketing = customProperties(parsed[".vs-marketing"]);
  if (light.size === 0 || dark.size === 0 || marketing.size === 0) {
    throw new Error(`${source}: theme dictionaries must not be empty`);
  }

  compareDictionaries(marketing, dark, ".vs-marketing", ".dark", source);

  const darkOnly = [...dark.keys()].filter((key) => !light.has(key));
  if (darkOnly.length) {
    throw new Error(
      `${source}: dark dictionary contains variables with no :root counterpart: ${darkOnly.join(", ")}`,
    );
  }

  return { lightVariables: light.size, darkVariables: dark.size };
}

const isCli =
  process.argv[1] != null &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const themeCss = process.argv[2] ?? DEFAULT_THEME_CSS;
  try {
    const result = verifyThemeParity(readFileSync(themeCss, "utf8"), {
      source: themeCss,
    });
    console.log(
      `✓ theme-parity: ${result.darkVariables} dark variables are identical in .dark and .vs-marketing; :root=${result.lightVariables}; color-scheme light/dark/dark`,
    );
  } catch (error) {
    console.error(`✗ theme-parity: ${error.message}`);
    process.exit(1);
  }
}
