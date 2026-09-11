// @vegastack text-edit@0.8.2 sha256-xsu+WD+AAmA8z8MxIDSMSYM3aFaJSeJGhh1NQZu2Ttc=

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
import { Toolbar } from "@base-ui/react/toolbar";
import { cn, proseClassName } from "@vegastack/design";
import { Toggle } from "@/components/ui/toggle";

/** A cluster of related formatting controls inside the toolbar row. */
const TOOLBAR_GROUP = "flex items-center gap-0.5";

/**
 * The rule between two clusters. `Toolbar.Separator` defaults to the orientation perpendicular to
 * the toolbar, so a horizontal bar gets a vertical hairline without stating it.
 */
const TOOLBAR_SEPARATOR = "mx-0.5 h-4 w-px shrink-0 bg-border";

/**
 * The editor surface (the ProseMirror `.tiptap` root) wears the shared `prose` recipe from
 * `@vegastack/design` — the SAME string `MarkdownView` puts on its root, so edited rich text and
 * rendered markdown are one typography rather than two that agree by review (audit B4-09). It is
 * applied through `editorProps.attributes.class`, which styles the contenteditable element
 * directly; ProseMirror owns that DOM, which is why the recipe is expressed as descendant rules.
 *
 * Only what is specific to a contenteditable stays here: `tiptap` (the primitive's own hook),
 * `min-w-0` (the editor is a flex child), `outline-none` (focus is drawn on the container's
 * border), and the content inset.
 */
const editorClassName = cn(
  proseClassName,
  "tiptap min-h-24 min-w-0 px-3 py-2.5 outline-none",
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
 * Token-styled formatting toolbar wired to the editor's chained commands.
 *
 * Built on Base UI `Toolbar` (audit B4-10): the row is a real APG toolbar with **one tab stop** and
 * roving focus — Tab enters at the last-focused control, the arrow keys move between controls (and
 * wrap), Shift+Tab leaves. Before this it was a hand-written `role="toolbar"` whose every button
 * was its own tab stop, so a keyboard user paid eight Tab presses to cross a formatting bar and the
 * announced role promised traversal that did not exist.
 *
 * Each control is a `Toolbar.Button` rendering the system `Toggle`, which keeps the pressed
 * semantics (`aria-pressed` + `data-pressed`) that make a formatting button legible; the clusters
 * are `Toolbar.Group`s so the arrow keys still cross them while assistive tech announces the
 * grouping. Active state is derived from `editor.isActive(...)` via `useEditorState` (Tiptap v3 no
 * longer re-renders on every transaction, so the toolbar subscribes to just the marks and nodes it
 * cares about).
 *
 * `disabled` is declared once on `Toolbar.Root` and reaches every item through context.
 * `focusableWhenDisabled={false}` is deliberate: it makes a disabled item a natively disabled
 * `<button>`, which is what `Toggle`'s `disabled:` styling reads. The state is defensive anyway —
 * the toolbar is not rendered at all when `editable` is false.
 */
function FormattingToolbar({ editor }: { editor: Editor }) {
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
    <Toolbar.Root
      data-slot="text-edit-toolbar"
      aria-label="Formatting"
      disabled={disabled}
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/(--alpha-wash-faint) px-1.5 py-1"
    >
      <Toolbar.Group
        data-slot="text-edit-toolbar-group"
        aria-label="Text style"
        className={TOOLBAR_GROUP}
      >
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isBold}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold"
            >
              <Bold />
            </Toggle>
          }
        />
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isItalic}
              onPressedChange={() =>
                editor.chain().focus().toggleItalic().run()
              }
              aria-label="Italic"
            >
              <Italic />
            </Toggle>
          }
        />
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isStrike}
              onPressedChange={() =>
                editor.chain().focus().toggleStrike().run()
              }
              aria-label="Strikethrough"
            >
              <Strikethrough />
            </Toggle>
          }
        />
      </Toolbar.Group>
      <Toolbar.Separator className={TOOLBAR_SEPARATOR} />
      <Toolbar.Group
        data-slot="text-edit-toolbar-group"
        aria-label="Blocks"
        className={TOOLBAR_GROUP}
      >
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isHeading}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              aria-label="Heading"
            >
              <Heading2 />
            </Toggle>
          }
        />
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isBulletList}
              onPressedChange={() =>
                editor.chain().focus().toggleBulletList().run()
              }
              aria-label="Bullet list"
            >
              <List />
            </Toggle>
          }
        />
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isOrderedList}
              onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
              aria-label="Ordered list"
            >
              <ListOrdered />
            </Toggle>
          }
        />
      </Toolbar.Group>
      <Toolbar.Separator className={TOOLBAR_SEPARATOR} />
      <Toolbar.Group
        data-slot="text-edit-toolbar-group"
        aria-label="Insert"
        className={TOOLBAR_GROUP}
      >
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isBlockquote}
              onPressedChange={() =>
                editor.chain().focus().toggleBlockquote().run()
              }
              aria-label="Blockquote"
            >
              <Quote />
            </Toggle>
          }
        />
        <Toolbar.Button
          focusableWhenDisabled={false}
          render={
            <Toggle
              size="sm"
              pressed={state.isCode}
              onPressedChange={() => editor.chain().focus().toggleCode().run()}
              aria-label="Inline code"
            >
              <Code />
            </Toggle>
          }
        />
      </Toolbar.Group>
    </Toolbar.Root>
  );
}

