// @vegastack text-edit@0.23.26 sha256-ctosUJAV+lQ9oH2b/fgAOtLMcOXavPqAPn+KAnhu8kA=

"use client";

import * as React from "react";
import {
  useEditor,
  useEditorState,
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type Editor,
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
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Toolbar } from "@base-ui/react/toolbar";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Undo2,
} from "lucide-react";
import { cn, proseClassName } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * Actions and toolbar levels
 * ----------------------------------------------------------------------------------------------*/

/** A named formatting action. The toolbar renders them; the schema allows only what they need. */
export type TextEditAction =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link"
  | "h2"
  | "h3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "table"
  | "hr"
  | "undo"
  | "redo"
  | "clearFormatting";

/** A toolbar level, or an explicit list of actions. */
export type TextEditToolbar =
  "minimal" | "standard" | "full" | readonly TextEditAction[];

/** The action set behind each named level. Each level is a superset of the one before. */
export const TEXT_EDIT_TOOLBARS: Record<
  "minimal" | "standard" | "full",
  readonly TextEditAction[]
> = {
  minimal: ["bold", "italic", "link", "bulletList"],
  standard: [
    "h2",
    "h3",
    "bold",
    "italic",
    "code",
    "link",
    "bulletList",
    "orderedList",
    "taskList",
    "blockquote",
  ],
  full: [
    "undo",
    "redo",
    "h2",
    "h3",
    "bold",
    "italic",
    "strike",
    "code",
    "link",
    "bulletList",
    "orderedList",
    "taskList",
    "blockquote",
    "codeBlock",
    "table",
    "hr",
    "clearFormatting",
  ],
};

/** Toolbar clusters, in order. An action lands in the cluster that names it. */
const ACTION_GROUPS: { label: string; actions: readonly TextEditAction[] }[] = [
  { label: "History", actions: ["undo", "redo"] },
  { label: "Headings", actions: ["h2", "h3"] },
  {
    label: "Text style",
    actions: ["bold", "italic", "strike", "code", "link"],
  },
  { label: "Lists", actions: ["bulletList", "orderedList", "taskList"] },
  { label: "Blocks", actions: ["blockquote", "codeBlock", "table", "hr"] },
  { label: "Clear", actions: ["clearFormatting"] },
];

/** What the bubble menu offers, filtered by the allowed actions. */
const BUBBLE_ACTIONS: readonly TextEditAction[] = [
  "h2",
  "bold",
  "italic",
  "code",
  "link",
];

interface ActionSpec {
  label: string;
  icon: React.ComponentType;
  /** Shortcut keys; `Mod` renders ⌘ on Apple platforms and Ctrl elsewhere. */
  keys?: string[];
  isActive?: (ed: Editor) => boolean;
  run: (ed: Editor) => void;
}

