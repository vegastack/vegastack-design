// Shared Style Dictionary configuration for every VegaStack token build.
// Keeping source lists, transforms, and semantic filters together prevents the
// CSS and runtime-model builds from resolving the same theme differently.

export const TRANSFORMS = [
  "attribute/cti",
  "name/kebab",
  "color/oklch",
  "dimension/css",
  "duration/css",
  "cubicBezier/css",
  "fontFamily/css",
  "shadow/css",
];

export const LIGHT_SOURCES = [
  "tokens/primitives.tokens.json",
  "tokens/semantic.tokens.json",
];

export const DARK_SOURCES = [
  "tokens/primitives.tokens.json",
  "tokens/semantic.dark.tokens.json",
];

export const isLightSemantic = (token) =>
  token.filePath.includes("semantic.tokens");
export const isDarkSemantic = (token) =>
  token.filePath.includes("semantic.dark");
export const isCssSemantic = (token) =>
  isLightSemantic(token) && (token.$type ?? token.type) !== "typography";

export function cssPlatform(files) {
  return {
    transforms: TRANSFORMS,
    buildPath: "dist/",
    files,
  };
}

export function tokenConfig(source, platform) {
  return {
    preprocessors: ["derive-interaction-states"],
    source,
    platforms: { [platform.name]: platform.config },
  };
}

export function flatJsonPlatform(destination, filter) {
  return {
    name: "json",
    config: {
      transforms: TRANSFORMS,
      buildPath: "dist/",
      files: [{ destination, format: "json/flat", filter }],
    },
  };
}
