// @vegastack emoji-data@0.23.40 sha256-njI8jY0fNcTvMPnQBNiwTbW3yYbwpzF9pKsyCDU7Xsg=

/* ------------------------------------------------------------------------------------------------
 * emoji-data — the curated emoji set behind `EmojiPicker` and `Reactions`, plus two lookups. Pure
 * data with no React in it: `EmojiPicker` loads it with a dynamic `import()` the first time it
 * opens, so the page that only renders a trigger or a reaction pill never ships the table.
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
 * `EMOJI` — the curated emoji dataset: a few hundred of the most common emoji grouped by category.
 * NOT the full Unicode set. `EmojiPicker` imports this module lazily, on first open, so it never
 * weighs on the page that renders the trigger.
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

/** The category order used for rendering and the category bar. */
export const EMOJI_CATEGORIES = Object.keys(EMOJI) as EmojiCategory[];

let byChar: Map<string, EmojiEntry> | undefined;

/** Look up an emoji's entry by its character; `undefined` when it is not in the set. */
export function getEmoji(char: string): EmojiEntry | undefined {
  byChar ??= new Map(
    EMOJI_CATEGORIES.flatMap((c) => EMOJI[c].map((e) => [e.char, e] as const)),
  );
  return byChar.get(char);
}

/** Does `entry` match a lowercased `query` by name or keyword? */
export function matchesEmoji(entry: EmojiEntry, query: string): boolean {
  if (entry.name.toLowerCase().includes(query)) return true;
  return (
    entry.keywords?.some((kw) => kw.toLowerCase().includes(query)) ?? false
  );
}