const ACTIONS: Record<TextEditAction, ActionSpec> = {
  bold: {
    label: "Bold",
    icon: Bold,
    keys: ["Mod", "B"],
    isActive: (ed) => ed.isActive("bold"),
    run: (ed) => ed.chain().focus().toggleBold().run(),
  },
  italic: {
    label: "Italic",
    icon: Italic,
    keys: ["Mod", "I"],
    isActive: (ed) => ed.isActive("italic"),
    run: (ed) => ed.chain().focus().toggleItalic().run(),
  },
  strike: {
    label: "Strikethrough",
    icon: Strikethrough,
    keys: ["Mod", "Shift", "S"],
    isActive: (ed) => ed.isActive("strike"),
    run: (ed) => ed.chain().focus().toggleStrike().run(),
  },
  code: {
    label: "Inline code",
    icon: Code,
    keys: ["Mod", "E"],
    isActive: (ed) => ed.isActive("code"),
    run: (ed) => ed.chain().focus().toggleCode().run(),
  },
  link: {
    label: "Link",
    icon: LinkIcon,
    keys: ["Mod", "K"],
    isActive: (ed) => ed.isActive("link"),
    // The link action opens the link popover; see `LinkControl`.
    run: () => {},
  },
  h2: {
    label: "Heading",
    icon: Heading2,
    keys: ["Mod", "Alt", "2"],
    isActive: (ed) => ed.isActive("heading", { level: 2 }),
    run: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  h3: {
    label: "Subheading",
    icon: Heading3,
    keys: ["Mod", "Alt", "3"],
    isActive: (ed) => ed.isActive("heading", { level: 3 }),
    run: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  bulletList: {
    label: "Bullet list",
    icon: List,
    keys: ["Mod", "Shift", "8"],
    isActive: (ed) => ed.isActive("bulletList"),
    run: (ed) => ed.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    label: "Ordered list",
    icon: ListOrdered,
    keys: ["Mod", "Shift", "7"],
    isActive: (ed) => ed.isActive("orderedList"),
    run: (ed) => ed.chain().focus().toggleOrderedList().run(),
  },
  taskList: {
    label: "Task list",
    icon: ListTodo,
    keys: ["Mod", "Shift", "9"],
    isActive: (ed) => ed.isActive("taskList"),
    run: (ed) => ed.chain().focus().toggleTaskList().run(),
  },
  blockquote: {
    label: "Blockquote",
    icon: Quote,
    keys: ["Mod", "Shift", "B"],
    isActive: (ed) => ed.isActive("blockquote"),
    run: (ed) => ed.chain().focus().toggleBlockquote().run(),
  },
  codeBlock: {
    label: "Code block",
    icon: SquareCode,
    keys: ["Mod", "Alt", "C"],
    isActive: (ed) => ed.isActive("codeBlock"),
    run: (ed) => ed.chain().focus().toggleCodeBlock().run(),
  },
  table: {
    label: "Table",
    icon: TableIcon,
    isActive: (ed) => ed.isActive("table"),
    run: (ed) =>
      ed
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  hr: {
    label: "Divider",
    icon: Minus,
    run: (ed) => ed.chain().focus().setHorizontalRule().run(),
  },
  undo: {
    label: "Undo",
    icon: Undo2,
    keys: ["Mod", "Z"],
    run: (ed) => ed.chain().focus().undo().run(),
  },
  redo: {
    label: "Redo",
    icon: Redo2,
    keys: ["Mod", "Shift", "Z"],
    run: (ed) => ed.chain().focus().redo().run(),
  },
  clearFormatting: {
    label: "Clear formatting",
    icon: RemoveFormatting,
    run: (ed) => ed.chain().focus().unsetAllMarks().clearNodes().run(),
  },
};

function resolveActions(toolbar: TextEditToolbar): Set<TextEditAction> {
  return new Set(
    typeof toolbar === "string" ? TEXT_EDIT_TOOLBARS[toolbar] : toolbar,
  );
}

function isApplePlatform() {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
  );
}

/** Render shortcut keys for the current platform (⌘B on Apple, Ctrl B elsewhere). */
function shortcutLabel(keys: string[]): string[] {
  const apple = isApplePlatform();
  return keys.map((key) => {
    if (key === "Mod") return apple ? "⌘" : "Ctrl";
    if (key === "Alt") return apple ? "⌥" : "Alt";
    if (key === "Shift") return apple ? "⇧" : "Shift";
    return key;
  });
}

/* ------------------------------------------------------------------------------------------------
 * Schema — the extensions follow the allowed actions
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
      className="my-3 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-muted text-foreground"
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

function buildExtensions(actions: Set<TextEditAction>, placeholder?: string) {
  const has = (action: TextEditAction) => actions.has(action);
  const lists = has("bulletList") || has("orderedList");
  return [
    StarterKit.configure({
      bold: has("bold") ? {} : false,
      italic: has("italic") ? {} : false,
      strike: has("strike") ? {} : false,
      code: has("code") ? {} : false,
      // Any heading action allows every level, so markdown with an `#` round-trips losslessly.
      heading: has("h2") || has("h3") ? {} : false,
      bulletList: has("bulletList") ? {} : false,
      orderedList: has("orderedList") ? {} : false,
      listItem: lists ? {} : false,
      listKeymap: lists || has("taskList") ? {} : false,
      blockquote: has("blockquote") ? {} : false,
      horizontalRule: has("hr") ? {} : false,
      codeBlock: false,
      underline: false,
      // A trailing empty paragraph would add a line edit mode has and view mode does not.
      trailingNode: false,
      link: has("link")
        ? {
            openOnClick: false,
            autolink: true,
            linkOnPaste: true,
            defaultProtocol: "https",
            HTMLAttributes: {
              rel: "noopener noreferrer nofollow",
              target: "_blank",
            },
          }
        : false,
    }),
    ...(has("codeBlock") ? [CodeBlockWithView] : []),
    ...(has("taskList")
      ? [TaskList, TaskItemWithView.configure({ nested: true })]
      : []),
    ...(has("table")
      ? [TableKit.configure({ table: { resizable: false } })]
      : []),
    // Inline, like GFM's `![]()` inside a paragraph, so an image sits where view mode puts it.
    Image.configure({ inline: true }),
    Placeholder.configure({ placeholder: placeholder ?? "" }),
    Markdown,
  ];
}

/** Whether pasted plain text reads as markdown worth parsing rather than inserting verbatim. */
function looksLikeMarkdown(text: string) {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s|```|\|.+\||-{3,}\s*$)|\*\*[^*]+\*\*|__[^_]+__|`[^`\n]+`|\[[^\]]+\]\([^)]+\)/.test(
    text,
  );
}

/* ------------------------------------------------------------------------------------------------
 * Styling
 * ----------------------------------------------------------------------------------------------*/

/**
 * The editor surface (ProseMirror's `.tiptap` root) wears the shared `prose` recipe — the SAME
 * string `MarkdownView` puts on its root — so edited and rendered markdown are one typography.
 * What is added here only resets ProseMirror so edit mode lays out like view mode: no focus
 * outline (the container or nothing draws focus), the placeholder as a zero-height pseudo-element
 * (no reflow on the first keystroke), the table scroll box `MarkdownView` wraps tables in, and the
 * selected-node and selected-cell washes.
 */
const editorBaseClassName = cn(
  proseClassName,
  "tiptap min-w-0 outline-none",
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
  "[&_.tableWrapper]:my-3 [&_.tableWrapper]:w-full [&_.tableWrapper]:overflow-x-auto [&_.selectedCell]:bg-accent",
  "[&_.ProseMirror-selectednode]:rounded-sm [&_.ProseMirror-selectednode]:bg-accent",
);

const TOOLBAR_GROUP = "flex items-center gap-0.5";
const TOOLBAR_SEPARATOR = "mx-0.5 h-4 w-px shrink-0 bg-border";

/* ------------------------------------------------------------------------------------------------
 * Toolbar parts
 * ----------------------------------------------------------------------------------------------*/

function ShortcutHint({ label, keys }: { label: string; keys?: string[] }) {
  return (
    <>
      {label}
      {keys ? (
        <span className="flex items-center gap-0.5">
          {shortcutLabel(keys).map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </span>
      ) : null}
    </>
  );
}

/** One icon toggle with a tooltip that names it and its shortcut. */
function ActionToggle({
  action,
  editor,
  pressed,
}: {
  action: TextEditAction;
  editor: Editor;
  pressed: boolean;
}) {
  const spec = ACTIONS[action];
  const Icon = spec.icon;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toolbar.Button
            focusableWhenDisabled={false}
            render={
              <Toggle
                size="sm"
                pressed={pressed}
                onPressedChange={() => spec.run(editor)}
                aria-label={spec.label}
                className="min-w-7 px-0"
              >
                <Icon />
              </Toggle>
            }
          />
        }
      />
      <TooltipContent>
        <ShortcutHint label={spec.label} keys={spec.keys} />
      </TooltipContent>
    </Tooltip>
  );
}

