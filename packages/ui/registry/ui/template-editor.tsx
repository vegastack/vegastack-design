// @vegastack template-editor@0.25.80 sha256-asTnDbdcQIpIplna9Cyr5nRfcu9qhQWdIYQ46bvHweU=

"use client";

import * as React from "react";
import {
  EditorContent,
  Extension,
  InputRule,
  Node,
  useEditor,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Suggestion,
  exitSuggestion,
  type SuggestionProps,
} from "@tiptap/suggestion";
import {
  Slice,
  type Node as PMNode,
  type ResolvedPos,
  type Schema,
} from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn, mergeRefs } from "@vegastack/design";
import {
  SuggestionMenu,
  suggestionMenuKeyDown,
  suggestionMenuOptionId,
} from "@/components/ui/suggestion-menu";

/* ------------------------------------------------------------------------------------------------
 * Types
 * ----------------------------------------------------------------------------------------------*/

/**
 * One placeholder a template can hold: stored as `{{id}}`, shown as a chip reading `label`.
 *
 * @example
 * const token: TemplateEditorToken = { id: "power", label: "Power", hint: "W" };
 */
export interface TemplateEditorToken {
  /** The stored identifier, written into the value as `{{id}}`. */
  id: string;
  /** What the chip and the picker show. */
  label: string;
  /**
   * Muted text beside the label in the picker — a unit or a group.
   * @default undefined
   */
  hint?: string;
}

/**
 * One text replacement `TemplateEditor` applies as you type: the moment the text before the caret
 * ends with `from`, those characters become `to` (Backspace right after undoes it).
 *
 * @example
 * const times: TemplateEditorReplacement = { from: "*", to: "×" };
 */
export interface TemplateEditorReplacement {
  /** The characters typed — one or more. */
  from: string;
  /** What they become. */
  to: string;
}

/**
 * Props for `TemplateEditor`.
 *
 * @example
 * <TemplateEditor value={value} onChange={setValue} tokens={tokens} aria-label="Description" />
 */
export interface TemplateEditorProps {
  /**
   * The template: plain text with each placeholder written as `{{id}}`, and paragraphs separated
   * by a blank line (`\n\n`). A single `\n` is a line break inside a paragraph.
   */
  value: string;
  /** Called with the new template string on every edit. Never called for an unchanged value. */
  onChange: (value: string) => void;
  /** The placeholders `@` or `{{` offers, in the order the picker lists them. */
  tokens: readonly TemplateEditorToken[];
  /**
   * Shown while the template is empty.
   * @default undefined
   */
  placeholder?: string;
  /**
   * Read-only and dimmed, like a disabled `Textarea`.
   * @default false
   */
  disabled?: boolean;
  /**
   * Ids whose chips render in the destructive style (a placeholder the caller rejects).
   * @default undefined
   */
  invalidTokenIds?: readonly string[];
  /**
   * Text replacements applied as you type, e.g. `[{ from: "*", to: "×" }, { from: "/", to: "÷" }]`
   * so a formula reads `Power × Efficacy`. Typing only — pasted text and `value` are kept as they
   * are — and the value stores the replaced text.
   * @default undefined
   */
  replacements?: readonly TemplateEditorReplacement[];
  /**
   * One line, like `Input`: Enter and Shift+Enter insert nothing, pasted line breaks become spaces,
   * and a `value` holding line breaks loads with spaces in their place. Long text still wraps on
   * screen. Read when the editor mounts; remount (a new `key`) to change it.
   * @default false
   */
  singleLine?: boolean;
  /**
   * The editable surface's id (an enclosing `Field` supplies one).
   * @default undefined
   */
  id?: string;
  /**
   * Accessible name of the editable surface.
   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Id of the element that names the editable surface.
   * @default undefined
   */
  "aria-labelledby"?: string;
  /**
   * Id of the element that describes the editable surface.
   * @default undefined
   */
  "aria-describedby"?: string;
  /**
   * Marks the field invalid: a destructive border, like `Textarea`.
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /**
   * Classes for the bordered root.
   * @default undefined
   */
  className?: string;
  /**
   * The bordered root element.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/* ------------------------------------------------------------------------------------------------
 * Value <-> document
 * ----------------------------------------------------------------------------------------------*/

const TOKEN_NODE = "templateToken";
const TOKEN_PATTERN = /\{\{([^{}]+)\}\}/g;
const PARAGRAPH_SEPARATOR = "\n\n";

function lineContent(line: string): JSONContent[] {
  const out: JSONContent[] = [];
  let last = 0;
  for (const match of line.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: "text", text: line.slice(last, index) });
    out.push({ type: TOKEN_NODE, attrs: { id: match[1] } });
    last = index + match[0].length;
  }
  if (last < line.length) out.push({ type: "text", text: line.slice(last) });
  return out;
}

