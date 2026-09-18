#!/usr/bin/env node
// Fail-closed shape gate for the generated theme scopes.
//
// It used to prove that `.dark` and `.vs-marketing` were two selectors over ONE resolved dark
// dictionary. The shadcn reset deletes the marketing layer (mandate § 1, non-negotiable 5), so that
// half is gone and what remains is the part that is still load-bearing:
//   * `:root` and `.dark` each declare `color-scheme` exactly once, with the right value (COL-22) —
//     native scrollbars, date pickers and form widgets read that, and nothing else checks it;
//   * no theme block declares the same custom property twice (a silent last-one-wins);
//   * every `.dark` variable has a `:root` counterpart, so a dark-only token can never ship without
//     a light half. The build already asserts the converse from the token model.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_THEME_CSS = "packages/design-tokens/dist/theme.css";
const SELECTORS = [":root", ".dark"];

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
  if (light.size === 0 || dark.size === 0) {
    throw new Error(`${source}: theme dictionaries must not be empty`);
  }

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
      `✓ theme-parity: :root=${result.lightVariables} and .dark=${result.darkVariables} variables, every dark variable has a light counterpart, no duplicate declarations, color-scheme light/dark`,
    );
  } catch (error) {
    console.error(`✗ theme-parity: ${error.message}`);
    process.exit(1);
  }
}
