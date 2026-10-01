// @vegastack code-block@0.23.106 sha256-vakhFO2GYzL51AVGSS/Bta2m11r3nEeK9JzlkKHStf0=

"use client";

import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { createLowlight } from "lowlight";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * CodeBlock — a Notion-style code panel: no border and no header bar, a soft `bg-muted/60` ground,
 * 13px mono with relaxed leading that scrolls sideways. On hover or focus inside (always on a
 * coarse pointer) the language shows top-left and a Copy button top-right. Syntax highlighting is
 * lowlight's `common` grammars (loaded lazily after mount; plain code renders first) rendered as React elements (never HTML strings), coloured by the
 * token-mapped `.hljs-*` rules in the design tokens' CSS. `MarkdownView` delegates fenced code
 * here and `TextEdit`'s code block wears the same surface and shares `codeLowlight`
 * (`@/lib/code-highlight`), so a block reads the same in view and edit mode.
 * ----------------------------------------------------------------------------------------------*/

type Lowlight = ReturnType<typeof createLowlight>;

/** The shared lowlight instance, once `@/lib/code-highlight` has loaded (lazily, after mount). */
let loadedLowlight: Lowlight | null = null;
let lowlightPromise: Promise<Lowlight> | null = null;
function loadLowlight() {
  lowlightPromise ??= import("@/lib/code-highlight").then(
    (m) => (loadedLowlight = m.codeLowlight),
  );
  return lowlightPromise;
}

/** The languages a code block offers by name, as `[fence id, display name]`; "" is plain text. */
export const CODE_LANGUAGES: readonly (readonly [string, string])[] = [
  ["", "Plain text"],
  ["bash", "Bash"],
  ["c", "C"],
  ["cpp", "C++"],
  ["csharp", "C#"],
  ["css", "CSS"],
  ["diff", "Diff"],
  ["go", "Go"],
  ["graphql", "GraphQL"],
  ["xml", "HTML / XML"],
  ["ini", "INI / TOML"],
  ["java", "Java"],
  ["javascript", "JavaScript"],
  ["json", "JSON"],
  ["kotlin", "Kotlin"],
  ["less", "Less"],
  ["lua", "Lua"],
  ["makefile", "Makefile"],
  ["markdown", "Markdown"],
  ["objectivec", "Objective-C"],
  ["perl", "Perl"],
  ["php", "PHP"],
  ["python", "Python"],
  ["r", "R"],
  ["ruby", "Ruby"],
  ["rust", "Rust"],
  ["scss", "SCSS"],
  ["sql", "SQL"],
  ["swift", "Swift"],
  ["typescript", "TypeScript"],
  ["vbnet", "VB.NET"],
  ["wasm", "WebAssembly"],
  ["yaml", "YAML"],
];

const LANGUAGE_NAMES = new Map(CODE_LANGUAGES);

/** Fence aliases people write, to the grammar id they mean. */
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  node: "javascript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  yml: "yaml",
  md: "markdown",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  kt: "kotlin",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  cc: "cpp",
  h: "c",
  hpp: "cpp",
  html: "xml",
  htm: "xml",
  svg: "xml",
  toml: "ini",
  jsonc: "json",
  json5: "json",
  objc: "objectivec",
  "objective-c": "objectivec",
  postgres: "sql",
  postgresql: "sql",
  mysql: "sql",
  text: "",
  txt: "",
  plain: "",
  plaintext: "",
};

/**
 * A fence info string's grammar id: lower-cased, its first word, aliases resolved (`ts` →
 * `typescript`, `sh` → `bash`, `yml` → `yaml`, …). `""` for plain text or nothing.
 *
 * @example
 * normalizeCodeLanguage("TS"); // "typescript"
 */
export function normalizeCodeLanguage(language?: string | null): string {
  const id = (language ?? "").trim().split(/\s+/)[0]!.toLowerCase();
  return LANGUAGE_ALIASES[id] ?? id;
}

/**
 * A language's display name ("TypeScript" for `ts`); an unknown language shows as written, and
 * none as "Plain text".
 *
 * @example
 * codeLanguageName("yml"); // "YAML"
 */
export function codeLanguageName(language?: string | null): string {
  const id = normalizeCodeLanguage(language);
  return LANGUAGE_NAMES.get(id) ?? (language?.trim() || "Plain text");
}

/** `code` highlighted as React elements, or the plain text when the language has no grammar. */
function highlight(
  lowlight: Lowlight,
  code: string,
  language: string,
): React.ReactNode {
  if (!language || !lowlight.registered(language)) return code;
  try {
    return toJsxRuntime(lowlight.highlight(language, code), {
      Fragment,
      jsx,
      jsxs,
    });
  } catch {
    return code;
  }
}

/**
 * The code surface `CodeBlock` and `TextEdit`'s code block share: the ground and the sideways
 * scroll. The `hljs` class scopes the design tokens' syntax colours and the 13px / relaxed code
 * type (`utilities.css`, unlayered, so a prose root's `pre code` size cannot override it).
 */
export const codeBlockSurfaceClassName =
  "group/code-block relative w-full min-w-0 max-w-full rounded-lg bg-muted/60 text-foreground";