/** A single-line editor's text: every run of line breaks (and the space around it) is one space. */
function oneLine(value: string) {
  return value.replace(/\s*[\r\n]+\s*/g, " ");
}

/**
 * The template string as a document: one paragraph per `\n\n`-separated block, a hard break per
 * `\n` inside one, a token node per `{{id}}`. `serialize(parseTemplate(v)) === v` for every string
 * (every string with no line break, in single-line mode).
 */
function parseTemplate(raw: string, singleLine = false): JSONContent {
  const value = singleLine ? oneLine(raw) : raw;
  return {
    type: "doc",
    content: value.split(PARAGRAPH_SEPARATOR).map((block) => {
      const content: JSONContent[] = [];
      block.split("\n").forEach((line, index) => {
        if (index > 0) content.push({ type: "hardBreak" });
        content.push(...lineContent(line));
      });
      return content.length
        ? { type: "paragraph", content }
        : { type: "paragraph" };
    }),
  };
}

function serializeTemplate(doc: PMNode): string {
  const blocks: string[] = [];
  doc.forEach((paragraph) => {
    let text = "";
    paragraph.forEach((child) => {
      if (child.isText) text += child.text ?? "";
      else if (child.type.name === TOKEN_NODE) text += `{{${child.attrs.id}}}`;
      else if (child.type.name === "hardBreak") text += "\n";
    });
    blocks.push(text);
  });
  return blocks.join(PARAGRAPH_SEPARATOR);
}

/* ------------------------------------------------------------------------------------------------
 * Token node
 * ----------------------------------------------------------------------------------------------*/

interface TokenLookup {
  label: string;
  known: boolean;
  invalid: boolean;
}

interface TemplateRuntime {
  singleLine: boolean;
  replacements: () => readonly TemplateEditorReplacement[];
  lookup: (id: string) => TokenLookup;
  /** Repaints every mounted chip; set when a chip mounts, called when tokens change. */
  painters: Set<() => void>;
  items: (query: string) => TemplateEditorToken[];
  get: () => MenuState | null;
  set: (next: MenuState | null) => void;
}

const CHIP_CLASS =
  "rounded-sm bg-muted px-1 py-px text-foreground box-decoration-clone data-selected:bg-foreground/15 data-invalid:bg-destructive/10 data-invalid:text-destructive-text dark:data-invalid:bg-destructive/20 data-invalid:data-selected:bg-destructive/25";

