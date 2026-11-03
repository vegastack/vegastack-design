// @vegastack person-avatar@0.36.0 sha256-+wMB2Bae4gNauCsbiNzGdVoasJZRsJLMu/+msYvYjvM=

"use client";

import * as React from "react";
import { Bot, UsersRound } from "lucide-react";
import { cn } from "@vegastack/design";
import { Avatar, AvatarFallback, type AvatarHue } from "@/components/ui/avatar";

/* ------------------------------------------------------------------------------------------------
 * PersonAvatar — the ONE way a person is drawn as an avatar: their photo, else their initials on
 * their own colour (`hue`, API-32), else initials on the muted fallback. Every people surface
 * (PersonHoverCard, RecordChip, BoardCard, Inbox, Comments, RecordAside, SearchableSelect's person
 * rows, AvatarPicker) composes it, so a person reads the same everywhere. Initials follow the one
 * rule in `personInitials`, exported here for anything else that shows a person's initials.
 * A team (`kind: "team"`) is drawn as a rounded-square tile with the team icon on its hue — never
 * initials — so a team reads as a group wherever people and teams are listed together.
 * A workspace (`kind: "workspace"`) is a rounded-square tile too: its logo contained whole on a
 * plain tile (a company logo is never cropped into a circle), else its initials on its hue.
 * An agent (`kind: "agent"`) — an AI assistant working for a member — is a soft hexagon, the shape
 * only agents take: its mark (a provider's logo, passed by the app) else a bot on its hue (purple
 * by default), and `PersonName` writes its name agent-first as "Claude Code for Manoj" (the hexagon
 * already says it is an agent, so no label by default), so an agent reads the same in every avatar,
 * stack, picker, feed and comment.
 * ----------------------------------------------------------------------------------------------*/

/**
 * The ring that separates overlapping avatars in a stack: the colour of the surface the stack sits
 * on — a card, a popover, dialog or sheet, else the page — so it reads as a gap, never a halo.
 */
export const PERSON_AVATAR_STACK_RING =
  "ring-2 ring-background in-data-[slot=dialog-content]:ring-popover in-data-[slot=sheet-content]:ring-popover in-data-[slot=popover-content]:ring-popover in-data-[slot=hover-card-content]:ring-popover in-data-[slot=card]:ring-card";

/**
 * Initials that fit their circle: the second letter drops out under 18px and the type steps down
 * under 24px, read from the fallback's own width (`@container/initials`), and in a stack, where
 * the next avatar covers the circle's edge.
 */
function PersonInitials({ value }: { value: string }) {
  const [first = "", ...rest] = Array.from(value);
  return (
    <span className="in-data-[slot=avatar-group]:text-[83.333%] in-data-[slot=people-picker-avatars]:text-[83.333%] @max-[23.5px]/initials:text-[83.333%] @max-[17.5px]/initials:text-[75%]">
      {first}
      {rest.length ? (
        <span className="@max-[17.5px]/initials:hidden">{rest.join("")}</span>
      ) : null}
    </span>
  );
}

/** The first `n` characters of a string, by code point, so an emoji or accent is never split. */
function head(value: string, n: number): string {
  return Array.from(value).slice(0, n).join("");
}

/**
 * `personInitials` — the one initials rule for a person, on the trimmed name: the first letters of
 * the first and last words ("Asha K Rao" → "AR"); one word → its first two letters ("Asha" → "AS");
 * no name → the email's first two characters; punctuation is skipped; always uppercase.
 *
 * @example
 * personInitials("Asha Rao"); // "AR"
 * personInitials("", "ops@acme.com"); // "OP"
 */
export function personInitials(name: string, email?: string | null): string {
  // Letters and digits only: "D. Rao" → "DR", "Farid (contractor)" → "FC", never "D." or "F(".
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (words.length === 0) return head((email ?? "").trim(), 2).toUpperCase();
  if (words.length === 1) return head(words[0]!, 2).toUpperCase();
  return (head(words[0]!, 1) + head(words.at(-1)!, 1)).toUpperCase();
}

