// @vegastack emoji-picker@0.1.0 sha256-pxlr4F1OJerI44KxKmpUIdyvbLE8L9tE9VKi+AR+yGk=

"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { cn, FLOATING } from "@vegastack/design";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------------------------------------
 * EmojiPicker — a Popover-housed, searchable grid of emoji, grouped by category, that returns the
 * selected emoji character via `onValueChange`.
 *
 * Self-contained + lightweight by design: instead of pulling in a heavy emoji library, it EMBEDS a
 * curated set of ~300 of the most common emoji (the `EMOJI` dataset below), grouped into the nine
 * standard categories. This keeps the copy-in zero-dependency and tree-shakeable; consumers who need
 * the full Unicode set can extend `EMOJI` or swap in their own data.
 *
 * Composition: our `Popover` (trigger + floating panel) + a search `Input` + a plain scrollable grid
 * of icon `Button`s. Each emoji button carries an `aria-label` (the emoji name) so the grid is
 * screen-reader navigable. Search filters across emoji names and keywords.
 * ----------------------------------------------------------------------------------------------*/

/** A single emoji entry: the rendered character, its accessible name, and search keywords. */
export interface EmojiEntry {
  /** The emoji character to render and return from `onValueChange`. */
  char: string;
  /** Human-readable name — used as the button `aria-label` and matched by search. */
  name: string;
  /** Extra search terms (beyond `name`) that should surface this emoji. */
  keywords?: string[];
}

/** The ordered list of emoji categories shown as section headings. */
export type EmojiCategory =
  | "Smileys"
  | "People"
  | "Animals"
  | "Food"
  | "Activities"
  | "Travel"
  | "Objects"
  | "Symbols"
  | "Flags";

/**
 * `EMOJI` — the embedded, curated emoji dataset: a few hundred of the most common emoji grouped by
 * category. NOT the full Unicode set — intentionally kept small so the component stays self-contained
 * and lightweight. Extend or replace this to support more emoji.
 */
