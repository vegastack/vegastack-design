// @vegastack template-editor@0.23.118 sha256-MK2t/jZS4B4ll98bVNMAfaEAD2Q1mv+YzLVhSBJRbO8=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
import { PluginKey } from "@tiptap/pm/state";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn, mergeRefs } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

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

/**
 * The template string as a document: one paragraph per `\n\n`-separated block, a hard break per
 * `\n` inside one, a token node per `{{id}}`. `serialize(parseTemplate(v)) === v` for every string.
 */
function parseTemplate(value: string): JSONContent {
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
          if (event.key === "Escape") {
            exitSuggestion(editor.view, pluginKey);
            return true;
          }
          const count = state.items.length;
          if (!count) return false;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const step = event.key === "ArrowDown" ? 1 : -1;
            runtime.set({
              ...state,
              index: (state.index + step + count) % count,
            });
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            state.command(state.items[state.index]!);
            return true;
          }
          return false;
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

/** Plain text pasted in reads `{{id}}` as chips and blank lines as paragraphs. */
function parseClipboardText(text: string, schema: Schema): Slice {
  return Slice.maxOpen(
    schema.nodeFromJSON(parseTemplate(text.replace(/\r\n?/g, "\n"))).content,
  );
}

/* ------------------------------------------------------------------------------------------------
 * Menu — the slash menu's surface and rows (TextEdit), portaled to <body>
 * ----------------------------------------------------------------------------------------------*/

const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";
const MENU_WIDTH = 256;
const MENU_HEIGHT = 288;
const VIEWPORT_GAP = 8;

function TokenMenu({
  state,
  listId,
  optionId,
  onHover,
}: {
  state: MenuState;
  listId: string;
  optionId: (index: number) => string;
  onHover: (index: number) => void;
}) {
  const themeScope = useInternalThemeScope();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    listRef.current
      ?.querySelector("[data-selected]")
      ?.scrollIntoView({ block: "nearest" });
  }, [state.index]);
  if (!state.rect || typeof document === "undefined") return null;
  // Below the caret unless it would not fit and above has more room; slid to stay on screen.
  const below = state.rect.bottom + 4;
  const roomBelow = window.innerHeight - below - VIEWPORT_GAP;
  const roomAbove = state.rect.top - 4 - VIEWPORT_GAP;
  const flip = roomBelow < MENU_HEIGHT && roomAbove > roomBelow;
  const left = Math.max(
    VIEWPORT_GAP,
    Math.min(state.rect.left, window.innerWidth - MENU_WIDTH - VIEWPORT_GAP),
  );
  const style: React.CSSProperties = {
    position: "fixed",
    left,
    maxHeight: Math.max(
      120,
      Math.min(MENU_HEIGHT, flip ? roomAbove : roomBelow),
    ),
    ...(flip
      ? { bottom: window.innerHeight - state.rect.top + 4 }
      : { top: below }),
  };
  return createPortal(
    <div
      data-slot="template-editor-layer"
      className={cn("contents", themeScope)}
    >
      <div
        ref={listRef}
        id={listId}
        data-slot="template-editor-menu"
        data-side={flip ? "top" : "bottom"}
        role="listbox"
        aria-label="Insert placeholder"
        style={style}
        // Keep focus (and the caret) in the editor.
        onMouseDown={(event) => event.preventDefault()}
        className={cn(MENU_SURFACE, "w-64 overflow-y-auto")}
      >
        {state.items.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No results
          </div>
        ) : (
          state.items.map((token, index) => {
            const selected = index === state.index;
            return (
              <div
                key={token.id}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                data-selected={selected ? "" : undefined}
                data-slot="template-editor-option"
                onMouseEnter={() => onHover(index)}
                onClick={() => state.command(token)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-selected:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate">{token.label}</span>
                {token.hint ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {token.hint}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body,
  );
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
  "min-h-12 w-full outline-hidden [&_p+p]:mt-2 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]";

/**
 * `TemplateEditor` — a plain-paragraph editor for text with spec placeholders ("Recessed @Power
 * downlight with @Efficacy…"). Typing `@` or `{{` opens a searchable list of `tokens`; the one
 * picked becomes an inline chip that deletes as a unit and is stored as `{{id}}`. No marks, lists
 * or toolbar: Enter starts a paragraph (stored as `\n\n`), Shift+Enter a line break (`\n`). An id
 * `tokens` does not know still renders, as its raw id in the destructive style, so nothing is lost.
 * Sized and bordered like `Textarea`, with the text-entry focus cue (a subtle darker border).
 *
 * @example
 * <TemplateEditor
 *   aria-label="Marketing description"
 *   value={template}
 *   onChange={setTemplate}
 *   tokens={[{ id: "power", label: "Power", hint: "W" }]}
 *   placeholder="Type @ to insert a spec"
 * />
 */
function TemplateEditor({
  value,
  onChange,
  tokens,
  placeholder,
  disabled: disabledProp = false,
  invalidTokenIds,
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

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const tokensRef = React.useRef(tokens);
  tokensRef.current = tokens;
  const invalidRef = React.useRef(invalidTokenIds);
  invalidRef.current = invalidTokenIds;
  const placeholderRef = React.useRef(placeholder);
  placeholderRef.current = placeholder;
  // The last string this editor emitted or was given: `onChange` fires only on a real change.
  const valueRef = React.useRef(value);

  const [menu, setMenuState] = React.useState<MenuState | null>(null);
  const menuRef = React.useRef<MenuState | null>(null);
  const runtime = React.useMemo<TemplateRuntime>(
    () => ({
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
    [],
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
      }),
      Placeholder.configure({
        placeholder: () => placeholderRef.current ?? "",
      }),
      tokenNode(runtime),
      pickerExtension(runtime),
    ],
    [runtime],
  );

  // The surface's ARIA, read by ProseMirror's `attributes` on every view update.
  const optionId = React.useCallback(
    (index: number) => `${listId}-option-${index}`,
    [listId],
  );
  const attributes: Record<string, string> = {
    class: SURFACE_CLASS,
    role: "textbox",
    "aria-multiline": "true",
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
            ? { "aria-activedescendant": optionId(menu.index) }
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
        parseClipboardText(text, $context.doc.type.schema),
    }),
    [],
  );
  const [initialContent] = React.useState(() => parseTemplate(value));

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
    editor.commands.setContent(parseTemplate(value), { emitUpdate: false });
  }, [editor, value]);

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
      // A click on the box's own padding focuses the end of the text, as a textarea's would.
      onMouseDown={(event) => {
        if (disabled || !editor || event.target !== event.currentTarget) return;
        event.preventDefault();
        editor.commands.focus("end");
      }}
      className={cn(
        "relative w-full min-w-0 cursor-text rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-[color,background-color,border-color] duration-150 ease-out has-[[contenteditable=true]:focus]:not-data-invalid:border-ring/50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 data-invalid:border-destructive md:text-sm dark:bg-input/30 dark:data-disabled:bg-input/80 dark:data-invalid:border-destructive/50",
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
        <TokenMenu
          state={menu}
          listId={listId}
          optionId={optionId}
          onHover={(index) => runtime.set({ ...menu, index })}
        />
      ) : null}
    </div>
  );
}

export { TemplateEditor };
