// @vegastack text-edit@0.23.37 sha256-s7j3pxRPU2GdGmiiY6nZnWqRJ/9fHRcbK3ATlPQaiTA=

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  useEditor,
  useEditorState,
  EditorContent,
  Extension,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type Editor,
  type Range,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { CodeBlock as CodeBlockNode } from "@tiptap/extension-code-block";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  Suggestion,
  exitSuggestion,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Toolbar } from "@base-ui/react/toolbar";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Quote,
  SquareCode,
  Strikethrough,
} from "lucide-react";
import { cn, mergeRefs, proseClassName } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

/* ------------------------------------------------------------------------------------------------
 * Slash commands
 * ----------------------------------------------------------------------------------------------*/

/** A block the `/` menu can insert. */
export type TextEditSlashCommand =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "divider"
  | "link";

/** Every slash command, in menu order — the default `slashCommands`. */
export const TEXT_EDIT_SLASH_COMMANDS: readonly TextEditSlashCommand[] = [
  "text",
  "h1",
  "h2",
  "h3",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
  "divider",
  "link",
];

/** A smaller set for comments and replies: lists, a quote, code and links — no headings. */
export const TEXT_EDIT_COMPACT_SLASH_COMMANDS: readonly TextEditSlashCommand[] =
  ["bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "link"];

interface SlashSpec {
  id: TextEditSlashCommand;
  label: string;
  /** Extra words the filter matches. */
  keywords: string;
  hint?: string;
  icon: React.ComponentType;
  run: (ed: Editor, range: Range, openLink: () => void) => void;
}

const SLASH: Record<TextEditSlashCommand, SlashSpec> = {
  text: {
    id: "text",
    label: "Text",
    keywords: "paragraph plain p",
    icon: Pilcrow,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setParagraph().run(),
  },
  h1: {
    id: "h1",
    label: "Heading 1",
    keywords: "title h1 #",
    hint: "#",
    icon: Heading1,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  h2: {
    id: "h2",
    label: "Heading 2",
    keywords: "subtitle h2 ##",
    hint: "##",
    icon: Heading2,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  h3: {
    id: "h3",
    label: "Heading 3",
    keywords: "h3 ###",
    hint: "###",
    icon: Heading3,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  bulletList: {
    id: "bulletList",
    label: "Bullet list",
    keywords: "unordered ul bullets -",
    hint: "-",
    icon: List,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  orderedList: {
    id: "orderedList",
    label: "Numbered list",
    keywords: "ordered ol numbers 1.",
    hint: "1.",
    icon: ListOrdered,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  taskList: {
    id: "taskList",
    label: "Checklist",
    keywords: "todo task checkbox [ ]",
    hint: "[ ]",
    icon: ListTodo,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  blockquote: {
    id: "blockquote",
    label: "Quote",
    keywords: "blockquote citation >",
    hint: ">",
    icon: Quote,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  codeBlock: {
    id: "codeBlock",
    label: "Code block",
    keywords: "pre snippet fence ```",
    hint: "```",
    icon: SquareCode,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  divider: {
    id: "divider",
    label: "Divider",
    keywords: "hr rule separator line ---",
    hint: "---",
    icon: Minus,
    run: (ed, range) =>
      ed.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  link: {
    id: "link",
    label: "Link",
    keywords: "url href anchor",
    hint: "⌘K",
    icon: LinkIcon,
    run: (ed, range, openLink) => {
      ed.chain().focus().deleteRange(range).run();
      openLink();
    },
  },
};

function filterSlash(
  allowed: readonly TextEditSlashCommand[],
  query: string,
): SlashSpec[] {
  const q = query.trim().toLowerCase();
  return allowed
    .map((id) => SLASH[id])
    .filter(
      (spec) =>
        !q ||
        spec.label.toLowerCase().includes(q) ||
        spec.keywords.toLowerCase().includes(q),
    );
}

interface SlashState {
  items: SlashSpec[];
  index: number;
  rect: DOMRect | null;
  command: (spec: SlashSpec) => void;
}

/* ------------------------------------------------------------------------------------------------
 * Node views
 * ----------------------------------------------------------------------------------------------*/
/**
 * Task item node view: the system `Checkbox` beside a content box — the same DOM `MarkdownView`
 * renders for a GFM task item, so `prose.taskList` lays both out identically.
 */
function TaskItemView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const checked = Boolean(node.attrs.checked);
  return (
    <NodeViewWrapper className="contents">
      <Checkbox
        contentEditable={false}
        checked={checked}
        disabled={!editor.isEditable}
        onCheckedChange={(next) => updateAttributes({ checked: next === true })}
        aria-label={checked ? "Mark task not done" : "Mark task done"}
        className="data-disabled:cursor-default data-disabled:opacity-100"
      />
      <NodeViewContent data-slot="task-item-content" />
    </NodeViewWrapper>
  );
}

/**
 * Code block node view: the `CodeBlock` surface (header with language and copy, sunken panel), so
 * a fenced block is the same box in edit mode as `MarkdownView` renders in view mode.
 */
function CodeBlockView({ node }: ReactNodeViewProps) {
  const language = (node.attrs.language as string | null) || undefined;
  return (
    <NodeViewWrapper
      as="figure"
      data-slot="code-block"
      data-language={language}
      className="my-2 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-muted text-foreground"
    >
      <figcaption
        data-slot="code-block-header"
        contentEditable={false}
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5 select-none"
      >
        <span className="font-mono text-xs text-muted-foreground">
          {language ?? "code"}
        </span>
        <CopyButton
          value={node.textContent}
          size="icon-xs"
          variant="ghost"
          copyLabel={`Copy ${language ?? "code"}`}
        />
      </figcaption>
      <pre data-slot="code-block-pre" className="overflow-x-auto p-4 text-sm">
        <NodeViewContent<"code"> as="code" className="font-mono" />
      </pre>
    </NodeViewWrapper>
  );
}

const TaskItemWithView = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView, {
      as: "li",
      attrs: ({ node }) => ({
        "data-type": "taskItem",
        "data-checked": String(Boolean(node.attrs.checked)),
      }),
    });
  },
});

const CodeBlockWithView = CodeBlockNode.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

/* ------------------------------------------------------------------------------------------------
 * Schema — fixed, so every markdown element round-trips losslessly
 * ----------------------------------------------------------------------------------------------*/

const SLASH_KEY = new PluginKey("textEditSlash");

/** What the slash extension reads from the component; refs, so the extensions are built once. */
interface SlashRuntime {
  allowed: React.RefObject<readonly TextEditSlashCommand[]>;
  get: () => SlashState | null;
  set: (next: SlashState | null) => void;
  openLink: () => void;
}

function slashExtension(runtime: SlashRuntime) {
  return Extension.create({
    name: "textEditSlash",
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        Suggestion<SlashSpec, SlashSpec>({
          editor,
          pluginKey: SLASH_KEY,
          char: "/",
          allow: () =>
            runtime.allowed.current.length > 0 && !editor.isActive("codeBlock"),
          items: ({ query }) => filterSlash(runtime.allowed.current, query),
          command: ({ editor: ed, range, props }) =>
            props.run(ed, range, runtime.openLink),
          render: () => {
            const show = (props: SuggestionProps<SlashSpec, SlashSpec>) => {
              const previous = runtime.get();
              runtime.set({
                items: props.items,
                index:
                  previous && previous.items.length === props.items.length
                    ? Math.min(previous.index, props.items.length - 1)
                    : 0,
                rect: props.clientRect?.() ?? null,
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
                const count = state.items.length;
                if (event.key === "Escape") return true;
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
        }),
      ];
    },
  });
}

const LINK_ATTRIBUTES = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

function buildExtensions(
  placeholder: React.RefObject<string | undefined>,
  runtime: SlashRuntime,
) {
  return [
    StarterKit.configure({
      codeBlock: false,
      underline: false,
      // A trailing empty paragraph would add a line edit mode has and view mode does not.
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: LINK_ATTRIBUTES,
      },
    }),
    CodeBlockWithView,
    TaskList,
    TaskItemWithView.configure({ nested: true }),
    // Tables have no slash command, but markdown that carries one still round-trips.
    TableKit.configure({ table: { resizable: false } }),
    // Inline, like GFM's `![]()` inside a paragraph, so an image sits where view mode puts it.
    Image.configure({ inline: true }),
    Placeholder.configure({ placeholder: () => placeholder.current ?? "" }),
    Markdown,
    slashExtension(runtime),
  ];
}

/** Whether pasted plain text reads as markdown worth parsing rather than inserting verbatim. */
function looksLikeMarkdown(text: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|\|.+\||-{3,}\s*$)|\*\*[^*]+\*\*|__[^_]+__|`[^`\n]+`|\[[^\]]+\]\([^)]+\)/.test(
    text,
  );
}

/** Strip what the schema would drop anyway, before it is parsed: scripts, styles, handlers, `javascript:`. */
function sanitizePastedHTML(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /(href|src)\s*=\s*(["']?)\s*(javascript|vbscript|data):[^"'\s>]*\2/gi,
      "",
    );
}

function normalizeHref(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value;
  return `https://${value}`;
}

/* ------------------------------------------------------------------------------------------------
 * Styling
 * ----------------------------------------------------------------------------------------------*/

/**
 * The editor surface (ProseMirror's `.tiptap` root) wears the shared `prose` recipe — the SAME
 * string `MarkdownView` puts on its root — so edited and rendered markdown are one typography.
 * Added here: no outline and no border; the placeholder as a faint zero-height pseudo-element (no
 * reflow on the first keystroke), which becomes the "Type / for commands" hint while focused; and
 * the table scroll box and selected-node washes `MarkdownView` has.
 */
const editorBaseClassName = cn(
  proseClassName,
  "tiptap min-h-6 min-w-0 outline-none",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground/60 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
  "[&_.tableWrapper]:my-2 [&_.tableWrapper]:w-full [&_.tableWrapper]:overflow-x-auto [&_.selectedCell]:bg-accent",
  "[&_.ProseMirror-selectednode]:rounded-sm [&_.ProseMirror-selectednode]:bg-accent",
);

/**
 * FOC-13's cue on an editable surface: a subtle tint on hover and focus — the focus tint is the
 * system's background-image wash, so the focus-indicator contract holds with no border or ring.
 * The box pads into the gutter so the text keeps its x.
 */
const editableSurfaceClassName =
  "-mx-2 rounded-md px-2 py-1 transition-colors hover:bg-accent/40 focus:bg-linear-to-b focus:from-accent/50 focus:to-accent/50";

/** While focused and empty, the placeholder yields to the slash hint. */
const slashHintClassName =
  "[&.ProseMirror-focused_p.is-editor-empty:first-child]:before:content-['Type_/_for_commands']";

const MENU_SURFACE =
  "z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md";

/* ------------------------------------------------------------------------------------------------
 * Slash menu
 * ----------------------------------------------------------------------------------------------*/

function SlashMenu({
  state,
  themeScope,
  onHover,
}: {
  state: SlashState;
  themeScope: string | undefined;
  onHover: (index: number) => void;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    listRef.current
      ?.querySelector("[data-selected]")
      ?.scrollIntoView({ block: "nearest" });
  }, [state.index]);
  if (!state.rect || typeof document === "undefined") return null;
  const below = state.rect.bottom + 4;
  const style: React.CSSProperties = {
    position: "fixed",
    left: state.rect.left,
    ...(below + 320 > window.innerHeight
      ? { bottom: window.innerHeight - state.rect.top + 4 }
      : { top: below }),
  };
  return createPortal(
    <div
      ref={listRef}
      data-slot="text-edit-slash-menu"
      role="listbox"
      aria-label="Insert block"
      style={style}
      // Keep focus (and the caret) in the editor.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(MENU_SURFACE, "max-h-80 w-60 overflow-y-auto", themeScope)}
    >
      {state.items.length === 0 ? (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          No results
        </div>
      ) : (
        state.items.map((spec, index) => {
          const Icon = spec.icon;
          const selected = index === state.index;
          return (
            <div
              key={spec.id}
              role="option"
              aria-selected={selected}
              data-selected={selected ? "" : undefined}
              data-slot="text-edit-slash-item"
              onMouseEnter={() => onHover(index)}
              onClick={() => state.command(spec)}
              className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-selected:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
            >
              <Icon />
              <span className="flex-1">{spec.label}</span>
              {spec.hint ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {spec.hint}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>,
    document.body,
  );
}

/**
 * Tidy serialized markdown. Tiptap writes an empty paragraph (a blank line typed with Enter) as
 * `&nbsp;` between extra blank lines; markdown has no empty paragraph, so they collapse: `&nbsp;`
 * lines go, and runs of blank lines become one. Fenced code is left exactly as typed. The result
 * parses back to itself, so the round trip is stable.
 */
function cleanMarkdown(md: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  for (const line of md.split("\n")) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      out.push(line);
      if (marker && marker[0] === fence[0] && marker.length >= fence.length)
        fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      out.push(line);
      continue;
    }
    const blank = line.trim() === "" || line.trim() === "&nbsp;";
    if (blank && (out.length === 0 || out[out.length - 1] === "")) continue;
    out.push(blank ? "" : line);
  }
  return out.join("\n").trim();
}

/* ------------------------------------------------------------------------------------------------
 * Bubble menu
 * ----------------------------------------------------------------------------------------------*/

const MARKS = [
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    run: (ed: Editor) => ed.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    run: (ed: Editor) => ed.chain().focus().toggleItalic().run(),
  },
  {
    id: "strike",
    label: "Strikethrough",
    icon: Strikethrough,
    run: (ed: Editor) => ed.chain().focus().toggleStrike().run(),
  },
  {
    id: "code",
    label: "Inline code",
    icon: Code,
    run: (ed: Editor) => ed.chain().focus().toggleCode().run(),
  },
] as const;

function SelectionMenu({
  editor,
  linkOpen,
  onLinkOpenChange,
  onLeave,
}: {
  editor: Editor;
  linkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
  onLeave: (next: EventTarget | null) => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      strike: ed.isActive("strike"),
      code: ed.isActive("code"),
      link: ed.isActive("link"),
    }),
  });
  const [href, setHref] = React.useState("");
  React.useEffect(() => {
    if (linkOpen) setHref((editor.getAttributes("link").href as string) ?? "");
  }, [linkOpen, editor]);

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const next = normalizeHref(href);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!next) chain.unsetLink().run();
    else if (editor.state.selection.empty && !editor.isActive("link"))
      chain
        .insertContent({
          type: "text",
          text: next,
          marks: [{ type: "link", attrs: { href: next } }],
        })
        .run();
    else chain.setLink({ href: next }).run();
    onLinkOpenChange(false);
  };

  if (linkOpen) {
    return (
      <form
        data-slot="text-edit-link"
        onSubmit={apply}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          onLinkOpenChange(false);
          onLeave(event.relatedTarget);
        }}
        className={cn(MENU_SURFACE, "flex w-72 items-center gap-1")}
      >
        <Input
          aria-label="Link URL"
          placeholder="Paste or type a link"
          value={href}
          onChange={(event) => setHref(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            onLinkOpenChange(false);
            editor.commands.focus();
          }}
          autoFocus
          className="h-7"
        />
        {state?.link ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onLinkOpenChange(false);
            }}
          >
            Remove
          </Button>
        ) : null}
      </form>
    );
  }

  return (
    <Toolbar.Root
      data-slot="text-edit-bubble-menu"
      aria-label="Selection formatting"
      className={cn(MENU_SURFACE, "flex items-center gap-0.5")}
    >
      {MARKS.map((mark) => {
        const Icon = mark.icon;
        return (
          <Toolbar.Button
            key={mark.id}
            render={
              <Toggle
                size="sm"
                pressed={state?.[mark.id] ?? false}
                onPressedChange={() => mark.run(editor)}
                aria-label={mark.label}
                className="min-w-7 px-0"
              >
                <Icon />
              </Toggle>
            }
          />
        );
      })}
      <Toolbar.Button
        render={
          <Toggle
            size="sm"
            pressed={state?.link ?? false}
            onPressedChange={() => onLinkOpenChange(true)}
            aria-label="Link"
            className="min-w-7 px-0"
          >
            <LinkIcon />
          </Toggle>
        }
      />
    </Toolbar.Root>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Field bridge
 * ----------------------------------------------------------------------------------------------*/

function toCssLength(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function isAriaInvalid(value: React.AriaAttributes["aria-invalid"]): boolean {
  return value !== undefined && value !== false && value !== "false";
}

function toAriaInvalidAttribute(
  value: React.AriaAttributes["aria-invalid"],
): string | undefined {
  if (!isAriaInvalid(value)) return undefined;
  return value === true ? "true" : String(value);
}

/** The ARIA wiring an enclosing `Field` resolved for the editor (see `FieldControlBridge`). */
interface FieldAria {
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  disabled?: boolean;
}

/**
 * DS-47: renders nothing, and reports the props Base UI's `Field.Control` resolved so `TextEdit`
 * can put them on the contenteditable Tiptap creates, which cannot itself BE the control element.
 */
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

/* ------------------------------------------------------------------------------------------------
 * TextEdit
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `TextEdit`. */
export interface TextEditProps {
  /**
   * What `value`, `defaultValue` and `onValueChange` carry: HTML, or Markdown (CommonMark + GFM
   * through `@tiptap/markdown`, lossless for headings, lists, tasks, code, links, quotes and
   * tables). Fixed for the editor's life.
   * @default "html"
   */
  format?: "html" | "markdown";
  /**
   * Controlled value. Synced into the editor when it changes externally and the editor is not
   * focused — a change that arrives while focused is applied on blur, so the caret never jumps.
   * @default undefined
   */
  value?: string;
  /**
   * Uncontrolled initial content, used only on first render. Ignored when `value` is provided.
   * @default ''
   */
  defaultValue?: string;
  /**
   * Called with the serialized document whenever it changes.
   * @default undefined
   */
  onValueChange?: (value: string) => void;
  /**
   * Shown, faint, in the first line while the document is empty. While focused it becomes the
   * "Type / for commands" hint (when any slash command is allowed).
   * @default undefined
   */
  placeholder?: string;
  /**
   * The blocks the `/` menu offers, in order. `[]` turns the menu off. Markdown typed or pasted
   * for any block still works — this limits the menu, not the schema.
   * @default TEXT_EDIT_SLASH_COMMANDS (all)
   */
  slashCommands?: readonly TextEditSlashCommand[];
  /**
   * Called with the serialized document when an edit is committed: focus leaves the editor with a
   * document that differs from the one focus arrived with, the page is hidden, the editor
   * unmounts mid-edit, or `autosave` fires. One commit path — a value is never committed twice.
   * @default undefined
   */
  onCommit?: (value: string) => void;
  /**
   * Called after Escape reverts the document to what it was when focus arrived and blurs the
   * editor. Nothing is committed.
   * @default undefined
   */
  onRevert?: () => void;
  /**
   * Fired on Cmd/Ctrl+Enter with the serialized document (send a comment, create the record).
   * Without it, Cmd/Ctrl+Enter commits and blurs.
   * @default undefined
   */
  onSubmit?: (value: string) => void;
  /**
   * Also call `onCommit` after this many milliseconds without typing (`true` is 1000ms).
   * @default false
   */
  autosave?: boolean | number;
  /**
   * Mark the editor busy (`aria-busy`) while the host persists a commit.
   * @default false
   */
  saving?: boolean;
  /**
   * Render the document without letting it be edited; the surface reports `aria-readonly`.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Disable the editor: the surface reports `aria-disabled`, and the root dims.
   * @default false
   */
  disabled?: boolean;
  /**
   * Minimum height of the editable content area (a number is `px`).
   * @default undefined
   */
  minHeight?: number | string;
  /**
   * Maximum height of the editable content area; it scrolls past it.
   * @default undefined
   */
  maxHeight?: number | string;
  /** Accessible label for the editable region.
   * @default undefined
   */
  "aria-label"?: string;
  /** `id` applied to the contenteditable surface.
   * @default undefined
   */
  id?: string;
  /** Id(s) of the element(s) that label the editable region.
   * @default undefined
   */
  "aria-labelledby"?: string;
  /** Marks the textbox invalid.
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /** Id(s) of helper or error text describing the editor.
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
 * `TextEdit` — a Tiptap v3 markdown-first rich-text editor, Notion/Linear-style: no toolbar, no
 * border and no ring. The surface wears the shared `prose` recipe — the same string
 * `MarkdownView` renders with — so an idle editor looks exactly like rendered markdown; a faint
 * tint on hover and focus is the only chrome. Click anywhere and type.
 *
 * - **Slash menu** — `/` opens a filterable block menu (↑↓, Enter, Esc); `slashCommands` limits it.
 * - **Bubble menu** — selecting text offers bold, italic, strike, inline code and a link input.
 * - **Markdown** — input rules (`# `, `- `, `1. `, `[ ] `, `> `, ```` ``` ````, `---`, `**`, `_`,
 *   `` ` ``), ⌘B / ⌘I / ⌘K, markdown paste, lossless round-trip with `format="markdown"`.
 * - **Commit** — `onCommit(value)` when focus leaves with a change (and on hide, unmount and
 *   `autosave`); Escape reverts and calls `onRevert`; Cmd/Ctrl+Enter calls `onSubmit`.
 *
 * @example
 * <TextEdit format="markdown" defaultValue={md} onCommit={save} aria-label="Description" />
 */
export function TextEdit({
  format = "html",
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  slashCommands = TEXT_EDIT_SLASH_COMMANDS,
  onCommit,
  onRevert,
  onSubmit,
  autosave = false,
  saving = false,
  readOnly = false,
  disabled: disabledProp = false,
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
  const [field, setField] = React.useState<FieldAria>({});
  const disabled = disabledProp || field.disabled === true;
  const editable = !readOnly && !disabled;
  // Fixed at creation: the parser is chosen once.
  const [markdown] = React.useState(format === "markdown");
  const serialize = React.useCallback(
    (ed: Editor) => (markdown ? cleanMarkdown(ed.getMarkdown()) : ed.getHTML()),
    [markdown],
  );

  const callbacks = React.useRef({
    onValueChange,
    onCommit,
    onRevert,
    onSubmit,
  });
  React.useEffect(() => {
    callbacks.current = { onValueChange, onCommit, onRevert, onSubmit };
  }, [onValueChange, onCommit, onRevert, onSubmit]);

  const placeholderRef = React.useRef(placeholder);
  placeholderRef.current = placeholder;
  const slashRef = React.useRef<readonly TextEditSlashCommand[]>(slashCommands);
  slashRef.current = slashCommands;

  const [linkOpen, setLinkOpen] = React.useState(false);
  const [slash, setSlashState] = React.useState<SlashState | null>(null);
  const slashStateRef = React.useRef<SlashState | null>(null);

  // Built once: the editor is never recreated by a re-render.
  const [extensions] = React.useState(() =>
    buildExtensions(placeholderRef, {
      allowed: slashRef,
      get: () => slashStateRef.current,
      set: (next) => {
        slashStateRef.current = next;
        setSlashState(next);
      },
      openLink: () => setLinkOpen(true),
    }),
  );

  const editorRef = React.useRef<Editor | null>(null);
  const resolvedId = field.id ?? id;
  const resolvedLabelledBy = field["aria-labelledby"] ?? ariaLabelledBy;
  const resolvedDescribedBy = field["aria-describedby"] ?? ariaDescribedBy;
  const ariaInvalidAttribute = toAriaInvalidAttribute(
    field["aria-invalid"] ?? ariaInvalid,
  );
  const invalid = ariaInvalidAttribute !== undefined;
  const hasSlash = slashCommands.length > 0;
  const editorAttributes = React.useMemo(
    () => ({
      class: cn(
        editorBaseClassName,
        editable && editableSurfaceClassName,
        editable && hasSlash && slashHintClassName,
      ),
      ...(resolvedId ? { id: resolvedId } : {}),
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(resolvedLabelledBy ? { "aria-labelledby": resolvedLabelledBy } : {}),
      ...(ariaInvalidAttribute ? { "aria-invalid": ariaInvalidAttribute } : {}),
      ...(resolvedDescribedBy
        ? { "aria-describedby": resolvedDescribedBy }
        : {}),
      role: "textbox",
      "aria-multiline": "true",
      ...(saving ? { "aria-busy": "true" } : {}),
      ...(disabled ? { "aria-disabled": "true" } : {}),
      ...(!disabled && !editable ? { "aria-readonly": "true" } : {}),
    }),
    [
      saving,
      disabled,
      editable,
      hasSlash,
      resolvedDescribedBy,
      ariaInvalidAttribute,
      ariaLabel,
      resolvedLabelledBy,
      resolvedId,
    ],
  );

  // The document as focus found it: a commit compares against it, Escape restores it. Null while
  // no edit session is open, which is what makes every commit path idempotent.
  const baselineRef = React.useRef<string | null>(null);
  const commit = React.useCallback(() => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed || baselineRef.current === null) return;
    const next = serialize(ed);
    if (next === baselineRef.current) return;
    baselineRef.current = next;
    callbacks.current.onCommit?.(next);
  }, [serialize]);
  const revert = React.useCallback(() => {
    const ed = editorRef.current;
    if (!ed || baselineRef.current === null) return;
    const previous = baselineRef.current;
    if (serialize(ed) !== previous) {
      ed.commands.setContent(previous, {
        emitUpdate: false,
        ...(markdown ? { contentType: "markdown" as const } : {}),
      });
      callbacks.current.onValueChange?.(previous);
    }
    baselineRef.current = null;
    ed.commands.blur();
    callbacks.current.onRevert?.();
  }, [markdown, serialize]);

  const editor = useEditor({
    extensions,
    content: value ?? defaultValue,
    ...(markdown ? { contentType: "markdown" as const } : {}),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: editorAttributes,
      handleKeyDown: (view, event) => {
        // The slash menu owns Enter, arrows and Escape while it is open.
        if (SLASH_KEY.getState(view.state)?.active) return false;
        const mod = event.metaKey || event.ctrlKey;
        if (event.key === "Enter" && mod) {
          event.preventDefault();
          const ed = editorRef.current;
          if (!ed) return true;
          if (callbacks.current.onSubmit) {
            const next = serialize(ed);
            // Submitted is handled: a later blur must not commit the same text.
            if (baselineRef.current !== null) baselineRef.current = next;
            callbacks.current.onSubmit(next);
          } else ed.commands.blur();
          return true;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          revert();
          return true;
        }
        if (mod && event.key.toLowerCase() === "k") {
          event.preventDefault();
          setLinkOpen(true);
          return true;
        }
        return false;
      },
      transformPastedHTML: sanitizePastedHTML,
      // Markdown pasted as plain text is parsed, not inserted verbatim. A bare URL is left to the
      // link extension, which turns it into a link over the selection.
      handlePaste: (_view, event) => {
        const ed = editorRef.current;
        const text = event.clipboardData?.getData("text/plain");
        if (
          !ed ||
          !text ||
          event.clipboardData?.getData("text/html") ||
          ed.isActive("codeBlock") ||
          !looksLikeMarkdown(text)
        )
          return false;
        ed.commands.insertContent(text, { contentType: "markdown" });
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      callbacks.current.onValueChange?.(serialize(ed));
    },
  });

  editorRef.current = editor;

  React.useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: editorAttributes,
      },
    });
  }, [editor, editorAttributes]);

  React.useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // Autosave: `onCommit` after an idle gap. Off unless `autosave` is set.
  React.useEffect(() => {
    if (!editor || !autosave) return;
    const delay = autosave === true ? 1000 : autosave;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(commit, delay);
    };
    editor.on("update", schedule);
    return () => {
      clearTimeout(timer);
      editor.off("update", schedule);
    };
  }, [editor, autosave, commit]);

  // A hidden page (tab switch, close) and an unmount mid-edit both commit through the same path.
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") commit();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      commit();
    };
  }, [commit]);

  // External value: applied at once while unfocused, deferred to blur while focused.
  const pendingValueRef = React.useRef<string | undefined>(undefined);
  const applyValue = React.useCallback(
    (ed: Editor, next: string) => {
      if (serialize(ed) === next) return;
      ed.commands.setContent(next, {
        emitUpdate: false,
        ...(markdown ? { contentType: "markdown" as const } : {}),
      });
    },
    [markdown, serialize],
  );

  React.useEffect(() => {
    if (!editor || value === undefined) return;
    if (editor.isFocused) {
      pendingValueRef.current = value;
      return;
    }
    pendingValueRef.current = undefined;
    applyValue(editor, value);
  }, [editor, value, applyValue]);

  // Focus: the editor, the bubble menu, the link input and the slash menu are one editing session.
  // Arriving records the baseline; leaving all of them commits.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const isInside = React.useCallback((node: EventTarget | null) => {
    if (!(node instanceof Element)) return false;
    return (
      Boolean(rootRef.current?.contains(node)) ||
      Boolean(
        node.closest(
          "[data-slot=text-edit-bubble-menu],[data-slot=text-edit-link],[data-slot=text-edit-slash-menu]",
        ),
      )
    );
  }, []);
  const leave = React.useCallback(
    (next: EventTarget | null) => {
      if (isInside(next)) return;
      commit();
      baselineRef.current = null;
      const ed = editorRef.current;
      const pending = pendingValueRef.current;
      if (ed && pending !== undefined) {
        pendingValueRef.current = undefined;
        applyValue(ed, pending);
      }
    },
    [commit, isInside, applyValue],
  );

  React.useEffect(() => {
    if (!editor) return;
    const onFocus = () => {
      if (editor.isEditable && baselineRef.current === null)
        baselineRef.current = serialize(editor);
    };
    const onBlur = ({ event }: { event: FocusEvent }) => {
      if (linkOpen) return;
      leave(event.relatedTarget);
    };
    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    return () => {
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
    };
  }, [editor, serialize, leave, linkOpen]);

  const setRootRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);

  const themeScope = useInternalThemeScope();
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
      ref={setRootRef}
      data-slot="text-edit"
      data-editable={editable ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "relative min-w-0 bg-transparent",
        editable && "cursor-text",
        disabled && "opacity-50",
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
      {editable && editor ? (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed, from, to }) =>
            linkOpen ||
            (ed.isEditable &&
              from !== to &&
              !ed.isActive("codeBlock") &&
              !ed.isActive("image"))
          }
          className={cn("z-50", themeScope)}
        >
          <SelectionMenu
            editor={editor}
            linkOpen={linkOpen}
            onLinkOpenChange={setLinkOpen}
            onLeave={leave}
          />
        </BubbleMenu>
      ) : null}
      {slash && editable ? (
        <SlashMenu
          state={slash}
          themeScope={themeScope}
          onHover={(index) => {
            const next = { ...slash, index };
            slashStateRef.current = next;
            setSlashState(next);
          }}
        />
      ) : null}
      <div
        data-slot="text-edit-content"
        // Clicking the blank space around short content still starts editing, Notion-style.
        onMouseDown={(event) => {
          if (!editor || !editable || event.target !== event.currentTarget)
            return;
          event.preventDefault();
          editor.commands.focus("end");
        }}
        className={cn(
          "relative",
          minCss != null && "min-h-[var(--te-min-h)]",
          maxCss != null && "max-h-[var(--te-max-h)] overflow-y-auto",
        )}
        style={contentStyle}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
