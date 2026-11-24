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
//     a light half;
//   * every accent (COL-27) declares exactly the same keys in both modes, once, with concrete values
//     (a `var()` alias would resolve against `:root` inside a preview card);
//   * Black changes nothing: each new role in `:root`/`.dark` equals the value its components painted
//     before accents existed, and the Black block equals the contract.
// The build already asserts the converse of the dark rule from the token model.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACCENT_KEYS,
  DEFAULT_ACCENT,
  accentIds,
  accentSelectors,
} from "../packages/design-tokens/accents.mjs";
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

const fade = (value, alpha) => value.replace(/\)$/, ` / ${alpha})`);

/** What each role painted before accents, read from tokens that did not move. */
const BLACK_PARITY = {
  "--primary-hover": (v) => fade(v.get("--primary"), 0.8),
  "--primary-pressed": (v) => fade(v.get("--primary"), 0.7),
  "--primary-text": (v) => v.get("--primary"),
  "--link": (v) => v.get("--info-text"),
  "--link-hover": (v) => fade(v.get("--info-text"), 0.88),
  "--unread": (v) => v.get("--info"),
  "--nav-selected": (v) => v.get("--state-selected"),
  "--nav-selected-foreground": (v) => v.get("--foreground"),
  "--nav-selected-icon": (v) => v.get("--muted-foreground"),
  "--check": (v) => v.get("--primary"),
  "--ink": (v) => v.get("--primary"),
  "--ink-foreground": (v) => v.get("--primary-foreground"),
  "--mark": (v) => fade(v.get("--primary"), 0.15),
};
/** Black's fill and label, pinned: the one pair nothing else can vouch for. */
const BLACK_FILL = {
  light: ["oklch(0.205 0 0)", "oklch(0.985 0 0)"],
  dark: ["oklch(0.922 0 0)", "oklch(0.205 0 0)"],
};

function verifyAccents(css, contract, source) {
  for (const [mode, values] of Object.entries(contract)) {
    const [fill, label] = BLACK_FILL[mode];
    if (
      values.get("--primary") !== fill ||
      values.get("--primary-foreground") !== label
    )
      throw new Error(`${source}: Black's ${mode} fill or label moved`);
    for (const [key, expected] of Object.entries(BLACK_PARITY))
      if (values.get(key) !== expected(values))
        throw new Error(
          `${source}: ${mode} ${key} is ${values.get(key)}; Black must stay ${expected(values)}`,
        );
  }
  const keys = ACCENT_KEYS.map((key) => `--${key}`).join();
  for (const id of accentIds()) {
    for (const [mode, selector] of Object.entries(accentSelectors(id))) {
      const blocks = selectorBlocks(css, selector);
      if (blocks.length !== 1)
        throw new Error(
          `${source}: expected exactly one ${selector} block; found ${blocks.length}`,
        );
      const values = parseThemeBlock(blocks[0], selector, source);
      if ([...values.keys()].join() !== keys)
        throw new Error(
          `${source}: ${selector} must declare exactly ${keys}; found ${[...values.keys()].join()}`,
        );
      for (const [key, value] of values) {
        if (!value.startsWith("oklch("))
          throw new Error(`${source}: ${selector} ${key} is not concrete`);
        if (id === DEFAULT_ACCENT && value !== contract[mode].get(key))
          throw new Error(
            `${source}: ${selector} ${key} differs from the contract`,
          );
      }
    }
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

  verifyAccents(css, { light, dark }, source);

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
      `✓ theme-parity: :root=${result.lightVariables} and .dark=${result.darkVariables} variables, every dark variable has a light counterpart, no duplicate declarations, color-scheme light/dark, accent blocks complete, Black unchanged`,
    );
  } catch (error) {
    console.error(`✗ theme-parity: ${error.message}`);
    process.exit(1);
  }
}
