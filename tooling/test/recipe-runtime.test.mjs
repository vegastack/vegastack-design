import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
import { designMdConfig } from "../design-md.config.mjs";

test("public destructive and secondary recipes match canonical button classes", () => {
  const source = readFileSync(
    new URL("../../packages/ui/registry/ui/button.tsx", import.meta.url),
    "utf8",
  );
  const variants = Object.fromEntries(
    [...source.matchAll(/(secondary|destructive):\s*"([^"]+)"/g)].map(
      ([, key, value]) => [key, value],
    ),
  );
  const recipe = designMdConfig.recipes["button-destructive"];
  const tint = recipe.background.match(/\{(\w+)\}\/(\d+) \(dark: \/(\d+)\)/);
  expect(tint).not.toBeNull();
  expect(variants.destructive.split(" ")).toContain(`bg-${tint[1]}/${tint[2]}`);
  expect(variants.destructive.split(" ")).toContain(
    `dark:bg-${tint[1]}/${tint[3]}`,
  );
  expect(variants.destructive.split(" ")).toContain(
    `text-${recipe.foreground.slice(1, -1)}`,
  );
  const hover = designMdConfig.recipes["button-secondary"].hover
    .replace(/\{([^}]+)\}/g, "var(--$1)")
    .replace(/,\s*/g, ",")
    .replaceAll(" ", "_");
  expect(variants.secondary.split(" ")).toContain(`hover:bg-[${hover}]`);
});
