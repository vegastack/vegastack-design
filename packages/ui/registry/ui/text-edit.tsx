// @vegastack text-edit@0.2.0 sha256-jTFk7B1l7+MxVRVw6UX88py6BjnejY/zSKLMB2KHsg8=

"use client";

import * as React from "react";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Toggle } from "@/components/ui/toggle";

/**
 * Token-only prose styling for the editor surface (the ProseMirror `.tiptap`
 * root). Mirrors `MarkdownView`'s per-element overrides so rendered rich text
 * tracks the active theme — every value is a semantic token, no
 * `@tailwindcss/typography` dependency, no hardcoded colors. Applied to
 * `EditorContent` via the `editorProps.attributes.class` so it styles the
 * contenteditable element directly.
 */
const proseClassName = cn(
  "tiptap min-w-0 text-base text-foreground outline-none",
  // headings — max weight is `font-medium` (500); mirrors MarkdownView's v2 overrides.
  "[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-h1 [&_h1]:text-foreground [&_h1]:first:mt-0",
  "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-h2 [&_h2]:text-foreground [&_h2]:first:mt-0",
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-h3 [&_h3]:text-foreground [&_h3]:first:mt-0",
  // paragraphs
  "[&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-foreground [&_p]:first:mt-0 [&_p]:last:mb-0",
  // marks — links use `info` (blue) per design.md; strong stays at `font-medium`.
  "[&_strong]:font-medium [&_strong]:text-foreground [&_em]:italic [&_s]:text-muted-foreground [&_s]:line-through",
  "[&_a]:font-medium [&_a]:text-info-text [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-info-text/(--alpha-link-hover)",
  // lists
  "[&_ul]:my-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:text-foreground [&_ul]:marker:text-muted-foreground",
  "[&_ol]:my-3 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:text-foreground [&_ol]:marker:text-muted-foreground",
  "[&_li]:mt-1.5 [&_li]:leading-relaxed",
  // blockquote
  "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
  // inline code + code blocks — chips round at `sm` (6px), the code-block container at `lg`.
  "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-base [&_code]:text-foreground",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-base [&_pre]:text-foreground",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground",
  // horizontal rule
  "[&_hr]:my-6 [&_hr]:border-border",
);

/**
 * Normalize a `minHeight`/`maxHeight` prop to a CSS length: a number becomes
 * `${n}px`, a string is passed through verbatim. Returns `undefined` so the CSS
 * custom property is omitted when the prop is unset (never emits a hardcoded
 * literal — the value is always the consumer's runtime prop, fed into a `--te-*`
 * variable that the content area's arbitrary-value classes consume).
 */
function toCssLength(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/** Whether an `aria-invalid` value should mark the control invalid. */
function isAriaInvalid(value: React.AriaAttributes["aria-invalid"]): boolean {
  return value !== undefined && value !== false && value !== "false";
}

/** Tiptap/ProseMirror DOM attributes must be string-valued. */
function toAriaInvalidAttribute(
  value: React.AriaAttributes["aria-invalid"],
): string | undefined {
  if (!isAriaInvalid(value)) return undefined;
  return value === true ? "true" : String(value);
}

/** The reactive slice of editor state the toolbar reads (active marks/nodes + editability). */
interface ToolbarState {
  isEditable: boolean;
  isBold: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isHeading: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  isCode: boolean;
}

/**
 * Token-styled toolbar of `Toggle` buttons wired to the editor's chained
 * commands. Active state is derived from `editor.isActive(...)` via
 * `useEditorState` (Tiptap v3 no longer re-renders on every transaction, so the
 * toolbar subscribes to just the marks/nodes it cares about). Disabled while the
 * editor is non-editable.
 */
function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }): ToolbarState => ({
      isEditable: ed.isEditable,
      isBold: ed.isActive("bold"),
      isItalic: ed.isActive("italic"),
      isStrike: ed.isActive("strike"),
      isHeading: ed.isActive("heading", { level: 2 }),
      isBulletList: ed.isActive("bulletList"),
      isOrderedList: ed.isActive("orderedList"),
      isBlockquote: ed.isActive("blockquote"),
      isCode: ed.isActive("code"),
    }),
  });

  const disabled = !state.isEditable;

  return (
    <div
      data-slot="text-edit-toolbar"
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/(--alpha-wash-faint) px-1.5 py-1"
    >
      <Toggle
        size="sm"
        pressed={state.isBold}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isItalic}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isStrike}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough />
      </Toggle>
      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
      <Toggle
        size="sm"
        pressed={state.isHeading}
        disabled={disabled}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Heading"
      >
        <Heading2 />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isBulletList}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isOrderedList}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered list"
      >
        <ListOrdered />
      </Toggle>
      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
      <Toggle
        size="sm"
        pressed={state.isBlockquote}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
      >
        <Quote />
      </Toggle>
      <Toggle
        size="sm"
        pressed={state.isCode}
        disabled={disabled}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline code"
      >
        <Code />
      </Toggle>
    </div>
  );
}