/** A person shown by `PersonAvatar`, `PersonCard`, `PersonHoverCard` and `AvatarStack`. */
export interface Person {
  /**
   * Your stable id for them (a member's id, an agent's connection), never shown — what a
   * `PersonHoverCardProvider` looks them up by. @default undefined
   */
  id?: string | null;
  /** The name shown, and the avatar's initials. */
  name: string;
  /** The muted line under the name, and the initials when there is no name; omit for someone without an account. @default undefined */
  email?: string | null;
  /** The avatar image — for an agent, its mark (shown inset) unless `mark` is set. @default undefined */
  image?: string | null;
  /**
   * An agent's mark inside its hexagon: an image (`{ src, alt, fit, tile }`, such as a provider's
   * favicon) or a node. Only agents draw it. @default undefined
   */
  mark?: PersonMark;
  /** The person's colour behind their initials — one of the ten tag hues; none is the muted fallback. @default undefined */
  hue?: AvatarHue | null;
  /** A status after the name, such as "Inactive" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
  /**
   * A person, a team of people (a rounded-square tile with the team icon on its hue), a workspace
   * (a rounded-square tile with its whole logo, else its initials), or an agent working for a member
   * (a soft hexagon with its mark, else a bot on its hue; named "Claude Code for Manoj").
   * @default "person"
   */
  kind?: PersonKind;
  /** An agent's owner — the member it works for: "Claude Code" for "Manoj". @default undefined */
  via?: string | null;
}

/** What a `Person` is: a person, a team of people, a workspace, or an agent working for a member. */
export type PersonKind = "person" | "team" | "workspace" | "agent";

/**
 * `personDisplayName` — a person's name as plain text: an agent reads "Claude Code (for Manoj)",
 * anyone else their name. For a toast, a title or a menu label; in a row, use `PersonName`.
 *
 * @example
 * personDisplayName({ name: "Claude Code", kind: "agent", via: "Manoj" }); // "Claude Code (for Manoj)"
 */
export function personDisplayName(
  person: Pick<Person, "name" | "kind" | "via">,
): string {
  return person.kind === "agent" && person.via
    ? `${person.name} (for ${person.via})`
    : person.name;
}

/**
 * `personAccessibleName` — what a screen reader hears for a person: an agent is "Claude Code for
 * Manoj, agent" (or "Claude Code, agent") — the visible name first, so speech input matches it
 * (WCAG 2.5.3), and "agent" is never carried by colour alone.
 *
 * @example
 * personAccessibleName({ name: "Claude Code", kind: "agent", via: "Manoj" }); // "Claude Code for Manoj, agent"
 */
export function personAccessibleName(
  person: Pick<Person, "name" | "kind" | "via">,
): string {
  if (person.kind !== "agent") return person.name;
  return person.via
    ? `${person.name} for ${person.via}, agent`
    : `${person.name}, agent`;
}

/**
 * The avatar's size steps: `2xs` 16px and `xs` 20px for rows, chips and meta lines; `sm` 24px,
 * `default` 32px and `lg` 40px (Avatar's own tiers); `xl` 64px for a profile or an agent's header.
 * The initials, the icon and an agent's mark scale with the step, so a caller never resizes an
 * avatar with a `className`.
 */
export type PersonAvatarSize = "2xs" | "xs" | "sm" | "default" | "lg" | "xl";

/**
 * Per step: the box (Avatar's own tiers set none), the icon (about 60% of the shape), an inset
 * mark, the initials and the corner indicator. The two row steps show one initial instead of two,
 * which `PersonInitials` sizes to the circle; `xl` lifts the initials to `text-lg`.
 */
const STEP: Record<
  PersonAvatarSize,
  {
    box: string;
    icon: string;
    mark: string;
    initials: string;
    /** Show one initial, not two: two letters crowd a 16 or 20px circle's edge. */
    oneInitial?: boolean;
    indicator: string;
    /** The rounded square of a team or workspace: tighter at the row steps, so it never reads as a circle. */
    square: string;
  }
> = {
  "2xs": {
    box: "size-4",
    icon: "size-2.5",
    mark: "size-2.5",
    initials: "",
    oneInitial: true,
    indicator: "size-1.5",
    square: "rounded-sm after:rounded-sm",
  },
  xs: {
    box: "size-5",
    icon: "size-3",
    mark: "size-3",
    initials: "",
    oneInitial: true,
    indicator: "size-2",
    square: "rounded-sm after:rounded-sm",
  },
  sm: {
    box: "",
    icon: "size-3.5",
    mark: "size-3.5",
    initials: "",
    indicator: "size-2",
    square: "rounded-md after:rounded-md",
  },
  default: {
    box: "",
    icon: "size-4.5",
    mark: "size-4.5",
    initials: "",
    indicator: "size-2.5",
    square: "rounded-md after:rounded-md",
  },
  lg: {
    box: "",
    icon: "size-6",
    mark: "size-5.5",
    initials: "",
    indicator: "size-3",
    square: "rounded-md after:rounded-md",
  },
  xl: {
    box: "size-16",
    icon: "size-9",
    mark: "size-9",
    initials: "text-lg",
    indicator: "size-4",
    square: "rounded-xl after:rounded-xl",
  },
};