function tokenNode(runtime: TemplateRuntime) {
  return Node.create({
    name: TOKEN_NODE,
    // Ahead of the core keymap, so Backspace removes a chip rather than undoing the input rule.
    priority: 1000,
    group: "inline",
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,
    addAttributes() {
      return {
        id: {
          default: "",
          parseHTML: (element) =>
            element.getAttribute("data-template-token") ?? "",
          renderHTML: (attributes) => ({
            "data-template-token": attributes.id,
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: "span[data-template-token]" }];
    },
    renderHTML({ HTMLAttributes, node }) {
      return ["span", HTMLAttributes, `{{${node.attrs.id}}}`];
    },
    renderText({ node }) {
      return `{{${node.attrs.id}}}`;
    },
    addNodeView() {
      return ({ node: initial }) => {
        let node = initial;
        const dom = document.createElement("span");
        dom.contentEditable = "false";
        dom.setAttribute("data-slot", "template-editor-token");
        dom.className = CHIP_CLASS;
        const paint = () => {
          const id = String(node.attrs.id);
          const { label, known, invalid } = runtime.lookup(id);
          dom.textContent = label;
          dom.setAttribute("data-id", id);
          dom.toggleAttribute("data-invalid", invalid || !known);
          dom.toggleAttribute("data-unknown", !known);
        };
        paint();
        runtime.painters.add(paint);
        return {
          dom,
          update: (next) => {
            if (next.type !== node.type) return false;
            node = next;
            paint();
            return true;
          },
          selectNode: () => dom.setAttribute("data-selected", ""),
          deselectNode: () => dom.removeAttribute("data-selected"),
          ignoreMutation: () => true,
          destroy: () => runtime.painters.delete(paint),
        };
      };
    },
    addInputRules() {
      // `{{id}}` typed out in full becomes a chip, whether or not the picker was used.
      return [
        new InputRule({
          find: /\{\{([^{}\s]+)\}\}$/,
          handler: ({ state, range, match }) => {
            state.tr.replaceWith(
              range.from,
              range.to,
              this.type.create({ id: match[1] }),
            );
          },
        }),
      ];
    },
    addKeyboardShortcuts() {
      // A chip is one unit: Backspace after it and Delete before it remove the whole chip.
      const remove = (backward: boolean) => {
        const { selection } = this.editor.state;
        if (!selection.empty) return false;
        const $pos = selection.$from;
        const target = backward ? $pos.nodeBefore : $pos.nodeAfter;
        if (target?.type !== this.type) return false;
        const from = backward ? $pos.pos - target.nodeSize : $pos.pos;
        return this.editor.commands.deleteRange({
          from,
          to: from + target.nodeSize,
        });
      };
      return {
        Backspace: () => remove(true),
        Delete: () => remove(false),
      };
    },
  });
}

/* ------------------------------------------------------------------------------------------------
 * Picker (`@` and `{{`)
 * ----------------------------------------------------------------------------------------------*/

interface MenuState {
  items: TemplateEditorToken[];
  index: number;
  rect: DOMRect | null;
  pluginKey: PluginKey;
  command: (item: TemplateEditorToken) => void;
}

const AT_KEY = new PluginKey("templateEditorAt");
const BRACES_KEY = new PluginKey("templateEditorBraces");

function filterTokens(
  tokens: readonly TemplateEditorToken[],
  rawQuery: string,
): TemplateEditorToken[] {
  const query = rawQuery.replace(/\}+$/, "").trim().toLowerCase();
  if (!query) return [...tokens];
  const starts: TemplateEditorToken[] = [];
  const contains: TemplateEditorToken[] = [];
  for (const token of tokens) {
    const label = token.label.toLowerCase();
    if (label.startsWith(query) || token.id.toLowerCase().startsWith(query))
      starts.push(token);
    else if (
      label.includes(query) ||
      token.id.toLowerCase().includes(query) ||
      token.hint?.toLowerCase().includes(query)
    )
      contains.push(token);
  }
  return [...starts, ...contains];
}

function pickerSuggestion(
  editor: Editor,
  runtime: TemplateRuntime,
  pluginKey: PluginKey,
  char: string,
) {
  return Suggestion<TemplateEditorToken, TemplateEditorToken>({
    editor,
    pluginKey,
    char,
    // `@` starts a word (so an email address never opens it); `{{` works anywhere.
    allowedPrefixes: char === "@" ? [" "] : null,
    items: ({ query }) => runtime.items(query),
    command: ({ editor: ed, range, props }) => {
      const after = ed.state.doc.textBetween(
        range.to,
        Math.min(range.to + 1, ed.state.doc.content.size),
        "\n",
        "\n",
      );
      const content: JSONContent[] = [
        { type: TOKEN_NODE, attrs: { id: props.id } },
      ];
      if (!/^[\s.,;:!?)\]}…]/.test(after))
        content.push({ type: "text", text: " " });
      ed.chain().focus().insertContentAt(range, content).run();
    },
    render: () => {
      const show = (
        props: SuggestionProps<TemplateEditorToken, TemplateEditorToken>,
      ) => {
        const previous = runtime.get();
        runtime.set({
          items: props.items,
          index:
            previous && previous.items.length === props.items.length
              ? Math.min(previous.index, Math.max(0, props.items.length - 1))
              : 0,
          rect: props.clientRect?.() ?? null,
          pluginKey,
          command: props.command,
        });
      };
      return {
        onStart: show,
        onUpdate: show,
        onExit: () => runtime.set(null),
        onKeyDown: ({ event }) => {
          const state = runtime.get();
          if (!state) return false;
          return suggestionMenuKeyDown(event, {
            count: state.items.length,
            activeIndex: state.index,
            onActiveIndexChange: (index) => runtime.set({ ...state, index }),
            onSelect: (index) => state.command(state.items[index]!),
            onClose: () => exitSuggestion(editor.view, pluginKey),
          });
        },
      };
    },
  });
}