export interface TextEditProps {
  /**
   * Controlled HTML value. When provided, the editor is synced to this string
   * whenever it changes externally (and the editor isn't focused). Pair with
   * `onValueChange` to drive it from React state.
   */
  value?: string;
  /**
   * Uncontrolled initial HTML content, used only on first render. Ignored when
   * `value` is provided.
   * @default ''
   */
  defaultValue?: string;
  /**
   * Called with the serialized HTML whenever the document changes.
   */
  onValueChange?: (html: string) => void;
  /**
   * Placeholder shown (overlaid) while the document is empty.
   */
  placeholder?: string;
  /**
   * Whether the content is editable. When `false`, renders read-only rich text
   * and disables the toolbar.
   * @default true
   */
  editable?: boolean;
  /**
   * Fire when the user presses Cmd/Ctrl+Enter inside the editor, with the
   * current serialized HTML. A presentational keyboard affordance only — the
   * *host* decides what submitting does (save, send, …); plain Enter still
   * inserts a newline. Omit to disable the shortcut.
   */
  onSubmit?: (html: string) => void;
  /**
   * Minimum height of the editable content area. A number is treated as `px`;
   * a string is used verbatim (e.g. `'8rem'`). Fed from this runtime value into
   * the `--te-min-h` CSS variable (not a token) so it reflects the consumer's
   * prop while keeping the inline style variable-only.
   * @default a built-in minimum (`min-h-24`)
   */
  minHeight?: number | string;
  /**
   * Maximum height of the editable content area. A number is treated as `px`;
   * a string is used verbatim. When set, the content area scrolls past it.
   * Fed from this runtime value into the `--te-max-h` CSS variable.
   */
  maxHeight?: number | string;
  /**
   * Accessible label for the editable region (applied to the contenteditable
   * surface). Provide one when there is no associated visible label.
   */
  "aria-label"?: string;
  /**
   * `id` applied to the contenteditable surface — the same host element that
   * receives `aria-label`. Use it to target the editor with a `<label htmlFor>`
   * or to reference it from another element's `aria-labelledby`/`aria-controls`.
   */
  id?: string;
  /**
   * References the id(s) of the element(s) that label the editable region
   * (space-separated, same as the native ARIA attribute), applied to the
   * contenteditable surface alongside `aria-label`/`id`. Prefer this over
   * `aria-label` when a visible label element already exists.
   */
  "aria-labelledby"?: string;
  /**
   * Marks the contenteditable textbox invalid for form integrations. When true
   * (or `"grammar"` / `"spelling"`), the container also receives the destructive
   * invalid styling hook via the child textbox.
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /**
   * ID(s) of helper or error text describing the editor. Space-separate
   * multiple ids, same as the native ARIA attribute.
   */
  "aria-describedby"?: string;
  /** Additional class names on the editor container. */
  className?: string;
  /** Ref forwarded to the editor's root container `<div>`. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * `TextEdit` — a Tiptap-based rich-text editor with a compact, token-styled
 * toolbar (bold, italic, strike, heading, bullet/ordered list, blockquote,
 * inline code) and markdown-ish input rules (type `**bold**`, `# heading`,
 * `- list`, `> quote`). Built on [Tiptap v3](https://tiptap.dev) `StarterKit`
 * (history, marks, headings, lists, blockquote, code), `@tiptap/react`'s
 * `useEditor` + `EditorContent`, and the design system's `Toggle`.
 *
 * Controlled via `value` / `onValueChange` (HTML), or uncontrolled via
 * `defaultValue`. The content surface is styled entirely with semantic tokens,
 * so prose tracks the active theme. Server-safe to import (`immediatelyRender:
 * false`); the contenteditable mounts on the client.
 *
 * **Scope (base editor — G7 app-coupled split).** This is the *presentational* base
 * rich-text editor: a controlled HTML value, the StarterKit formatting set, the styled
 * toolbar, the empty-state placeholder, read-only mode, and host-composition affordances
 * — `onSubmit` (Cmd/Ctrl+Enter, the host decides what submit means) plus `minHeight` /
 * `maxHeight` (a scrolling content area). App-coupled and heavier editor capabilities from
 * the platform editor are intentionally **out of this core** — each needs app
 * infrastructure or ships as a separate composed component:
 * - **Image upload / paste-to-upload** → needs app storage (R2/CDN); the app owns the
 *   upload + supplies resolved URLs (mirrors the `Image` G7 split).
 * - **@mentions** → needs the app's user/entity data source + query.
 * - **Markdown import/export, emoji insertion, task lists, code-block language menus,
 *   real-time collaboration (Yjs)** → future, composed extensions (collaboration in
 *   particular ships as a separate `text-edit-collab`).
 *
 * Controlled via `value` / `onValueChange` (HTML), or uncontrolled via `defaultValue`.
 *
 * @example
 * const [html, setHtml] = useState('<p>Hello</p>');
 * <TextEdit value={html} onValueChange={setHtml} placeholder="Write something…" />
 *
 * @example
 * // Submit on Cmd/Ctrl+Enter, with a fixed scrolling height
 * <TextEdit onValueChange={setHtml} onSubmit={save} minHeight={120} maxHeight={320} />
 */
export function TextEdit({
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  editable = true,
  onSubmit,
  minHeight,
  maxHeight,
  "aria-label": ariaLabel,
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
  ref,
}: TextEditProps) {
  const onValueChangeRef = React.useRef(onValueChange);
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  // Keep the latest `onSubmit` in a ref — the editor is created once, but its
  // keydown handler must always call the current callback.
  const onSubmitRef = React.useRef(onSubmit);
  React.useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // The keydown handler closes over the editor before it's assigned; route
  // through a ref so it always reads the live instance to serialize HTML.
  const editorRef = React.useRef<Editor | null>(null);
  const ariaInvalidAttribute = toAriaInvalidAttribute(ariaInvalid);
  const invalid = ariaInvalidAttribute !== undefined;
  const editorAttributes = React.useMemo(
    () => ({
      class: cn(proseClassName, "min-h-24 px-3 py-2.5"),
      ...(id ? { id } : {}),
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}),
      ...(ariaInvalidAttribute ? { "aria-invalid": ariaInvalidAttribute } : {}),
      ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
      role: "textbox",
      "aria-multiline": "true",
    }),
    [ariaDescribedBy, ariaInvalidAttribute, ariaLabel, ariaLabelledBy, id],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? defaultValue,
    editable,
    // Avoid SSR hydration mismatch — the contenteditable mounts on the client.
    immediatelyRender: false,
    editorProps: {
      attributes: editorAttributes,
      // Cmd/Ctrl+Enter submits (when `onSubmit` is set); plain Enter is left to
      // ProseMirror so newlines still work. Return `true` to consume the event.
      handleKeyDown: (_view, event) => {
        if (
          event.key === "Enter" &&
          (event.metaKey || event.ctrlKey) &&
          onSubmitRef.current
        ) {
          event.preventDefault();
          onSubmitRef.current(editorRef.current?.getHTML() ?? "");
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onValueChangeRef.current?.(ed.getHTML());
    },
  });