export const EMOJI: Record<EmojiCategory, EmojiEntry[]> = {
  Smileys: [
    { char: "😀", name: "grinning face", keywords: ["smile", "happy"] },
    {
      char: "😃",
      name: "grinning face with big eyes",
      keywords: ["smile", "happy"],
    },
    {
      char: "😄",
      name: "grinning face with smiling eyes",
      keywords: ["smile", "happy"],
    },
    { char: "😁", name: "beaming face with smiling eyes", keywords: ["grin"] },
    {
      char: "😆",
      name: "grinning squinting face",
      keywords: ["laugh", "haha"],
    },
    {
      char: "😅",
      name: "grinning face with sweat",
      keywords: ["laugh", "relief"],
    },
    {
      char: "😂",
      name: "face with tears of joy",
      keywords: ["lol", "laugh", "cry"],
    },
    {
      char: "🤣",
      name: "rolling on the floor laughing",
      keywords: ["rofl", "lol"],
    },
    {
      char: "😊",
      name: "smiling face with smiling eyes",
      keywords: ["blush", "happy"],
    },
    {
      char: "😇",
      name: "smiling face with halo",
      keywords: ["angel", "innocent"],
    },
    { char: "🙂", name: "slightly smiling face", keywords: ["smile"] },
    { char: "🙃", name: "upside-down face", keywords: ["silly"] },
    { char: "😉", name: "winking face", keywords: ["wink", "flirt"] },
    { char: "😌", name: "relieved face", keywords: ["calm"] },
    {
      char: "😍",
      name: "smiling face with heart-eyes",
      keywords: ["love", "crush"],
    },
    {
      char: "🥰",
      name: "smiling face with hearts",
      keywords: ["love", "adore"],
    },
    { char: "😘", name: "face blowing a kiss", keywords: ["kiss", "love"] },
    { char: "😋", name: "face savoring food", keywords: ["yum", "tasty"] },
    {
      char: "😜",
      name: "winking face with tongue",
      keywords: ["silly", "joke"],
    },
    { char: "🤪", name: "zany face", keywords: ["crazy", "goofy"] },
    { char: "😎", name: "smiling face with sunglasses", keywords: ["cool"] },
    { char: "🤩", name: "star-struck", keywords: ["excited", "star"] },
    { char: "🥳", name: "partying face", keywords: ["party", "celebrate"] },
    { char: "😏", name: "smirking face", keywords: ["smug"] },
    { char: "😒", name: "unamused face", keywords: ["meh", "unimpressed"] },
    { char: "🙄", name: "face with rolling eyes", keywords: ["annoyed"] },
    { char: "😞", name: "disappointed face", keywords: ["sad"] },
    { char: "😔", name: "pensive face", keywords: ["sad", "down"] },
    { char: "😢", name: "crying face", keywords: ["sad", "tear"] },
    { char: "😭", name: "loudly crying face", keywords: ["sob", "cry"] },
    {
      char: "😤",
      name: "face with steam from nose",
      keywords: ["frustrated", "proud"],
    },
    { char: "😠", name: "angry face", keywords: ["mad"] },
    { char: "😡", name: "pouting face", keywords: ["rage", "angry"] },
    { char: "🤔", name: "thinking face", keywords: ["hmm", "consider"] },
    {
      char: "🤨",
      name: "face with raised eyebrow",
      keywords: ["skeptical", "suspicious"],
    },
    { char: "😴", name: "sleeping face", keywords: ["sleep", "zzz"] },
    { char: "🤯", name: "exploding head", keywords: ["mind blown", "shocked"] },
    {
      char: "😱",
      name: "face screaming in fear",
      keywords: ["scream", "shock"],
    },
    { char: "🤗", name: "smiling face with open hands", keywords: ["hug"] },
    { char: "🤐", name: "zipper-mouth face", keywords: ["quiet", "secret"] },
  ],
  People: [
    { char: "👍", name: "thumbs up", keywords: ["+1", "approve", "yes"] },
    { char: "👎", name: "thumbs down", keywords: ["-1", "disapprove", "no"] },
    { char: "👏", name: "clapping hands", keywords: ["applause", "bravo"] },
    { char: "🙌", name: "raising hands", keywords: ["celebrate", "hooray"] },
    { char: "👋", name: "waving hand", keywords: ["hi", "bye", "hello"] },
    { char: "🤝", name: "handshake", keywords: ["deal", "agreement"] },
    {
      char: "🙏",
      name: "folded hands",
      keywords: ["please", "thanks", "pray"],
    },
    { char: "✌️", name: "victory hand", keywords: ["peace"] },
    { char: "🤞", name: "crossed fingers", keywords: ["luck", "hope"] },
    { char: "👌", name: "OK hand", keywords: ["ok", "perfect"] },
    { char: "🤙", name: "call me hand", keywords: ["shaka", "hang loose"] },
    { char: "💪", name: "flexed biceps", keywords: ["strong", "muscle"] },
    { char: "👀", name: "eyes", keywords: ["look", "watch"] },
    { char: "🧠", name: "brain", keywords: ["smart", "mind"] },
    { char: "👶", name: "baby", keywords: ["infant", "child"] },
    { char: "🧑", name: "person", keywords: ["adult"] },
    { char: "👩", name: "woman", keywords: ["female"] },
    { char: "👨", name: "man", keywords: ["male"] },
    { char: "🧑‍💻", name: "technologist", keywords: ["developer", "coder"] },
    { char: "🦸", name: "superhero", keywords: ["hero"] },
    { char: "🤷", name: "person shrugging", keywords: ["shrug", "idk"] },
    { char: "💁", name: "person tipping hand", keywords: ["info", "sassy"] },
    {
      char: "🙋",
      name: "person raising hand",
      keywords: ["question", "volunteer"],
    },
    { char: "👫", name: "woman and man holding hands", keywords: ["couple"] },
    { char: "👪", name: "family", keywords: ["parents", "kids"] },
  ],
  Animals: [
    { char: "🐶", name: "dog face", keywords: ["puppy", "pet"] },
    { char: "🐱", name: "cat face", keywords: ["kitten", "pet"] },
    { char: "🐭", name: "mouse face", keywords: ["rodent"] },
    { char: "🐹", name: "hamster", keywords: ["pet"] },
    { char: "🐰", name: "rabbit face", keywords: ["bunny"] },
    { char: "🦊", name: "fox", keywords: ["sly"] },
    { char: "🐻", name: "bear", keywords: [] },
    { char: "🐼", name: "panda", keywords: [] },
    { char: "🐨", name: "koala", keywords: [] },
    { char: "🐯", name: "tiger face", keywords: [] },
    { char: "🦁", name: "lion", keywords: [] },
    { char: "🐮", name: "cow face", keywords: [] },
    { char: "🐷", name: "pig face", keywords: [] },
    { char: "🐸", name: "frog", keywords: [] },
    { char: "🐵", name: "monkey face", keywords: [] },
    { char: "🐔", name: "chicken", keywords: [] },
    { char: "🐧", name: "penguin", keywords: [] },
    { char: "🐦", name: "bird", keywords: [] },
    { char: "🦄", name: "unicorn", keywords: ["magic"] },
    { char: "🐝", name: "honeybee", keywords: ["bee"] },
    { char: "🦋", name: "butterfly", keywords: [] },
    { char: "🐢", name: "turtle", keywords: ["tortoise"] },
    { char: "🐠", name: "tropical fish", keywords: ["fish"] },
    { char: "🐬", name: "dolphin", keywords: [] },
    { char: "🐳", name: "spouting whale", keywords: ["whale"] },
    { char: "🌸", name: "cherry blossom", keywords: ["flower", "spring"] },
    { char: "🌹", name: "rose", keywords: ["flower", "love"] },
    { char: "🌻", name: "sunflower", keywords: ["flower"] },
    { char: "🌳", name: "deciduous tree", keywords: ["tree", "nature"] },
    { char: "🌵", name: "cactus", keywords: ["plant"] },
  ],
  Food: [
    { char: "🍎", name: "red apple", keywords: ["fruit"] },
    { char: "🍌", name: "banana", keywords: ["fruit"] },
    { char: "🍇", name: "grapes", keywords: ["fruit"] },
    { char: "🍓", name: "strawberry", keywords: ["fruit"] },
    { char: "🍉", name: "watermelon", keywords: ["fruit"] },
    { char: "🍒", name: "cherries", keywords: ["fruit"] },
    { char: "🍑", name: "peach", keywords: ["fruit"] },
    { char: "🥑", name: "avocado", keywords: ["fruit"] },
    { char: "🍕", name: "pizza", keywords: ["food", "slice"] },
    { char: "🍔", name: "hamburger", keywords: ["burger", "food"] },
    { char: "🍟", name: "french fries", keywords: ["fries", "food"] },
    { char: "🌭", name: "hot dog", keywords: ["food"] },
    { char: "🌮", name: "taco", keywords: ["food", "mexican"] },
    { char: "🍣", name: "sushi", keywords: ["food", "japanese"] },
    { char: "🍜", name: "steaming bowl", keywords: ["ramen", "noodles"] },
    { char: "🍞", name: "bread", keywords: ["food"] },
    { char: "🧀", name: "cheese wedge", keywords: ["food"] },
    { char: "🍳", name: "cooking", keywords: ["egg", "breakfast"] },
    { char: "🍩", name: "doughnut", keywords: ["donut", "sweet"] },
    { char: "🍪", name: "cookie", keywords: ["sweet", "biscuit"] },
    { char: "🎂", name: "birthday cake", keywords: ["cake", "celebrate"] },
    { char: "🍰", name: "shortcake", keywords: ["cake", "sweet"] },
    { char: "🍫", name: "chocolate bar", keywords: ["sweet"] },
    { char: "🍿", name: "popcorn", keywords: ["movie", "snack"] },
    { char: "☕", name: "hot beverage", keywords: ["coffee", "tea"] },
    { char: "🍵", name: "teacup without handle", keywords: ["tea"] },
    { char: "🍺", name: "beer mug", keywords: ["drink", "beer"] },
    { char: "🍷", name: "wine glass", keywords: ["drink", "wine"] },
    { char: "🥂", name: "clinking glasses", keywords: ["cheers", "celebrate"] },
    { char: "🍦", name: "soft ice cream", keywords: ["dessert", "sweet"] },
  ],
  Activities: [
    { char: "⚽", name: "soccer ball", keywords: ["football", "sport"] },
    { char: "🏀", name: "basketball", keywords: ["sport"] },
    { char: "🏈", name: "american football", keywords: ["sport"] },
    { char: "⚾", name: "baseball", keywords: ["sport"] },
    { char: "🎾", name: "tennis", keywords: ["sport"] },
    { char: "🏐", name: "volleyball", keywords: ["sport"] },
    { char: "🎱", name: "pool 8 ball", keywords: ["billiards"] },
    { char: "🏓", name: "ping pong", keywords: ["table tennis"] },
    { char: "🏸", name: "badminton", keywords: ["sport"] },
    { char: "🥅", name: "goal net", keywords: ["sport"] },
    { char: "🏆", name: "trophy", keywords: ["win", "award"] },
    { char: "🥇", name: "first place medal", keywords: ["gold", "win"] },
    { char: "🎯", name: "bullseye", keywords: ["target", "dart"] },
    { char: "🎮", name: "video game", keywords: ["gaming", "controller"] },
    { char: "🎲", name: "game die", keywords: ["dice", "random"] },
    { char: "🎨", name: "artist palette", keywords: ["art", "paint"] },
    { char: "🎭", name: "performing arts", keywords: ["theater", "drama"] },
    { char: "🎤", name: "microphone", keywords: ["sing", "music"] },
    { char: "🎧", name: "headphone", keywords: ["music", "listen"] },
    { char: "🎸", name: "guitar", keywords: ["music", "rock"] },
    { char: "🎹", name: "musical keyboard", keywords: ["piano", "music"] },
    { char: "🎺", name: "trumpet", keywords: ["music"] },
    { char: "🥁", name: "drum", keywords: ["music"] },
    { char: "🎬", name: "clapper board", keywords: ["movie", "film"] },
    { char: "🎉", name: "party popper", keywords: ["celebrate", "tada"] },
    { char: "🎊", name: "confetti ball", keywords: ["celebrate", "party"] },
    { char: "🎁", name: "wrapped gift", keywords: ["present", "birthday"] },
    { char: "🧩", name: "puzzle piece", keywords: ["jigsaw"] },
  ],
  Travel: [
    { char: "🚗", name: "automobile", keywords: ["car"] },
    { char: "🚕", name: "taxi", keywords: ["cab"] },
    { char: "🚌", name: "bus", keywords: [] },
    { char: "🚓", name: "police car", keywords: [] },
    { char: "🚑", name: "ambulance", keywords: [] },
    { char: "🚒", name: "fire engine", keywords: [] },
    { char: "🚲", name: "bicycle", keywords: ["bike"] },
    { char: "🛵", name: "motor scooter", keywords: ["scooter"] },
    { char: "🏍️", name: "motorcycle", keywords: ["bike"] },
    { char: "✈️", name: "airplane", keywords: ["flight", "travel"] },
    { char: "🚀", name: "rocket", keywords: ["launch", "space"] },
    { char: "🚁", name: "helicopter", keywords: [] },
    { char: "⛵", name: "sailboat", keywords: ["boat"] },
    { char: "🚢", name: "ship", keywords: ["cruise"] },
    { char: "🚂", name: "locomotive", keywords: ["train"] },
    { char: "🚆", name: "train", keywords: [] },
    { char: "🗺️", name: "world map", keywords: ["travel"] },
    { char: "🏔️", name: "snow-capped mountain", keywords: ["mountain"] },
    {
      char: "🏖️",
      name: "beach with umbrella",
      keywords: ["beach", "vacation"],
    },
    { char: "🏝️", name: "desert island", keywords: ["island", "tropical"] },
    { char: "🌋", name: "volcano", keywords: [] },
    { char: "🗽", name: "Statue of Liberty", keywords: ["new york"] },
    { char: "🗼", name: "Tokyo tower", keywords: [] },
    { char: "🏰", name: "castle", keywords: [] },
    { char: "🌃", name: "night with stars", keywords: ["city", "night"] },
    { char: "🌅", name: "sunrise", keywords: ["morning"] },
    { char: "🏠", name: "house", keywords: ["home"] },
    { char: "🏢", name: "office building", keywords: ["work"] },
  ],
  Objects: [
    { char: "💻", name: "laptop", keywords: ["computer", "work"] },
    { char: "🖥️", name: "desktop computer", keywords: ["computer"] },
    { char: "⌨️", name: "keyboard", keywords: ["type"] },
    { char: "🖱️", name: "computer mouse", keywords: [] },
    { char: "📱", name: "mobile phone", keywords: ["phone", "smartphone"] },
    { char: "☎️", name: "telephone", keywords: ["phone", "call"] },
    { char: "📷", name: "camera", keywords: ["photo"] },
    { char: "🎥", name: "movie camera", keywords: ["film", "video"] },
    { char: "📺", name: "television", keywords: ["tv"] },
    { char: "🔋", name: "battery", keywords: ["power"] },
    { char: "🔌", name: "electric plug", keywords: ["power"] },
    { char: "💡", name: "light bulb", keywords: ["idea"] },
    { char: "🔦", name: "flashlight", keywords: ["torch"] },
    { char: "📚", name: "books", keywords: ["read", "study"] },
    { char: "📖", name: "open book", keywords: ["read"] },
    { char: "✏️", name: "pencil", keywords: ["write", "edit"] },
    { char: "✒️", name: "black nib", keywords: ["pen", "write"] },
    { char: "📝", name: "memo", keywords: ["note", "write"] },
    { char: "📌", name: "pushpin", keywords: ["pin", "location"] },
    { char: "📎", name: "paperclip", keywords: ["attach"] },
    { char: "🔑", name: "key", keywords: ["unlock", "password"] },
    { char: "🔒", name: "locked", keywords: ["lock", "secure"] },
    { char: "🔓", name: "unlocked", keywords: ["open"] },
    { char: "🛠️", name: "hammer and wrench", keywords: ["tools", "build"] },
    { char: "⚙️", name: "gear", keywords: ["settings", "config"] },
    { char: "💰", name: "money bag", keywords: ["cash", "rich"] },
    { char: "💳", name: "credit card", keywords: ["payment", "pay"] },
    { char: "📦", name: "package", keywords: ["box", "shipping"] },
    { char: "🔍", name: "magnifying glass", keywords: ["search", "find"] },
    { char: "⏰", name: "alarm clock", keywords: ["time", "wake"] },
  ],
  Symbols: [
    { char: "❤️", name: "red heart", keywords: ["love", "like"] },
    { char: "🧡", name: "orange heart", keywords: ["love"] },
    { char: "💛", name: "yellow heart", keywords: ["love"] },
    { char: "💚", name: "green heart", keywords: ["love"] },
    { char: "💙", name: "blue heart", keywords: ["love"] },
    { char: "💜", name: "purple heart", keywords: ["love"] },
    { char: "🖤", name: "black heart", keywords: ["love"] },
    { char: "💔", name: "broken heart", keywords: ["breakup", "sad"] },
    { char: "💯", name: "hundred points", keywords: ["100", "perfect"] },
    { char: "✅", name: "check mark button", keywords: ["done", "yes", "ok"] },
    { char: "❌", name: "cross mark", keywords: ["no", "cancel", "wrong"] },
    { char: "❓", name: "question mark", keywords: ["help", "ask"] },
    {
      char: "❗",
      name: "exclamation mark",
      keywords: ["important", "warning"],
    },
    { char: "⚠️", name: "warning", keywords: ["caution", "alert"] },
    { char: "🚫", name: "prohibited", keywords: ["no", "forbidden"] },
    { char: "⭐", name: "star", keywords: ["favorite"] },
    { char: "🌟", name: "glowing star", keywords: ["sparkle"] },
    { char: "🔥", name: "fire", keywords: ["lit", "hot", "flame"] },
    { char: "✨", name: "sparkles", keywords: ["shiny", "magic"] },
    { char: "⚡", name: "high voltage", keywords: ["lightning", "fast"] },
    { char: "💥", name: "collision", keywords: ["boom", "explosion"] },
    { char: "💢", name: "anger symbol", keywords: ["mad"] },
    { char: "💬", name: "speech balloon", keywords: ["chat", "comment"] },
    { char: "💭", name: "thought balloon", keywords: ["think"] },
    { char: "🔔", name: "bell", keywords: ["notification", "alert"] },
    { char: "➕", name: "plus", keywords: ["add"] },
    { char: "➖", name: "minus", keywords: ["subtract", "remove"] },
    { char: "♻️", name: "recycling symbol", keywords: ["recycle", "green"] },
    {
      char: "🔄",
      name: "counterclockwise arrows",
      keywords: ["refresh", "sync"],
    },
    { char: "🎵", name: "musical note", keywords: ["music", "sound"] },
  ],
  Flags: [
    { char: "🏁", name: "chequered flag", keywords: ["race", "finish"] },
    { char: "🚩", name: "triangular flag", keywords: ["flag", "marker"] },
    { char: "🏴", name: "black flag", keywords: [] },
    { char: "🏳️", name: "white flag", keywords: ["surrender"] },
    { char: "🏳️‍🌈", name: "rainbow flag", keywords: ["pride", "lgbt"] },
    { char: "🇺🇸", name: "flag United States", keywords: ["usa", "america"] },
    { char: "🇬🇧", name: "flag United Kingdom", keywords: ["uk", "britain"] },
    { char: "🇨🇦", name: "flag Canada", keywords: [] },
    { char: "🇮🇳", name: "flag India", keywords: [] },
    { char: "🇩🇪", name: "flag Germany", keywords: [] },
    { char: "🇫🇷", name: "flag France", keywords: [] },
    { char: "🇯🇵", name: "flag Japan", keywords: [] },
    { char: "🇧🇷", name: "flag Brazil", keywords: [] },
    { char: "🇦🇺", name: "flag Australia", keywords: [] },
    { char: "🇪🇸", name: "flag Spain", keywords: [] },
    { char: "🇮🇹", name: "flag Italy", keywords: [] },
  ],
};