/**
 * The code panel. Its `white-space` is an inline style (`codeBlockWrapStyle`): it must outrank
 * ProseMirror's own `.ProseMirror pre { white-space: pre-wrap }` in the editor.
 */
export const codeBlockPreClassName =
  "hljs overflow-x-auto overscroll-x-contain px-4 py-3 font-mono scrollbar-thin [scrollbar-color:var(--border)_transparent]";
/** `white-space` for a code panel: `pre` scrolls sideways inside the block, `pre-wrap` wraps. */
export function codeBlockWrapStyle(wrap: boolean): React.CSSProperties {
  return wrap
    ? { whiteSpace: "pre-wrap", overflowWrap: "anywhere" }
    : { whiteSpace: "pre", overflowWrap: "normal" };
}

/** Room above the code for the controls, so the language label and the icons never cover line one. */
export const codeBlockControlsPadClassName = "pt-9";
/** The controls (language top-left, icon buttons top-right): always shown, above the code. */
export const codeBlockControlClassName = "absolute top-1.5 z-10";
/** The top-right icon row: wrap and copy. */
export const codeBlockActionsClassName =
  "absolute end-1.5 top-1.5 z-10 flex items-center gap-0.5";

/**
 * A fence info string split into its language and the `wrap` flag TextEdit writes after it
 * (```` ```ts wrap ````; plain text that wraps is ```` ```text wrap ````).
 *
 * @example
 * parseCodeFenceInfo("ts wrap"); // { language: "ts", wrap: true }
 */
export function parseCodeFenceInfo(info?: string | null): {
  language: string | undefined;
  wrap: boolean;
} {
  const words = (info ?? "").trim().split(/\s+/).filter(Boolean);
  const wrap = words.slice(1).includes("wrap");
  return { language: words[0] || undefined, wrap };
}

/** The fence info string for a language and wrap flag — the inverse of `parseCodeFenceInfo`. */
export function codeFenceInfo(
  language: string | null | undefined,
  wrap: boolean,
) {
  const lang = (language ?? "").trim();
  if (!wrap) return lang;
  return `${lang || "text"} wrap`;
}

/** Props accepted by `CodeBlock`. */
export interface CodeBlockProps extends React.ComponentPropsWithRef<"figure"> {
  /**
   * The fence's language (`ts`, `python`, …): picks the highlighting grammar, and its display name
   * shows top-left on hover. Omit it for plain text.
   * @default undefined
   */
  language?: string;
  /** When set, a Copy button for this raw source shows top-right on hover. @default undefined */
  copyValue?: string;
  /** The copy control's accessible name (an icon button). @default "Copy" */
  copyLabel?: string;
  /**
   * Wrap long lines instead of scrolling them sideways inside the block.
   * @default false
   */
  wrap?: boolean;
}

/**
 * `CodeBlock` — compose the code content as children (it lands inside the block's own
 * `<pre><code>`); a string child is syntax-highlighted for `language`.
 *
 * @example
 * <CodeBlock language="sql" copyValue={QUERY}>
 *   {QUERY}
 * </CodeBlock>
 */
export function CodeBlock({
  className,
  language,
  copyValue,
  copyLabel,
  wrap = false,
  children,
  ref,
  ...props
}: CodeBlockProps) {
  const grammar = normalizeCodeLanguage(language);
  // Plain code first (server and first client render match); the grammars load after mount.
  const [lowlight, setLowlight] = React.useState<Lowlight | null>(null);
  const wantsHighlight = typeof children === "string" && !!grammar;
  React.useEffect(() => {
    if (!wantsHighlight) return;
    if (loadedLowlight) {
      setLowlight(loadedLowlight);
      return;
    }
    let live = true;
    loadLowlight().then(
      (l) => live && setLowlight(l),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [wantsHighlight]);
  const content =
    typeof children === "string" && lowlight
      ? highlight(lowlight, children, grammar)
      : children;
  return (
    <figure
      ref={ref}
      data-slot="code-block"
      data-language={language || undefined}
      className={cn(codeBlockSurfaceClassName, className)}
      {...props}
    >
      {language ? (
        <figcaption
          data-slot="code-block-header"
          className={cn(
            codeBlockControlClassName,
            "start-2 flex h-7 items-center px-2 text-xs text-muted-foreground select-none",
          )}
        >
          {codeLanguageName(language)}
        </figcaption>
      ) : null}
      {copyValue != null ? (
        <div
          data-slot="code-block-actions"
          className={codeBlockActionsClassName}
        >
          <CopyButton
            value={copyValue}
            size="icon-xs"
            variant="ghost"
            copyLabel={copyLabel ?? "Copy"}
          />
        </div>
      ) : null}
      <pre
        data-slot="code-block-pre"
        data-wrap={wrap ? "" : undefined}
        style={codeBlockWrapStyle(wrap)}
        className={cn(
          codeBlockPreClassName,
          (language || copyValue != null) && codeBlockControlsPadClassName,
        )}
      >
        <code className="font-mono">{content}</code>
      </pre>
    </figure>
  );
}