/** Props accepted by `TextEdit`. */
export interface TextEditProps {
  /**
   * Controlled HTML value. When provided, the editor is synced to this string
   * whenever it changes externally (and the editor isn't focused). Pair with
   * `onValueChange` to drive it from React state.

   * @default undefined
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

   * @default undefined
   */
  onValueChange?: (html: string) => void;
  /**
   * Placeholder shown (overlaid) while the document is empty.

   * @default undefined
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

   * @default undefined
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

   * @default undefined
   */
  maxHeight?: number | string;
  /**
   * Accessible label for the editable region (applied to the contenteditable
   * surface). Provide one when there is no associated visible label.

   * @default undefined
   */
  "aria-label"?: string;
  /**
   * `id` applied to the contenteditable surface — the same host element that
   * receives `aria-label`. Use it to target the editor with a `<label htmlFor>`
   * or to reference it from another element's `aria-labelledby`/`aria-controls`.

   * @default undefined
   */
  id?: string;
  /**
   * References the id(s) of the element(s) that label the editable region
   * (space-separated, same as the native ARIA attribute), applied to the
   * contenteditable surface alongside `aria-label`/`id`. Prefer this over
   * `aria-label` when a visible label element already exists.

   * @default undefined
   */
  "aria-labelledby"?: string;
  /**
   * Marks the contenteditable textbox invalid for form integrations. When true
   * (or `"grammar"` / `"spelling"`), the container also receives the destructive
   * invalid styling hook via the child textbox.

   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /**
   * ID(s) of helper or error text describing the editor. Space-separate
   * multiple ids, same as the native ARIA attribute.

   * @default undefined
   */
  "aria-describedby"?: string;
  /** Additional class names on the editor container.
   * @default undefined
   */
  className?: string;
  /** Ref forwarded to the editor's root container `<div>`.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * `TextEdit` — a Tiptap-based rich-text editor with a compact, token-styled
 * toolbar (bold, italic, strike, heading, bullet/ordered list, blockquote,
 * inline code) and markdown-ish input rules (type `**bold**`, `# heading`,
 * `- list`, `> quote`). Built on [Tiptap v3](https://tiptap.dev) `StarterKit`
 * (history, marks, headings, lists, blockquote, code), `@tiptap/react`'s
 * `useEditor` + `EditorContent`, Base UI `Toolbar`, and the design system's `Toggle`.
 *
 * The toolbar is a real APG toolbar: one tab stop, arrow keys between controls,
 * Shift+Tab out.
 *
 * Controlled via `value` / `onValueChange` (HTML), or uncontrolled via
 * `defaultValue`. The content surface wears the shared `prose` recipe from
 * `@vegastack/design` — the same one `MarkdownView` uses — so edited rich text and
 * rendered markdown are one typography and both track the active theme.
 * Server-safe to import (`immediatelyRender: false`); the contenteditable mounts
 * on the client.
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
      class: editorClassName,
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
        "relative overflow-hidden rounded-lg border border-input bg-background",
        "focus-within:border-ring/(--alpha-tint-border)",
        // Focus outranks invalid — same reasoning, same mechanism as `fieldControl`
        // (`@vegastack/design`, #100): the contenteditable carries `outline-none`, so this
        // container border is the editor's whole focus affordance and the invalid tint must
        // stand down while it holds focus rather than win the cascade.
        "not-focus-within:has-aria-invalid:border-destructive-border/(--alpha-tint-border)",
        className,
      )}
    >
      {editable && editor ? <FormattingToolbar editor={editor} /> : null}
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
          <p className="pointer-events-none absolute top-2.5 start-3 z-(--z-raised) text-base leading-relaxed text-muted-foreground select-none">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