function pickerExtension(runtime: TemplateRuntime) {
  return Extension.create({
    name: "templateEditorPicker",
    addProseMirrorPlugins() {
      return [
        pickerSuggestion(this.editor, runtime, AT_KEY, "@"),
        pickerSuggestion(this.editor, runtime, BRACES_KEY, "{{"),
      ];
    },
  });
}

/**
 * Plain text pasted in reads `{{id}}` as chips and blank lines as paragraphs (single-line: line
 * breaks as spaces).
 */
function parseClipboardText(
  text: string,
  schema: Schema,
  singleLine: boolean,
): Slice {
  return Slice.maxOpen(
    schema.nodeFromJSON(parseTemplate(text.replace(/\r\n?/g, "\n"), singleLine))
      .content,
  );
}

/* ------------------------------------------------------------------------------------------------
 * Typing rules: replacements and single-line
 * ----------------------------------------------------------------------------------------------*/

/** `replacements`, as one input rule reading the latest list (the extensions are built once). */
function replacementsExtension(runtime: TemplateRuntime) {
  return Extension.create({
    name: "templateEditorReplacements",
    addInputRules() {
      return [
        new InputRule({
          find: (text) => {
            for (const { from, to } of runtime.replacements()) {
              if (from && text.endsWith(from))
                return {
                  index: text.length - from.length,
                  text: from,
                  data: { to },
                };
            }
            return null;
          },
          handler: ({ state, range, match }) => {
            const to = String(match.data?.to ?? "");
            state.tr.insertText(
              runtime.singleLine ? oneLine(to) : to,
              range.from,
              range.to,
            );
          },
        }),
      ];
    },
  });
}

/**
 * Single-line mode: Enter, Shift+Enter and Mod+Enter insert nothing (the picker still takes Enter
 * while it lists something), and whatever still lands as a second paragraph — a drop, rich paste —
 * is joined back onto the first with a space.
 */
function singleLineExtension(runtime: TemplateRuntime) {
  return Extension.create({
    name: "templateEditorSingleLine",
    addKeyboardShortcuts() {
      const swallow = () => !runtime.get()?.items.length;
      return { Enter: swallow, "Shift-Enter": swallow, "Mod-Enter": swallow };
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("templateEditorSingleLine"),
          appendTransaction: (transactions, _previous, state) => {
            if (!transactions.some((tr) => tr.docChanged)) return null;
            if (state.doc.childCount < 2) return null;
            const tr = state.tr;
            const boundaries: number[] = [];
            state.doc.forEach((_child, offset, index) => {
              if (index > 0) boundaries.push(offset);
            });
            for (const boundary of boundaries.reverse()) {
              tr.join(boundary);
              tr.insertText(" ", boundary - 1);
            }
            return tr;
          },
        }),
      ];
    },
  });
}

/* ------------------------------------------------------------------------------------------------
 * Field wiring
 * ----------------------------------------------------------------------------------------------*/

interface FieldAria {
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  disabled?: boolean;
}

/** Renders nothing; reports what an enclosing `Field` resolved, for the contenteditable surface. */
function FieldControlBridge({
  control,
  onResolve,
}: {
  control: FieldAria;
  onResolve: (aria: FieldAria) => void;
}) {
  const {
    id,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    disabled,
  } = control;
  React.useLayoutEffect(() => {
    onResolve({
      id,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      "aria-invalid": invalid,
      disabled,
    });
  }, [id, labelledBy, describedBy, invalid, disabled, onResolve]);
  return null;
}

function isAriaInvalid(value: React.AriaAttributes["aria-invalid"]) {
  return value !== undefined && value !== false && value !== "false";
}

/* ------------------------------------------------------------------------------------------------
 * TemplateEditor
 * ----------------------------------------------------------------------------------------------*/

const SURFACE_CLASS =
  "w-full outline-hidden [&_p+p]:mt-2 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]";

