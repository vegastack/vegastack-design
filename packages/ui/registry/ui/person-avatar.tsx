// @vegastack person-avatar@0.138.0 sha256-sQPTRbtBYP7kldnv3Cvllp1MVbDW/nhoLkNMHsppJGc=

"use client";

import * as React from "react";
import { UsersRound } from "lucide-react";
import { cn } from "@vegastack/design";
import { Avatar, AvatarFallback, type AvatarHue } from "@/components/ui/avatar";
import type { AgentFaceSpec, FaceState } from "@/components/ui/agent-face";

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
 * An agent (`kind: "agent"`) — an AI assistant working for a member — is its face (`AgentFace`,
 * operator 27-11-2026: "agent avatars are no longer hexagones"): a preset character in its palette,
 * the Pebble from 40px and the Mini below, showing what it is doing. `PersonName` writes its name
 * agent-first as "Claude Code for Manoj" (the face already says it is an agent, so no label by
 * default), so an agent reads the same in every avatar, stack, picker, feed and comment.
 * ----------------------------------------------------------------------------------------------*/

/**
 * The ring that separates overlapping avatars in a stack: the colour of the surface the stack sits
 * on — a card, a popover, dialog or sheet, else the page — so it reads as a gap, never a halo. An
 * avatar the next one overlaps also centres its initials on the part still showing.
 */
export const PERSON_AVATAR_STACK_RING =
  "ring-2 ring-background in-data-[slot=dialog-content]:ring-popover in-data-[slot=sheet-content]:ring-popover in-data-[slot=popover-content]:ring-popover in-data-[slot=hover-card-content]:ring-popover in-data-[slot=card]:ring-card not-last:[&_[data-slot=person-avatar-initials]]:-translate-x-0.75 rtl:not-last:[&_[data-slot=person-avatar-initials]]:translate-x-0.75";

/**
 * For a stack item that wraps its avatar (a hover-card trigger): every item the next one overlaps
 * centres its initials on the part still showing, so two letters are never cut ("MK", not "MI").
 * `PERSON_AVATAR_STACK_RING` carries the same rule for avatars that are the stack's own children.
 */
export const PERSON_AVATAR_STACK_ITEM =
  "not-last:[&_[data-slot=person-avatar-initials]]:-translate-x-0.75 rtl:not-last:[&_[data-slot=person-avatar-initials]]:translate-x-0.75";

/**
 * Initials that fit their circle: the second letter drops out under 18px and the type steps down
 * under 24px, read from the fallback's own width (`@container/initials`), and in a stack, where
 * the next avatar covers the circle's edge.
 */