/** The sizes Avatar draws itself; the other steps ride on `default` with their own box. */
const AVATAR_TIER = { sm: "sm", default: "default", lg: "lg" } as const;

/**
 * The agent shape: a soft hexagon, pointy at the top and bottom, a little taller than it is wide
 * (circles are people; rounded squares are teams and workspaces). One path in a 100×100 box,
 * scaled to the avatar, so the corner rounding scales with the size. Painted as a CSS mask (every
 * evergreen browser), so the box — and the layout — is the same as a circle's.
 */
const AGENT_SHAPE_PATH =
  "M39.88 2.9C46.15-.97 53.85-.97 60.12 2.9L86.63 19.23C92.44 22.81 96 29.18 96 36V64C96 70.82 92.44 77.19 86.63 80.77L60.12 97.1C53.85 100.97 46.15 100.97 39.88 97.1L13.37 80.77C7.56 77.19 4 70.82 4 64V36C4 29.18 7.56 22.81 13.37 19.23Z";

/**
 * `agentShapeStyle` — the agent hexagon as the `--person-avatar-shape` custom property. Spread it
 * on anything that should take the agent's shape (a hover or focus target around its avatar), with
 * `agentShapeMask` in its classes.
 *
 * @example <Button style={agentShapeStyle} className={agentShapeMask} …><PersonAvatar person={agent} /></Button>
 */
export const agentShapeStyle = {
  "--person-avatar-shape": `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${AGENT_SHAPE_PATH}"/></svg>`,
  )}")`,
} as React.CSSProperties;

/**
 * `agentShapeMask` — the classes that mask an element to the agent hexagon (with `agentShapeStyle`
 * on it or an ancestor), so a hover fill or focus tint follows the hexagon, never a circle.
 *
 * @example <span style={agentShapeStyle} className={cn("bg-state-hover", agentShapeMask)} />
 */
export const agentShapeMask =
  "[mask:var(--person-avatar-shape)_center/100%_100%_no-repeat]";
const AGENT_SHAPE_MASK = agentShapeMask;

/**
 * The agent root: no circle; the hairline is the shape's own 1px edge (the shape minus the shape
 * inset by 1px), in the same border ink and blend as a person's; and in a group — or inside an
 * `AgentStateRing` — a 2px halo in the shape, which replaces the circular ring a stack gives each
 * avatar (a circle around a hexagon would notch its neighbour).
 */
const AGENT_ROOT = cn(
  "rounded-none after:rounded-none after:border-0 after:bg-border",
  // Longhands: the `mask` shorthand resets `mask-composite`, which would fill the whole shape.
  "after:[mask-image:var(--person-avatar-shape),var(--person-avatar-shape)] after:[mask-size:100%_100%,calc(100%-var(--spacing)*0.5)_calc(100%-var(--spacing)*0.5)] after:[mask-position:center] after:[mask-repeat:no-repeat] after:[mask-composite:exclude]",
  "before:absolute before:-inset-0.5 before:bg-(--person-avatar-halo) before:[mask:var(--person-avatar-shape)_center/100%_100%_no-repeat]",
  // The halo takes the colour of the surface beneath, as `PERSON_AVATAR_STACK_RING` does.
  "in-data-[slot=avatar-group]:[--person-avatar-halo:var(--color-background)] in-data-[slot=avatar-group]:in-data-[slot=card]:[--person-avatar-halo:var(--color-card)] in-data-[slot=avatar-group]:in-data-[slot=popover-content]:[--person-avatar-halo:var(--color-popover)] in-data-[slot=avatar-group]:in-data-[slot=hover-card-content]:[--person-avatar-halo:var(--color-popover)] in-data-[slot=avatar-group]:in-data-[slot=dialog-content]:[--person-avatar-halo:var(--color-popover)] in-data-[slot=avatar-group]:in-data-[slot=sheet-content]:[--person-avatar-halo:var(--color-popover)]",
  "data-[kind=agent]:[[data-slot=avatar-group]_&]:ring-0",
);