/**
 * `TemplateEditor` — a plain-paragraph editor for text with spec placeholders ("Recessed @Power
 * downlight with @Efficacy…"). Typing `@` or `{{` opens a searchable list of `tokens`; the one
 * picked becomes an inline chip that deletes as a unit and is stored as `{{id}}`. No marks, lists
 * or toolbar: Enter starts a paragraph (stored as `\n\n`), Shift+Enter a line break (`\n`) —
 * or, with `singleLine`, neither, sized like `Input`. `replacements` rewrite characters as you
 * type (`*` → `×` for a formula). An id `tokens` does not know still renders, as its raw id in the
 * destructive style, so nothing is lost. Sized and bordered like `Textarea`, with the text-entry
 * focus cue (a subtle darker border).
 *
 * @example
 * <TemplateEditor
 *   aria-label="Marketing description"
 *   value={template}
 *   onChange={setTemplate}
 *   tokens={[{ id: "power", label: "Power", hint: "W" }]}
 *   placeholder="Type @ to insert a spec"
 * />
 *
 * @example
 * // A one-line formula: `*` and `/` read as × and ÷; the value stays `{{power}} × {{efficacy}}`.
 * <TemplateEditor
 *   aria-label="Formula"
 *   singleLine
 *   replacements={[{ from: "*", to: "×" }, { from: "/", to: "÷" }]}
 *   value={formula}
 *   onChange={setFormula}
 *   tokens={specs}
 *   invalidTokenIds={nonNumericIds}
 * />
 */