function PersonInitials({ value }: { value: string }) {
  const [first = "", ...rest] = Array.from(value);
  return (
    <span
      data-slot="person-avatar-initials"
      className="inline-block in-data-[slot=avatar-group]:text-[83.333%] in-data-[slot=people-picker-avatars]:text-[83.333%] @max-[23.5px]/initials:text-[83.333%] @max-[17.5px]/initials:text-[75%]"
    >
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

/** A person shown by `PersonAvatar`, `PersonCard`, `PersonHoverCard` and `MembersStack`. */
export interface Person {
  /**
   * Your stable id for them (a member's id, an agent's id), never shown — what a
   * `PersonHoverCardProvider` looks them up by. @default undefined
   */
  id?: string | null;
  /** The name shown, and the avatar's initials. */
  name: string;
  /** The muted line under the name, and the initials when there is no name; omit for someone without an account. @default undefined */
  email?: string | null;
  /** The avatar image (a person's photo, a workspace's logo); agents draw their face instead. @default undefined */
  image?: string | null;
  /**
   * An agent's face: its preset character and palette. Without one an agent gets a face picked
   * from its name, so it is never blank. Only agents draw it. @default undefined
   */
  face?: AgentFaceSpec | null;
  /** The person's colour behind their initials — one of the ten tag hues; none is the muted fallback. @default undefined */
  hue?: AvatarHue | null;
  /** A status after the name, such as "Inactive" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
  /**
   * A person, a team of people (a rounded-square tile with the team icon on its hue), a workspace
   * (a rounded-square tile with its whole logo, else its initials), or an agent working for a member
   * (its face; named "Claude Code for Manoj").
   * @default "person"
   */
  kind?: PersonKind;
  /** An agent's owner — the member it works for: "Claude Code" for "Manoj". @default undefined */
  for?: string | null;
}

/** What a `Person` is: a person, a team of people, a workspace, or an agent working for a member. */
export type PersonKind = "person" | "team" | "workspace" | "agent";

/**
 * `personDisplayName` — a person's name as plain text: an agent reads "Claude Code for Manoj",
 * anyone else their name. For a toast, a title or a menu label; in a row, use `PersonName`.
 *
 * @example
 * personDisplayName({ name: "Claude Code", kind: "agent", for: "Manoj" }); // "Claude Code for Manoj"
 */
export function personDisplayName(
  person: Pick<Person, "name" | "kind" | "for">,
): string {
  return person.kind === "agent" && person.for
    ? `${person.name} for ${person.for}`
    : person.name;
}

/**
 * `personAccessibleName` — what a screen reader hears for a person: an agent is "Claude Code for
 * Manoj, agent" (or "Claude Code, agent") — the visible name first, so speech input matches it
 * (WCAG 2.5.3), and "agent" is never carried by colour alone.
 *
 * @example
 * personAccessibleName({ name: "Claude Code", kind: "agent", for: "Manoj" }); // "Claude Code for Manoj, agent"
 */
export function personAccessibleName(
  person: Pick<Person, "name" | "kind" | "for">,
): string {
  if (person.kind !== "agent") return person.name;
  return person.for
    ? `${person.name} for ${person.for}, agent`
    : `${person.name}, agent`;
}

/**
 * The avatar's size steps: `2xs` 16px and `xs` 20px for rows, chips and meta lines; `sm` 24px,
 * `default` 32px and `lg` 40px (Avatar's own tiers); `xl` 64px for a profile or an agent's header.
 * The initials, the icon and an agent's face scale with the step, so a caller never resizes an
 * avatar with a `className`.
 */
export type PersonAvatarSize = "2xs" | "xs" | "sm" | "default" | "lg" | "xl";

/**
 * Per step: the box (Avatar's own tiers set none), the icon (about 60% of the shape), the
 * initials and the corner indicator. The two row steps show one initial instead of two,
 * which `PersonInitials` sizes to the circle; `xl` lifts the initials to `text-lg`.
 */
const STEP: Record<
  PersonAvatarSize,
  {
    box: string;
    icon: string;
    initials: string;
    /** Show one initial, not two: two letters crowd a 16 or 20px circle's edge. */
    oneInitial?: boolean;
    indicator: string;
    /** The rounded square of a team or workspace: the `tile` corner, 25% of its size at every step, so it never reads as a circle. */
    square: string;
  }
> = {
  "2xs": {
    box: "size-4",
    icon: "size-2.5",
    initials: "",
    oneInitial: true,
    indicator: "size-1.5",
    square: "rounded-tile after:rounded-tile",
  },
  xs: {
    box: "size-5",
    icon: "size-3",
    initials: "",
    oneInitial: true,
    indicator: "size-2",
    square: "rounded-tile after:rounded-tile",
  },
  sm: {
    box: "",
    icon: "size-3.5",
    initials: "",
    indicator: "size-2",
    square: "rounded-tile after:rounded-tile",
  },
  default: {
    box: "",
    icon: "size-4.5",
    initials: "",
    indicator: "size-2.5",
    square: "rounded-tile after:rounded-tile",
  },
  lg: {
    box: "",
    icon: "size-6",
    initials: "",
    indicator: "size-3",
    square: "rounded-tile after:rounded-tile",
  },
  xl: {
    box: "size-16",
    icon: "size-9",
    initials: "text-lg",
    indicator: "size-4",
    square: "rounded-tile after:rounded-tile",
  },
};

/** The sizes Avatar draws itself; the other steps ride on `default` with their own box. */
const AVATAR_TIER = { sm: "sm", default: "default", lg: "lg" } as const;

/**
 * The face, loaded on demand: most pages show people far more than agents, so its drawing and its
 * presets stay out of every page's first bundle. Streaming server rendering (Next's) still renders
 * it into the HTML, and that markup stays on screen until the chunk arrives, so nothing flashes; a
 * one-shot `renderToString` leaves the sized box empty for the client to fill.
 */
const AgentFace = React.lazy(() =>
  import("@/components/ui/agent-face").then((m) => ({ default: m.AgentFace })),
);

/** Each step in CSS pixels, for an agent's face (the Mini below 40, the Pebble from 40). */
const STEP_PX: Record<PersonAvatarSize, number> = {
  "2xs": 16,
  xs: 20,
  sm: 24,
  default: 32,
  lg: 40,
  xl: 64,
};

/**
 * What an `AgentStateRing` (or any wrapper) tells the agent faces inside it to show, when their
 * `PersonAvatar` is given no `faceState` of its own.
 */
const FaceStateContext = React.createContext<FaceState | null>(null);

/**
 * `AgentFaceStateProvider` — sets the state every agent face inside it shows (unless a
 * `PersonAvatar` passes its own `faceState`). `AgentStateRing` uses it.
 *
 * @example <AgentFaceStateProvider state="needs-you"><PersonAvatar person={agent} /></AgentFaceStateProvider>
 */
export function AgentFaceStateProvider({
  state,
  children,
}: {
  state: FaceState | null;
  children: React.ReactNode;
}) {
  return (
    <FaceStateContext.Provider value={state}>
      {children}
    </FaceStateContext.Provider>
  );
}

/**
 * The agent root: the face's own box with no circle. In a group its Mini draws a 2px halo in its
 * own silhouette, the colour of the surface beneath (as `PERSON_AVATAR_STACK_RING` does), so a
 * circle never notches the next face.
 */
const AGENT_ROOT = cn(
  "relative inline-flex shrink-0 items-center justify-center",
  "in-data-[slot=avatar-group]:[--person-avatar-halo:var(--background)] in-data-[slot=avatar-group]:in-data-[slot=card]:[--person-avatar-halo:var(--card)] in-data-[slot=avatar-group]:in-data-[slot=popover-content]:[--person-avatar-halo:var(--popover)] in-data-[slot=avatar-group]:in-data-[slot=hover-card-content]:[--person-avatar-halo:var(--popover)] in-data-[slot=avatar-group]:in-data-[slot=dialog-content]:[--person-avatar-halo:var(--popover)] in-data-[slot=avatar-group]:in-data-[slot=sheet-content]:[--person-avatar-halo:var(--popover)]",
);

/**
 * Whether an image has loaded or failed, keyed by its `src` so a new image starts over: a failure
 * or a load of the old one never sticks. It may have settled before hydration attached
 * `onLoad`/`onError`, so its element's own state is read once it is in the tree.
 */
function useImageStatus(src: string | undefined) {
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLImageElement | null>(null);
  React.useLayoutEffect(() => {
    const img = ref.current;
    if (!src || !img || !img.complete) return;
    if (img.naturalWidth > 0) setLoaded(src);
    else if (img.currentSrc)
      // No width is not a failure on its own: some engines report 0 for an SVG with only a
      // viewBox. Decoding tells a broken image from one with no intrinsic size.
      img.decode().then(
        () => setLoaded(src),
        () => setFailed(src),
      );
  }, [src]);
  return {
    ref,
    loaded: src !== undefined && loaded === src,
    failed: src !== undefined && failed === src,
    onLoad: () => setLoaded(src ?? null),
    onError: () => setFailed(src ?? null),
  };
}

/**
 * The member an agent acts for, as a small circle at the avatar's bottom-end corner, per step —
 * none at the row steps, where it would cover the mark.
 */
const ACTING_FOR: Partial<Record<PersonAvatarSize, string>> = {
  sm: "size-3",
  default: "size-3.5",
  lg: "size-4",
  xl: "size-6",
};

/** Props for `PersonAvatar`. */
export interface PersonAvatarProps extends Omit<
  React.ComponentProps<typeof Avatar>,
  "children" | "size"
> {
  /** The person. */
  person: Pick<Person, "name" | "email" | "image" | "hue" | "kind" | "face">;
  /**
   * The size step: `2xs` 16px, `xs` 20px, `sm` 24px, `default` 32px, `lg` 40px, `xl` 64px.
   * Initials, icons and faces scale with it — never resize an avatar with a `className`.
   * @default "sm"
   */
  size?: PersonAvatarSize;
  /** Draw a person, a team, a workspace or an agent; overrides `person.kind`. @default person.kind ?? "person" */
  kind?: PersonKind;
  /**
   * What an agent's face shows (`FaceState`). Ignored for anyone who is not an agent.
   * @default the enclosing `AgentFaceStateProvider`'s state, else "idle"
   */
  faceState?: FaceState;
  /**
   * Whether an agent's face moves: only where the person is looking at that agent (its chat, its
   * page header, its hover card, quick ask). Reduced motion always gets the still pose.
   * @default false
   */
  motion?: boolean;
  /**
   * A small indicator at the bottom-end corner — a presence dot or a state icon — sized to the
   * step, with a background-coloured gap. Decorative: say what it means in text too. With
   * `actingFor` shown it moves to the top-end corner.
   * @default undefined
   */
  indicator?: React.ReactNode;
  /**
   * The member an agent acts for, as a small circle (their photo, else their initials on their
   * hue) offset at the bottom-end corner with a halo — the agent leads and the person rides on
   * it, as in "Claude Code for Manoj". Shown from `sm` up; the row steps leave it out. Decorative:
   * name the member in text too (`PersonName` does). Ignored for anyone who is not an agent.
   * @default undefined
   */
  actingFor?: Pick<Person, "name" | "image" | "hue"> | null;
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
 * on its hue — for workspace switchers and headers. An agent (`kind="agent"`) is its face
 * (`AgentFace`): the Mini at the row steps up to `default`, the Pebble at `lg` and `xl`, showing
 * `faceState`; `actingFor` adds the member it works for as a small circle at its corner.
 *
 * @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} />
 * @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} size="2xs" />
 * @example <PersonAvatar person={{ name: "Sales", kind: "team", hue: "green" }} />
 * @example <PersonAvatar person={{ name: "Acme Lighting", kind: "workspace", image: logoUrl }} />
 * @example <PersonAvatar person={{ name: "Scout", kind: "agent", face: { v: 1, preset: "squish", palette: "violet" } }} />
 * @example <PersonAvatar person={agent} size="xl" faceState="thinking" motion />
 * @example <PersonAvatar person={agent} actingFor={{ name: "Manoj", hue: "blue" }} size="lg" />
 */
export function PersonAvatar({
  person,
  size = "sm",
  kind,
  faceState,
  motion = false,
  indicator,
  actingFor,
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

  const src = team || agent ? undefined : person.image || undefined;
  const contextState = React.useContext(FaceStateContext);

  const image = useImageStatus(src);
  const showImage = src !== undefined && !image.failed;
  const imageLoaded = showImage && image.loaded;

  const actingForClass = agent && actingFor ? ACTING_FOR[size] : undefined;
  const actingForNode = actingForClass ? (
    <span
      aria-hidden
      data-slot="person-avatar-acting-for"
      // Two pixels out from the corner, on a halo the colour of the surface beneath. A stack's
      // nudge for covered initials is the agent's, not this circle's.
      className="absolute -end-0.5 -bottom-0.5 z-10 inline-flex [&&&_[data-slot=person-avatar-initials]]:translate-x-0"
    >
      <PersonAvatar
        person={{
          name: actingFor!.name,
          image: actingFor!.image,
          hue: actingFor!.hue,
        }}
        size="2xs"
        className={cn(PERSON_AVATAR_STACK_RING, actingForClass)}
      />
    </span>
  ) : null;

  const indicatorNode =
    indicator != null && indicator !== false ? (
      <span
        data-slot="person-avatar-indicator"
        className={cn(
          "absolute end-0 bottom-0 z-10 inline-flex items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-background [&>svg]:size-full",
          // The member takes the bottom corner; the indicator moves to the top.
          actingForNode && "top-0 bottom-auto",
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
    const px = STEP_PX[size];
    const { size: _tier, ...agentProps } =
      rootProps as React.ComponentProps<"span"> & {
        size?: string;
      };
    return (
      <span
        data-slot="avatar"
        {...agentProps}
        data-kind="agent"
        style={{ width: px, height: px, ...style }}
        className={cn(AGENT_ROOT, className, "ring-0")}
      >
        <React.Suspense fallback={null}>
          <AgentFace
            face={person.face ?? null}
            name={person.name}
            state={faceState ?? contextState ?? "idle"}
            size={px}
            motion={motion}
            halo="var(--person-avatar-halo, transparent)"
            ring="var(--person-avatar-halo, var(--background))"
            label=""
          />
        </React.Suspense>
        {actingForNode}
        {indicatorNode}
      </span>
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
          ref={image.ref}
          data-slot="avatar-image"
          src={src}
          alt=""
          decoding="async"
          onLoad={image.onLoad}
          onError={image.onError}
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
        "shrink-0 rounded-inline bg-tag-purple-subtle px-1 text-xs font-medium whitespace-nowrap text-tag-purple-text",
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
  /** The person; an agent (`kind: "agent"`) reads with the member it works `for`. */
  person: Pick<Person, "name" | "kind" | "for">;
  /**
   * Add the purple "Agent" label after an agent's name — for a surface that names agents without
   * their face (a hover card's heading, a profile), and in pickers, where people and agents are
   * chosen side by side. @default false
   */
  agentLabel?: boolean;
  /**
   * How an agent's member reads: `sentence` — "Claude Code for Manoj", for attribution in a row,
   * a feed or a comment; `compact` — "Claude Code · Manoj", for a picker row, where the name is
   * scanned in a list.
   * @default "sentence"
   */
  variant?: "sentence" | "compact";
}

/**
 * `PersonName` — a person's name as every surface writes it. A person or a team is their name; an
 * agent is its name and a muted "for Manoj" (its face says it is an agent; `agentLabel` adds
 * the purple label where no avatar shows, or where people and agents are picked together), or
 * "· Manoj" in a picker (`variant="compact"`); a screen reader hears "Claude Code for Manoj,
 * agent". Inline, so it sits in a sentence, a hover-card trigger or a truncating row.
 *
 * @example <PersonName person={{ name: "Claude Code", kind: "agent", for: "Manoj" }} />
 * @example <PersonName person={agent} variant="compact" agentLabel />
 */
export function PersonName({
  person,
  agentLabel = false,
  variant = "sentence",
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
      data-variant={variant}
      className={className}
      {...props}
    >
      <span aria-hidden>
        {person.name}
        {person.for ? (
          <span
            data-slot="person-name-for"
            className="font-normal text-muted-foreground"
          >
            {variant === "compact" ? " · " : " for "}
            {person.for}
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