function normalizeHref(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value;
  return `https://${value}`;
}

/** The link toggle and its popover: add, edit or remove the link on the selection. */
function LinkControl({
  editor,
  pressed,
  open,
  onOpenChange,
}: {
  editor: Editor;
  pressed: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [href, setHref] = React.useState("");
  React.useEffect(() => {
    if (open) setHref((editor.getAttributes("link").href as string) ?? "");
  }, [open, editor]);

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
    onOpenChange(false);
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onOpenChange(false);
  };

  const spec = ACTIONS.link;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Toolbar.Button
                  focusableWhenDisabled={false}
                  render={
                    <Toggle
                      size="sm"
                      pressed={pressed}
                      aria-label={spec.label}
                      className="min-w-7 px-0"
                    >
                      <LinkIcon />
                    </Toggle>
                  }
                />
              }
            />
          }
        />
        <TooltipContent>
          <ShortcutHint label={spec.label} keys={spec.keys} />
        </TooltipContent>
      </Tooltip>
      <PopoverContent data-slot="text-edit-link" align="start" className="w-80">
        <form onSubmit={apply} className="flex items-center gap-1.5">
          <Input
            aria-label="Link URL"
            placeholder="https://"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            autoFocus
          />
          <Button type="submit" size="sm">
            {pressed ? "Update" : "Add"}
          </Button>
          {pressed ? (
            <Button type="button" size="sm" variant="ghost" onClick={remove}>
              Remove
            </Button>
          ) : null}
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Subscribe to the active state of just the allowed actions (Tiptap v3 does not re-render). */
function useActiveState(editor: Editor, actions: readonly TextEditAction[]) {
  return useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      isEditable: ed.isEditable,
      active: actions.map((action) => ACTIONS[action].isActive?.(ed) ?? false),
    }),
    equalityFn: (a, b) =>
      !!b &&
      a.isEditable === b.isEditable &&
      a.active.every((value, index) => value === b.active[index]),
  });
}