/** An agent's mark: an image (a provider's favicon or logo) or a node (an icon, an SVG logo). */
export type PersonMark =
  | React.ReactNode
  | {
      /** The mark's image URL. */
      src: string;
      /** Its text alternative; leave it empty when the agent's name is shown beside it. @default "" */
      alt?: string;
      /**
       * `inset`: the mark sits inside the shape with room around it, on a neutral tile (a logo on
       * a transparent background). `fill`: the mark covers the whole shape (a full-bleed mark).
       * @default "inset"
       */
      fit?: "inset" | "fill";
      /**
       * The tile behind an inset mark: `neutral` follows the theme; `light` stays light in both
       * themes, for a dark-ink logo that would vanish on a dark tile.
       * @default "neutral"
       */
      tile?: "neutral" | "light";
    };

type MarkImage = Extract<PersonMark, { src: string }>;

function isMarkImage(mark: PersonMark): mark is MarkImage {
  return (
    typeof mark === "object" &&
    mark !== null &&
    !React.isValidElement(mark) &&
    "src" in mark &&
    typeof (mark as MarkImage).src === "string"
  );
}

/** Props for `PersonAvatar`. */
export interface PersonAvatarProps extends Omit<
  React.ComponentProps<typeof Avatar>,
  "children" | "size"
> {
  /** The person. */
  person: Pick<Person, "name" | "email" | "image" | "hue" | "kind" | "mark">;
  /**
   * The size step: `2xs` 16px, `xs` 20px, `sm` 24px, `default` 32px, `lg` 40px, `xl` 64px.
   * Initials, icons and marks scale with it — never resize an avatar with a `className`.
   * @default "sm"
   */
  size?: PersonAvatarSize;
  /** Draw a person, a team, a workspace or an agent; overrides `person.kind`. @default person.kind ?? "person" */
  kind?: PersonKind;
  /**
   * An agent's mark inside its shape, overriding `person.mark`: an image (`{ src, alt, fit, tile }`)
   * or a node. An image that fails to load falls back to the agent's icon or initials. Ignored
   * for anyone who is not an agent.
   * @default person.mark
   */
  mark?: PersonMark;
  /**
   * What an agent with no mark shows: the bot icon, or its initials. @default "icon"
   */
  agentFallback?: "icon" | "initials";
  /**
   * A small indicator at the bottom-end corner — a presence dot or a state icon — sized to the
   * step, with a background-coloured gap. Decorative: say what it means in text too.
   * @default undefined
   */
  indicator?: React.ReactNode;
}

/**
 * `PersonAvatar` — a person's avatar: the image, else their initials on their hue.
 *
 * The photo is a plain `<img>` in the server HTML, layered over the initials, so the browser starts
 * fetching it from the markup and paints it the moment it decodes — a cached photo shows on first
 * paint, with no flash of initials and no wait for hydration. (Base UI's `AvatarImage` renders its
 * `<img>` only after a JS loader reports it loaded, which is what made every photo start as
 * initials.) The initials stay underneath until the photo has loaded, and come back if it fails.
 *
 * A team (`kind="team"`, or `person.kind`) is a rounded-square tile with the `UsersRound` icon on
 * its hue, and no photo or initials. A workspace (`kind="workspace"`) is the same rounded square
 * with its logo scaled to fit whole (`object-contain`) on the plain background, else its initials
 * on its hue — for workspace switchers and headers. An agent (`kind="agent"`) is a soft hexagon —
 * the shape only agents take, so an agent never passes for a person: its mark (a provider's
 * logo, inset on a neutral tile or full-bleed), else the `Bot` icon (or its initials) on its hue,
 * purple by default.
 *
 * @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} />
 * @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} size="2xs" />
 * @example <PersonAvatar person={{ name: "Sales", kind: "team", hue: "green" }} />
 * @example <PersonAvatar person={{ name: "Acme Lighting", kind: "workspace", image: logoUrl }} />
 * @example <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
 * @example <PersonAvatar person={{ name: "Claude Code", kind: "agent", mark: { src: faviconUrl } }} size="xs" />
 * @example <PersonAvatar person={agent} indicator={<AgentStateIcon state="working" />} />
 */