function TemplateEditor({
  value,
  onChange,
  tokens,
  placeholder,
  disabled: disabledProp = false,
  invalidTokenIds,
  replacements,
  singleLine: singleLineProp = false,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  ref,
}: TemplateEditorProps) {
  const [field, setField] = React.useState<FieldAria>({});
  const disabled = disabledProp || field.disabled === true;
  const invalid = isAriaInvalid(field["aria-invalid"] ?? ariaInvalid);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const listId = React.useId();
  // Read once: it shapes the schema and the keymap, which are built when the editor mounts.
  const [singleLine] = React.useState(singleLineProp);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const tokensRef = React.useRef(tokens);
  tokensRef.current = tokens;
  const invalidRef = React.useRef(invalidTokenIds);
  invalidRef.current = invalidTokenIds;
  const placeholderRef = React.useRef(placeholder);
  placeholderRef.current = placeholder;
  const replacementsRef = React.useRef(replacements);
  replacementsRef.current = replacements;
  // The last string this editor emitted or was given: `onChange` fires only on a real change.
  const valueRef = React.useRef(value);

  const [menu, setMenuState] = React.useState<MenuState | null>(null);
  const menuRef = React.useRef<MenuState | null>(null);
  const runtime = React.useMemo<TemplateRuntime>(
    () => ({
      singleLine,
      replacements: () => replacementsRef.current ?? [],
      lookup: (tokenId) => {
        const match = tokensRef.current.find((item) => item.id === tokenId);
        return {
          label: match?.label ?? tokenId,
          known: match !== undefined,
          invalid: invalidRef.current?.includes(tokenId) ?? false,
        };
      },
      painters: new Set(),
      items: (query) => filterTokens(tokensRef.current, query),
      get: () => menuRef.current,
      set: (next) => {
        menuRef.current = next;
        setMenuState(next);
      },
    }),
    [singleLine],
  );

  const extensions = React.useMemo(
    () => [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        listItem: false,
        listKeymap: false,
        link: false,
        orderedList: false,
        strike: false,
        underline: false,
        trailingNode: false,
        ...(runtime.singleLine ? { hardBreak: false as const } : {}),
      }),
      Placeholder.configure({
        placeholder: () => placeholderRef.current ?? "",
      }),
      tokenNode(runtime),
      pickerExtension(runtime),
      replacementsExtension(runtime),
      ...(runtime.singleLine ? [singleLineExtension(runtime)] : []),
    ],
    [runtime],
  );

  // The surface's ARIA, read by ProseMirror's `attributes` on every view update.
  const attributes: Record<string, string> = {
    class: cn(SURFACE_CLASS, !singleLine && "min-h-12"),
    role: "textbox",
    "aria-multiline": singleLine ? "false" : "true",
    "data-focus-cue": "border",
    "data-slot": "template-editor-content",
    translate: "no",
    ...((field.id ?? id) ? { id: (field.id ?? id)! } : {}),
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    ...((field["aria-labelledby"] ?? ariaLabelledBy)
      ? { "aria-labelledby": (field["aria-labelledby"] ?? ariaLabelledBy)! }
      : {}),
    ...((field["aria-describedby"] ?? ariaDescribedBy)
      ? { "aria-describedby": (field["aria-describedby"] ?? ariaDescribedBy)! }
      : {}),
    ...(invalid ? { "aria-invalid": "true" } : {}),
    ...(disabled ? { "aria-disabled": "true" } : {}),
    ...(menu && !disabled
      ? {
          "aria-autocomplete": "list",
          "aria-controls": listId,
          ...(menu.items.length
            ? {
                "aria-activedescendant": suggestionMenuOptionId(
                  listId,
                  menu.index,
                ),
              }
            : {}),
        }
      : {}),
  };
  const attributesRef = React.useRef(attributes);
  attributesRef.current = attributes;
  const attributesKey = JSON.stringify(attributes);

  const editorProps = React.useMemo(
    () => ({
      attributes: () => attributesRef.current,
      clipboardTextParser: (text: string, $context: ResolvedPos) =>
        parseClipboardText(text, $context.doc.type.schema, singleLine),
    }),
    [singleLine],
  );
  const [initialContent] = React.useState(() =>
    parseTemplate(value, singleLine),
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    editorProps,
    onUpdate: ({ editor: ed }) => {
      const next = serializeTemplate(ed.state.doc);
      if (next === valueRef.current) return;
      valueRef.current = next;
      onChangeRef.current(next);
    },
  });

  // A new `value` from outside replaces the document; our own echo does not.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === valueRef.current) return;
    valueRef.current = value;
    if (serializeTemplate(editor.state.doc) === value) return;
    editor.commands.setContent(parseTemplate(value, singleLine), {
      emitUpdate: false,
    });
  }, [editor, value, singleLine]);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled, false);
    if (disabled && menuRef.current) runtime.set(null);
  }, [editor, disabled, runtime]);

  // Relabel every chip when the token list or the invalid set changes.
  const tokensKey = JSON.stringify([tokens, invalidTokenIds]);
  React.useEffect(() => {
    for (const paint of runtime.painters) paint();
  }, [runtime, tokensKey]);

  // Apply the surface's ARIA (and the placeholder) whenever they change.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.updateState(editor.state);
  }, [editor, attributesKey, placeholder]);

  return (
    <div
      ref={setRootRef}
      data-slot="template-editor"
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-single-line={singleLine ? "" : undefined}
      // A click on the box's own padding focuses the end of the text, as a textarea's would.
      onMouseDown={(event) => {
        if (disabled || !editor || event.target !== event.currentTarget) return;
        event.preventDefault();
        editor.commands.focus("end");
      }}
      className={cn(
        "relative w-full min-w-0 cursor-text rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-[color,background-color,border-color] duration-150 ease-out has-[[contenteditable=true]:focus]:not-data-invalid:border-ring/50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 data-invalid:border-destructive data-single-line:min-h-8 data-single-line:py-1 md:text-sm dark:bg-input/30 dark:data-disabled:bg-input/80 dark:data-invalid:border-destructive/50",
        className,
      )}
    >
      <FieldPrimitive.Control
        id={id}
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
        {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
        {...(ariaInvalid !== undefined ? { "aria-invalid": ariaInvalid } : {})}
        render={(control) => (
          <FieldControlBridge control={control} onResolve={setField} />
        )}
      />
      <EditorContent editor={editor} />
      {menu && !disabled ? (
        <SuggestionMenu
          id={listId}
          aria-label="Insert placeholder"
          data-menu="template-editor"
          anchor={menu.rect}
          options={menu.items.map((token) => ({
            key: token.id,
            label: token.label,
            description: token.hint,
          }))}
          activeIndex={menu.index}
          onActiveIndexChange={(index) => runtime.set({ ...menu, index })}
          onSelect={(index) => menu.command(menu.items[index]!)}
        />
      ) : null}
    </div>
  );
}

export { TemplateEditor };