/** The category order used for rendering and tab navigation. */
const CATEGORY_ORDER = Object.keys(EMOJI) as EmojiCategory[];

/** Columns in the emoji grid — matches the `grid-cols-7` class on `[data-slot="emoji-picker-grid"]`
 * category groups below. Kept as a constant (not derived from the class string) since arrow-key
 * math needs the number, not the Tailwind utility. */
const GRID_COLUMNS = 7;

/** Normalize an emoji entry to its searchable haystack (name + keywords), lowercased. */
function matchesQuery(entry: EmojiEntry, query: string): boolean {
  if (entry.name.toLowerCase().includes(query)) return true;
  return (
    entry.keywords?.some((kw) => kw.toLowerCase().includes(query)) ?? false
  );
}

export interface EmojiPickerProps {
  /**
   * Called with the selected emoji character when the user picks one. The popover closes after
   * selection (unless `closeOnSelect` is `false`).
   */
  onValueChange: (emoji: string) => void;
  /**
   * Custom button-like trigger element (composed via Base UI `render`). Defaults to a ghost
   * `SmilePlus` icon button.
   */
  trigger?: React.ReactElement<React.ComponentPropsWithoutRef<"button">>;
  /**
   * `aria-label` for the default trigger button.
   * @default "Pick an emoji"
   */
  triggerLabel?: string;
  /**
   * Placeholder for the search input.
   * @default "Search emoji"
   */
  searchPlaceholder?: string;
  /**
   * Controlled open state of the popover. Omit for uncontrolled usage.
   */
  open?: boolean;
  /**
   * Called when the popover's open state changes (controlled or uncontrolled).
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Close the popover automatically after an emoji is selected.
   * @default true
   */
  closeOnSelect?: boolean;
  /**
   * Which side of the trigger to place the panel on.
   * @default "bottom"
   */
  side?: React.ComponentProps<typeof PopoverContent>["side"];
  /**
   * Alignment of the panel relative to the trigger.
   * @default "start"
   */
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  /** Extra classes for the popover panel. */
  className?: string;
  /**
   * Ref forwarded to the trigger button — the component's focusable root (the popover panel is
   * portaled, so the trigger is the stable host element to focus/measure).
   */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * `EmojiPicker` — a popover with a searchable, category-grouped grid of emoji that returns the
 * selected character via `onValueChange`. Built on our `Popover` + a search `Input` + a scrollable grid
 * of icon `Button`s, with a curated embedded emoji dataset (`EMOJI`) so it ships zero extra
 * dependencies. Each emoji button is keyboard-focusable and has an `aria-label`.
 *
 * **Keyboard:** the grid uses a roving tabindex (WAI-ARIA grid pattern) spanning every visible
 * emoji across every category — category headings are visual grouping only, not separate keyboard
 * regions. Only one emoji is ever Tab-reachable at a time. `ArrowLeft`/`ArrowRight` move one emoji;
 * `ArrowUp`/`ArrowDown` move by the grid's column count (7); `Home`/`End` jump to the first/last
 * emoji in the whole (filtered) grid. Click selection is unchanged.
 *
 * @example
 * <EmojiPicker onValueChange={(emoji) => insert(emoji)} />
 */
export function EmojiPicker({
  onValueChange,
  trigger,
  triggerLabel = "Pick an emoji",
  searchPlaceholder = "Search emoji",
  open,
  onOpenChange,
  closeOnSelect = true,
  side = "bottom",
  align = "start",
  className,
  ref,
}: EmojiPickerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const [query, setQuery] = React.useState("");

  // Reset the search when the popover closes so it reopens clean.
  React.useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  // Build the (optionally filtered) category → entries map for the current query.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_ORDER.map((category) => {
      const entries = q
        ? EMOJI[category].filter((e) => matchesQuery(e, q))
        : EMOJI[category];
      return { category, entries };
    }).filter((group) => group.entries.length > 0);
  }, [query]);

  const hasResults = filtered.length > 0;
  const resultCount = filtered.reduce(
    (count, group) => count + group.entries.length,
    0,
  );
  const statusMessage = hasResults
    ? `${resultCount} emoji ${resultCount === 1 ? "result" : "results"} available.`
    : "No emoji found.";

  const handleSelect = React.useCallback(
    (emoji: string) => {
      onValueChange(emoji);
      if (closeOnSelect) setOpen(false);
    },
    [onValueChange, closeOnSelect, setOpen],
  );

  // Roving tabindex across the WHOLE grid (every visible emoji button across every category),
  // treated as one continuous `GRID_COLUMNS`-wide grid — the category headings are visual grouping
  // only, not separate keyboard regions. Exactly one button is Tab-reachable (`tabIndex 0`) at a
  // time; the rest are `-1`. Flattening lets ArrowDown/ArrowUp move a full row even across a
  // category boundary, matching how a single searchable list would behave.
  const flatEntries = React.useMemo(
    () => filtered.flatMap((group) => group.entries),
    [filtered],
  );
  const [activeIndex, setActiveIndex] = React.useState(0);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Re-clamp the active index whenever the visible set changes (search narrows/widens it, or the
  // popover reopens) so it never points past the end of the list.
  React.useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(flatEntries.length - 1, 0)));
  }, [flatEntries.length]);

  const focusItem = React.useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, flatEntries.length - 1));
      setActiveIndex(clamped);
      itemRefs.current[clamped]?.focus();
    },
    [flatEntries.length],
  );

  // Home/End jump to the first/last emoji in the ENTIRE grid (all categories), not just the
  // current row — with a scrollable multi-category grid, "jump to the very first/last result"
  // reads as more useful than a row-local Home/End. Note this as the deliberate choice (a
  // row-relative variant would need each row's start/end offset, which isn't needed here).
  const handleGridKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (flatEntries.length === 0) return;
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          focusItem(activeIndex + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusItem(activeIndex - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          focusItem(activeIndex + GRID_COLUMNS);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusItem(activeIndex - GRID_COLUMNS);
          break;
        case "Home":
          event.preventDefault();
          focusItem(0);
          break;
        case "End":
          event.preventDefault();
          focusItem(flatEntries.length - 1);
          break;
        default:
          break;
      }
    },
    [activeIndex, flatEntries.length, focusItem],
  );

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        render={
          trigger ?? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={triggerLabel}
            >
              <SmilePlus />
            </Button>
          )
        }
      />
      <PopoverContent
        data-slot="emoji-picker"
        side={side}
        align={align}
        sideOffset={FLOATING.sideOffsetAttached}
        className={cn("w-72 max-w-[calc(100vw-var(--spacing)*8)] p-0", className)}
      >
        <div className="flex flex-col">
          {/* Search */}
          <div className="border-b border-border p-2">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              data-slot="emoji-picker-search"
            />
          </div>
          <div
            data-slot="emoji-picker-status"
            role="status"
            aria-live="polite"
            className="sr-only"
          >
            {statusMessage}
          </div>

          {/* Scrollable grid */}
          <div
            data-slot="emoji-picker-grid"
            onKeyDown={handleGridKeyDown}
            className="max-h-64 overflow-y-auto overscroll-contain p-2"
          >
            {hasResults ? (
              (() => {
                // `flatIndex` runs across every category's entries so the roving tabindex spans
                // the whole grid (see `flatEntries`/`handleGridKeyDown` above).
                let flatIndex = -1;
                return filtered.map(({ category, entries }) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-1 py-1 text-label-sm text-muted-foreground">
                      {category}
                    </div>
                    <div
                      role="group"
                      aria-label={category}
                      // `justify-items-center` centers each fixed 32px button inside its
                      // (wider) grid track so leftover track space splits evenly — otherwise
                      // the buttons pack left and the horizontal gutters read uneven vs the
                      // 2px vertical gap.
                      className="grid grid-cols-7 justify-items-center gap-0.5"
                    >
                      {entries.map((entry) => {
                        flatIndex += 1;
                        const index = flatIndex;
                        const isActive = index === activeIndex;
                        return (
                          <button
                            key={entry.char}
                            ref={(node) => {
                              itemRefs.current[index] = node;
                            }}
                            type="button"
                            data-slot="emoji-picker-item"
                            aria-label={entry.name}
                            title={entry.name}
                            // Roving tabindex: only the active emoji is Tab-reachable.
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => {
                              setActiveIndex(index);
                              handleSelect(entry.char);
                            }}
                            onFocus={() => setActiveIndex(index)}
                            className={cn(
                              "flex size-(--size-md) items-center justify-center rounded-md text-xl leading-none transition-colors duration-fast ease-standard",
                              "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
                            )}
                          >
                            <span aria-hidden>{entry.char}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()
            ) : (
              <div
                data-slot="emoji-picker-empty"
                aria-hidden="true"
                className="py-6 text-center text-base text-muted-foreground"
              >
                No emoji found.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