export function PersonAvatar({
  person,
  size = "sm",
  kind,
  mark: markProp,
  agentFallback = "icon",
  indicator,
  className,
  style,
  ...props
}: PersonAvatarProps) {
  const resolvedKind = kind ?? person.kind ?? "person";
  const team = resolvedKind === "team";
  const agent = resolvedKind === "agent";
  const workspace = resolvedKind === "workspace";
  const step = STEP[size];
  const allInitials = personInitials(person.name, person.email);
  const initials = step.oneInitial
    ? Array.from(allInitials).slice(0, 1).join("")
    : allInitials;
  const tier =
    size in AVATAR_TIER
      ? AVATAR_TIER[size as keyof typeof AVATAR_TIER]
      : "default";

  // An agent's image is its mark; anyone else's is their photo or logo.
  const rawMark = agent
    ? (markProp ??
      person.mark ??
      (person.image ? { src: person.image } : undefined))
    : undefined;
  const markImage =
    rawMark != null && isMarkImage(rawMark) ? rawMark : undefined;
  const markNode =
    rawMark != null && rawMark !== false && !markImage
      ? (rawMark as React.ReactNode)
      : undefined;
  const src = team
    ? undefined
    : agent
      ? markImage?.src || undefined
      : person.image || undefined;

  // Keyed by `src`, so a new photo starts over: a failure or a load of the old one never sticks.
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // The photo may have loaded, or failed, before hydration attached `onLoad`/`onError` — read the
  // element's own state once it is in the tree.
  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (!src || !img || !img.complete) return;
    if (img.naturalWidth > 0) setLoaded(src);
    else if (img.currentSrc) setFailed(src);
  }, [src]);

  const showImage = src !== undefined && failed !== src;
  const imageLoaded = showImage && loaded === src;

  const indicatorNode =
    indicator != null && indicator !== false ? (
      <span
        data-slot="person-avatar-indicator"
        className={cn(
          "absolute end-0 bottom-0 z-10 inline-flex items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-background [&>svg]:size-full",
          // The hexagon's lower edge crosses the diagonal about 6% further in than a circle's,
          // so the indicator moves in with it and sits on the shape, not beside it.
          agent && "end-[6%] bottom-[6%]",
          step.indicator,
        )}
      >
        {indicator}
      </span>
    ) : null;

  const rootProps = {
    size: tier,
    // The step, not Avatar's tier, so `data-size` always names what is drawn.
    "data-size": size,
    ...props,
  } as React.ComponentProps<typeof Avatar>;

  if (team) {
    return (
      <Avatar
        {...rootProps}
        data-kind="team"
        style={style}
        className={cn(step.square, step.box, className)}
      >
        <AvatarFallback
          hue={person.hue ?? undefined}
          className="rounded-[inherit]"
        >
          <UsersRound aria-hidden className={step.icon} />
        </AvatarFallback>
        {indicatorNode}
      </Avatar>
    );
  }

  if (agent) {
    const fit = markImage?.fit ?? "inset";
    const tile = markImage?.tile ?? "neutral";
    // A node mark on an agent with a hue is drawn in the hue's ink on its tile (a workspace's own
    // assistant icon); without a hue it sits on the neutral tile like a logo.
    const hueMark = markNode !== undefined && person.hue != null;
    const tileMark = markNode !== undefined && !hueMark;
    const markShown = tileMark || imageLoaded;
    return (
      <Avatar
        {...rootProps}
        data-kind="agent"
        style={{ ...agentShapeStyle, ...style }}
        // The agent's own classes come after the caller's, so a stack's circular ring never draws
        // around a hexagon.
        className={cn(step.box, className, AGENT_ROOT, "ring-0")}
      >
        {markShown ? null : (
          <AvatarFallback
            hue={person.hue ?? "purple"}
            className={cn(
              "@container/initials relative rounded-none",
              AGENT_SHAPE_MASK,
              agentFallback === "initials" && step.initials,
            )}
          >
            {hueMark ? (
              <span
                aria-hidden
                className={cn(
                  "flex items-center justify-center [&>img]:size-full [&>svg]:size-full",
                  step.icon,
                )}
              >
                {markNode}
              </span>
            ) : agentFallback === "initials" ? (
              <PersonInitials value={initials} />
            ) : (
              <Bot aria-hidden className={step.icon} />
            )}
          </AvatarFallback>
        )}
        {tileMark || showImage ? (
          <span
            data-slot="person-avatar-mark"
            data-fit={markImage ? fit : "inset"}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              AGENT_SHAPE_MASK,
              fit === "fill" && markImage
                ? undefined
                : tile === "light"
                  ? "bg-white"
                  : // A step above the page in dark, where `background` would read as a hole.
                    "bg-background dark:bg-muted",
              // Held back until the image has decoded, so a slow mark never shows an empty tile.
              markShown ? undefined : "invisible",
            )}
          >
            {markImage ? (
              <img
                ref={imgRef}
                src={src}
                alt={markImage.alt ?? ""}
                decoding="async"
                onLoad={() => setLoaded(src ?? null)}
                onError={() => setFailed(src ?? null)}
                className={
                  fit === "fill"
                    ? "size-full object-cover"
                    : cn("object-contain", step.mark)
                }
              />
            ) : (
              <span
                aria-hidden
                className={cn(
                  "flex items-center justify-center [&>img]:size-full [&>svg]:size-full",
                  step.mark,
                )}
              >
                {markNode}
              </span>
            )}
          </span>
        ) : null}
        {indicatorNode}
      </Avatar>
    );
  }

  return (
    <Avatar
      {...rootProps}
      data-kind={workspace ? "workspace" : undefined}
      style={style}
      className={cn(workspace && step.square, step.box, className)}
    >
      {imageLoaded ? null : (
        <AvatarFallback
          hue={person.hue ?? undefined}
          // The fallback is the size container, so the initials fit whatever size the avatar is
          // drawn at, even when a caller still shrinks it with a class.
          className={cn(
            "@container/initials",
            workspace && "rounded-[inherit]",
            step.initials,
          )}
        >
          <PersonInitials value={initials} />
        </AvatarFallback>
      )}
      {showImage ? (
        <img
          ref={imgRef}
          data-slot="avatar-image"
          src={src}
          alt=""
          decoding="async"
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          // Over the initials (the root is `relative` and sized), so nothing shifts when it lands.
          className={cn(
            "absolute inset-0 aspect-square size-full",
            // A workspace's logo is shown whole on a plain tile; a photo fills the circle.
            workspace
              ? "rounded-[inherit] bg-background object-contain p-px"
              : "rounded-full object-cover",
          )}
        />
      ) : null}
      {indicatorNode}
    </Avatar>
  );
}