function ActionRow({
  editor,
  actions,
  linkOpen,
  onLinkOpenChange,
}: {
  editor: Editor;
  actions: readonly TextEditAction[];
  linkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
}) {
  const state = useActiveState(editor, actions);
  const pressed = (action: TextEditAction) =>
    state?.active[actions.indexOf(action)] ?? false;
  const groups = ACTION_GROUPS.map((group) => ({
    ...group,
    actions: group.actions.filter((action) => actions.includes(action)),
  })).filter((group) => group.actions.length > 0);

  return groups.map((group, index) => (
    <React.Fragment key={group.label}>
      {index > 0 ? <Toolbar.Separator className={TOOLBAR_SEPARATOR} /> : null}
      <Toolbar.Group
        data-slot="text-edit-toolbar-group"
        aria-label={group.label}
        className={TOOLBAR_GROUP}
      >
        {group.actions.map((action) =>
          action === "link" ? (
            <LinkControl
              key={action}
              editor={editor}
              pressed={pressed(action)}
              open={linkOpen}
              onOpenChange={onLinkOpenChange}
            />
          ) : (
            <ActionToggle
              key={action}
              action={action}
              editor={editor}
              pressed={pressed(action)}
            />
          ),
        )}
      </Toolbar.Group>
    </React.Fragment>
  ));
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
   * through `@tiptap/markdown`, lossless for every element the toolbar allows). Fixed for the
   * editor's life.
   * @default "html"
   */
  format?: "html" | "markdown";
  /**
   * Controlled value. Synced into the editor when it changes externally and the editor is not
   * focused (a focused-time change is applied on blur).
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
   * Shown in the first empty line while the document is empty.
   * @default undefined
   */
  placeholder?: string;
  /**
   * The formatting toolbar: `"minimal"` (bold, italic, link, bullet list), `"standard"` (adds
   * H2, H3, ordered and task lists, blockquote, inline code), `"full"` (adds strikethrough, code
   * block, table, divider, undo/redo, clear formatting), or an explicit array of actions. The
   * editor's schema follows it: a mark or node with no action is not allowed, so pasted or typed
   * markdown for it becomes plain text.
   * @default "standard"
   */
  toolbar?: TextEditToolbar;
  /**
   * Show a floating toolbar over a text selection (heading, bold, italic, inline code, link —
   * whichever of them the toolbar allows).
   * @default true
   */
  bubbleMenu?: boolean;
  /**
   * `outline` is the bordered form control; `ghost` is borderless in-place editing — no border,
   * ground or ring and no content inset, so the text sits exactly where the `MarkdownView` it
   * replaces sat, with only the toolbar above.
   * @default "outline"
   */
  variant?: "outline" | "ghost";
  /**
   * Called with the serialized document on Cmd/Ctrl+Enter, from the toolbar's Save button, and by
   * autosave. When `onSave` or `onCancel` is set, Cancel and Save buttons sit at the toolbar's end.
   * @default undefined
   */
  onSave?: (value: string) => void;
  /**
   * Called on Escape and from the toolbar's Cancel button.
   * @default undefined
   */
  onCancel?: () => void;
  /**
   * Call `onSave` after this many milliseconds without typing (`true` is 1000ms). Off by default.
   * @default false
   */
  autosave?: boolean | number;
  /**
   * Disable the Save button and mark the editor busy while the host persists.
   * @default false
   */
  saving?: boolean;
  /** Label of the toolbar's Save button.
   * @default "Save"
   */
  saveLabel?: string;
  /** Label of the toolbar's Cancel button.
   * @default "Cancel"
   */
  cancelLabel?: string;
  /**
   * Render the document without letting it be edited: no toolbar, and the surface reports
   * `aria-readonly`.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Disable the editor: no toolbar, the surface reports `aria-disabled`, and the root dims.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the content is editable.
   * @deprecated Use `readOnly` (or `disabled`).
   * @default true
   */
  editable?: boolean;
  /**
   * Fired on Cmd/Ctrl+Enter with the serialized document.
   * @deprecated Use `onSave`.
   * @default undefined
   */
  onSubmit?: (value: string) => void;
  /**
   * Minimum height of the editable content area (a number is `px`).
   * @default a built-in minimum for `outline`, none for `ghost`
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
 * `TextEdit` — a Tiptap v3 markdown-first rich-text editor that edits in the same typography
 * `MarkdownView` renders (the shared `prose` recipe), with toolbar levels, a selection bubble menu,
 * a link popover, markdown input rules and paste, and a Save/Cancel keyboard contract.
 *
 * - **Toolbar** — `toolbar="minimal" | "standard" | "full"` or an action array; the schema follows
 *   it. A sticky, quiet Base UI `Toolbar` (one tab stop, arrow keys) of icon toggles whose tooltips
 *   carry the shortcut.
 * - **Markdown** — input rules (`# `, `- `, `1. `, `[ ] `, `> `, ```` ``` ````, `---`, `**`, `_`),
 *   markdown paste, and lossless round-trip through `@tiptap/markdown` with `format="markdown"`.
 * - **Keys** — Cmd/Ctrl+Enter saves, Escape cancels, Cmd/Ctrl+K edits the link.
 * - **Ghost** — `variant="ghost"` edits in place with no pixel shift from `MarkdownView`.
 *
 * @example
 * <TextEdit format="markdown" variant="ghost" value={md} onValueChange={setMd}
 *   onSave={save} onCancel={cancel} />
 */