  editorRef.current = editor;

  // Keep ARIA attributes current after mount; Tiptap reads editorProps at
  // creation time unless we update the editor options.
  React.useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: editorAttributes,
      },
    });
  }, [editor, editorAttributes]);

  // Sync the `editable` prop into the editor instance.
  React.useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Holds the latest controlled `value` that arrived while the editor was focused
  // and so could NOT be applied yet (applying mid-edit would clobber the caret).
  // `undefined` means "nothing pending"; it is reconciled on blur (below).
  const pendingValueRef = React.useRef<string | undefined>(undefined);

  // Reconcile the editor content to `html` without re-emitting `onValueChange`.
  // The `emitUpdate: false` guard is what breaks the setContent → onUpdate →
  // onValueChange → value sync loop; we still bail when content already matches so identical
  // values never touch the document/selection.
  const applyValue = React.useCallback((ed: Editor, html: string) => {
    if (ed.getHTML() === html) return;
    ed.commands.setContent(html, { emitUpdate: false });
  }, []);

  // Sync a controlled `value` in when it changes externally. While the user is
  // actively editing we must NOT replace the document (it would clobber their
  // caret/selection) — instead we stash the value as pending and replay it on
  // blur. When the editor isn't focused, apply immediately as before.
  React.useEffect(() => {
    if (!editor || value === undefined) return;
    if (editor.isFocused) {
      // Defer: record the latest external value; the blur listener applies it.
      pendingValueRef.current = value;
      return;
    }
    // Not focused → safe to apply now; nothing is pending anymore.
    pendingValueRef.current = undefined;
    applyValue(editor, value);
  }, [editor, value, applyValue]);

  // When focus leaves, flush any pending controlled value the focused-edit guard
  // above had to skip — this is what stops the rendered editor from going
  // permanently stale relative to the prop after a focused-time `value` change.
  React.useEffect(() => {
    if (!editor) return;
    const onBlur = () => {
      const pending = pendingValueRef.current;
      if (pending === undefined) return;
      pendingValueRef.current = undefined;
      applyValue(editor, pending);
    };
    editor.on("blur", onBlur);
    return () => {
      editor.off("blur", onBlur);
    };
  }, [editor, applyValue]);

  // Reactive empty-state so the placeholder hides on the first keystroke. Subscribe
  // directly to the editor lifecycle (create/update/transaction) — robust across
  // `immediatelyRender:false` (the editor is null until it mounts on the client).
  const [isEmpty, setIsEmpty] = React.useState(true);
  React.useEffect(() => {
    if (!editor) return;
    const sync = () => setIsEmpty(editor.isEmpty);
    sync();
    editor.on("create", sync);
    editor.on("update", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("create", sync);
      editor.off("update", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);
  const showPlaceholder = !!placeholder && !!editor && isEmpty;

  // Prop-driven sizing for the content area. These are runtime consumer values
  // (not tokens). They're passed as CSS custom properties (`--te-min-h` /
  // `--te-max-h`) and consumed by arbitrary-value classes — so the inline style
  // sets ONLY `--*` variables, never a direct visual property (contract-clean per
  // §7.1). A var is set only when its prop is provided. `maxHeight` also scrolls.
  const minCss = toCssLength(minHeight);
  const maxCss = toCssLength(maxHeight);
  const contentStyle: React.CSSProperties | undefined =
    minCss != null || maxCss != null
      ? ({
          ...(minCss != null && { ["--te-min-h"]: minCss }),
          ...(maxCss != null && { ["--te-max-h"]: maxCss }),
        } as React.CSSProperties)
      : undefined;

  return (
    <div
      ref={ref}
      data-slot="text-edit"
      data-editable={editable ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "relative overflow-hidden rounded-lg border border-input bg-background transition-colors duration-fast ease-standard",
        "focus-within:border-ring/(--alpha-tint-border)",
        "has-aria-invalid:border-destructive/(--alpha-tint-border)",
        className,
      )}
    >
      {editable && editor ? <Toolbar editor={editor} /> : null}
      <div
        data-slot="text-edit-content"
        className={cn(
          "relative",
          minCss != null && "min-h-[var(--te-min-h)]",
          maxCss != null && "max-h-[var(--te-max-h)] overflow-y-auto",
        )}
        style={contentStyle}
      >
        {showPlaceholder ? (
          <p className="pointer-events-none absolute top-2.5 left-3 z-(--z-raised) text-base leading-relaxed text-muted-foreground select-none">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