/**
 * `PersonAgentLabel` — the small purple "Agent" label after an agent's name. `PersonName` draws it;
 * use it alone where the name sits in a truncating trigger and the label must stay whole.
 *
 * @example <PersonHoverCard person={agent} trigger="name"><PersonName person={agent} agentLabel={false} /></PersonHoverCard> <PersonAgentLabel />
 */
export function PersonAgentLabel({
  className,
  children = "Agent",
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="person-agent-label"
      className={cn(
        "shrink-0 rounded-sm bg-tag-purple-subtle px-1 text-xs font-medium whitespace-nowrap text-tag-purple-text",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Props for `PersonName`. */
export interface PersonNameProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The person; an agent (`kind: "agent"`) reads with "for" its `via`. */
  person: Pick<Person, "name" | "kind" | "via">;
  /**
   * Add the purple "Agent" label after an agent's name — for a surface that names agents without
   * their hexagon (a hover card's heading, a profile). @default false
   */
  agentLabel?: boolean;
}

/**
 * `PersonName` — a person's name as every surface writes it. A person or a team is their name; an
 * agent is its name and a muted "for Manoj" (its hexagon says it is an agent; `agentLabel` adds
 * the purple label where no avatar shows), and a screen reader hears "Claude Code for Manoj, agent". Inline, so it sits in a sentence, a hover-card trigger or a
 * truncating row.
 *
 * @example <PersonName person={{ name: "Claude Code", kind: "agent", via: "Manoj" }} />
 */
export function PersonName({
  person,
  agentLabel = false,
  className,
  ...props
}: PersonNameProps) {
  if (person.kind !== "agent") {
    return (
      <span data-slot="person-name" className={className} {...props}>
        {person.name}
      </span>
    );
  }
  return (
    <span
      data-slot="person-name"
      data-kind="agent"
      className={className}
      {...props}
    >
      <span aria-hidden>
        {person.name}
        {person.via ? (
          <span
            data-slot="person-name-via"
            className="font-normal text-muted-foreground"
          >
            {" "}
            for {person.via}
          </span>
        ) : null}
        {agentLabel ? (
          <>
            {" "}
            <PersonAgentLabel />
          </>
        ) : null}
      </span>
      <span className="sr-only">{personAccessibleName(person)}</span>
    </span>
  );
}