export function TextEdit({
  format = "html",
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  toolbar = "standard",
  bubbleMenu = true,
  variant = "outline",
  onSave,
  onCancel,
  autosave = false,
  saving = false,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  readOnly = false,
  disabled: disabledProp = false,
  editable: editableProp = true,
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
  const [field, setField] = React.useState<FieldAria>({});
  const disabled = disabledProp || field.disabled === true;
  const editable = editableProp && !readOnly && !disabled;
  // Fixed at creation: the extension set and the parser are chosen once.
  const [markdown] = React.useState(format === "markdown");
  const [allowed] = React.useState(() => resolveActions(toolbar));
  const actions = React.useMemo(
    () =>
      ACTION_GROUPS.flatMap((group) => group.actions).filter((action) =>
        allowed.has(action),
      ),
    [allowed],
  );
  const bubbleActions = React.useMemo(
    () => BUBBLE_ACTIONS.filter((action) => allowed.has(action)),
    [allowed],
  );
  const serialize = React.useCallback(
    (ed: Editor) => (markdown ? ed.getMarkdown().trimEnd() : ed.getHTML()),
    [markdown],
  );

  const callbacks = React.useRef({ onValueChange, onSave, onCancel, onSubmit });
  React.useEffect(() => {
    callbacks.current = { onValueChange, onSave, onCancel, onSubmit };
  }, [onValueChange, onSave, onCancel, onSubmit]);

  const [linkOpen, setLinkOpen] = React.useState(false);
  const [bubbleLinkOpen, setBubbleLinkOpen] = React.useState(false);
  const linkShortcutRef = React.useRef<() => void>(() => {});
  linkShortcutRef.current = () => {
    if (!allowed.has("link")) return;
    if (actions.includes("link")) setLinkOpen(true);
    else setBubbleLinkOpen(true);
  };

  const editorRef = React.useRef<Editor | null>(null);
  const resolvedId = field.id ?? id;
  const resolvedLabelledBy = field["aria-labelledby"] ?? ariaLabelledBy;
  const resolvedDescribedBy = field["aria-describedby"] ?? ariaDescribedBy;
  const ariaInvalidAttribute = toAriaInvalidAttribute(
    field["aria-invalid"] ?? ariaInvalid,
  );
  const invalid = ariaInvalidAttribute !== undefined;
  const ghost = variant === "ghost";
  const editorAttributes = React.useMemo(
    () => ({
      class: cn(editorBaseClassName, ghost ? "p-0" : "min-h-24 px-3 py-2.5"),
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
      ghost,
      saving,
      disabled,
      editable,
      resolvedDescribedBy,
      ariaInvalidAttribute,
      ariaLabel,
      resolvedLabelledBy,
      resolvedId,
    ],
  );

  const save = React.useCallback(() => {
    const ed = editorRef.current;
    const handler = callbacks.current.onSave ?? callbacks.current.onSubmit;
    if (!ed || !handler) return false;
    handler(serialize(ed));
    return true;
  }, [serialize]);

  const editor = useEditor({
    extensions: buildExtensions(allowed, placeholder),
    content: value ?? defaultValue,
    ...(markdown ? { contentType: "markdown" as const } : {}),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: editorAttributes,
      handleKeyDown: (_view, event) => {
        const mod = event.metaKey || event.ctrlKey;
        if (event.key === "Enter" && mod) {
          if (!save()) return false;
          event.preventDefault();
          return true;
        }
        if (event.key === "Escape" && callbacks.current.onCancel) {
          event.preventDefault();
          callbacks.current.onCancel();
          return true;
        }
        if (mod && event.key.toLowerCase() === "k" && allowed.has("link")) {
          event.preventDefault();
          linkShortcutRef.current();
          return true;
        }
        return false;
      },
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

  // Autosave: `onSave` after an idle gap. Off unless `autosave` is set.
  React.useEffect(() => {
    if (!editor || !autosave) return;
    const delay = autosave === true ? 1000 : autosave;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        callbacks.current.onSave?.(serialize(editor));
      }, delay);
    };
    editor.on("update", schedule);
    return () => {
      clearTimeout(timer);
      editor.off("update", schedule);
    };
  }, [editor, autosave, serialize]);

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
  const hasCommit = Boolean(onSave || onCancel);
  const showToolbar = editable && !!editor && (actions.length > 0 || hasCommit);

  return (
    <div
      ref={ref}
      data-slot="text-edit"
      data-variant={variant}
      data-editable={editable ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "relative min-w-0",
        !ghost && [
          "rounded-lg border border-input bg-background",
          "focus-within:border-ring/70",
          // Focus outranks invalid (#100): the container border is the whole focus affordance.
          "not-focus-within:has-aria-invalid:border-destructive/70",
        ],
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
      {showToolbar ? (
        <Toolbar.Root
          data-slot="text-edit-toolbar"
          aria-label="Formatting"
          className={cn(
            "sticky top-0 z-10 flex flex-wrap items-center gap-0.5 bg-background",
            ghost
              ? "mb-2 py-1"
              : "rounded-t-lg border-b border-border px-1.5 py-1",
          )}
        >
          <ActionRow
            editor={editor}
            actions={actions}
            linkOpen={linkOpen}
            onLinkOpenChange={setLinkOpen}
          />
          {hasCommit ? (
            <div
              data-slot="text-edit-commit"
              className="ms-auto flex items-center gap-1.5"
            >
              {onCancel ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Toolbar.Button
                        render={
                          <Button size="sm" variant="ghost" onClick={onCancel}>
                            {cancelLabel}
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent>
                    <ShortcutHint label={cancelLabel} keys={["Esc"]} />
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {onSave ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Toolbar.Button
                        disabled={saving}
                        render={
                          <Button size="sm" onClick={() => save()}>
                            {saveLabel}
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent>
                    <ShortcutHint label={saveLabel} keys={["Mod", "↵"]} />
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          ) : null}
        </Toolbar.Root>
      ) : null}
      {editable && editor && bubbleMenu && bubbleActions.length > 0 ? (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed, from, to }) =>
            bubbleLinkOpen ||
            (ed.isEditable &&
              from !== to &&
              !ed.isActive("codeBlock") &&
              !ed.isActive("image"))
          }
          className={cn("z-50", themeScope)}
        >
          <Toolbar.Root
            data-slot="text-edit-bubble-menu"
            aria-label="Selection formatting"
            className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <ActionRow
              editor={editor}
              actions={bubbleActions}
              linkOpen={bubbleLinkOpen}
              onLinkOpenChange={setBubbleLinkOpen}
            />
          </Toolbar.Root>
        </BubbleMenu>
      ) : null}
      <div
        data-slot="text-edit-content"
        className={cn(
          "relative",
          // Ghost focus cue without a pixel shift: a hairline that is transparent at rest sits in
          // an outset (negative margin, padding one pixel short), so the text box stays exactly
          // where view mode puts it and only the hairline appears while the editor holds focus.
          ghost &&
            "-mx-2 -my-1.5 rounded-md border border-transparent px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1.5)-1px)] focus-within:border-border",
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
