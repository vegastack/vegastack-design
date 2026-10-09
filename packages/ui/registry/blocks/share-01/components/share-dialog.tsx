// @vegastack share-01@0.25.1 sha256-tSwjwTYV/DQd45eQJQbJhOo+3OdV3prvfjljF4dhI4Y=

"use client";

import * as React from "react";
import { GlobeIcon, RotateCcwIcon, UserLock, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  PeopleInput,
  type PeopleInputOption,
  type PeopleInputProps,
} from "@/components/ui/people-input";
import {
  PermissionMenu,
  type PermissionMenuOption,
} from "@/components/ui/permission-menu";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Space, SpaceHint } from "@/components/ui/space-picker";
import { IconGlyph } from "@/components/ui/icon-glyph";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ShareDialog — the Share surface for one item, data-agnostic: every row, level and link comes
 * in through props and every change goes out through a callback. A `ResponsiveDialog` (`md`, 512px)
 * on wide screens and a bottom sheet on phones, with two tabs:
 *
 *   Share — an invite row (PeopleInput + the level for the batch + Invite; while chips exist,
 *   Notify and an optional message), People with access (each level a chip menu; built-in rows
 *   locked with the reason in a tooltip), Space access, and a footer "Copy link" for the item's
 *   own (signed-in) link.
 *
 *   Publish — a "Publish to the web" switch, off by default. Turning it on is the ONLY way the item
 *   is published: no Copy button ever publishes. While on: the public URL, "Copy public link",
 *   Reset, Expires and "Stop publishing" (confirmed).
 * ----------------------------------------------------------------------------------------------*/

/** One row of "People with access". */
export interface ShareEntry {
  /** A stable id — the person's or team's. */
  id: string;
  /** The person or team (`kind: "team"`). */
  person: Person;
  /** Why they have access — "Creator", "Assignee", "Manager of Priya", "via Sales team". @default undefined */
  reason?: React.ReactNode;
  /** Their access level — one of `levels`. */
  level: string;
  /**
   * A built-in row (creator, assignee, manager): the level is shown with a lock, never changed.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Why a built-in (`readOnly`) row's level cannot change, in its tooltip — e.g. "Set by role:
   * Creator". @default "Set by role: {reason}" when `reason` is a string
   */
  lockedReason?: React.ReactNode;
  /** This row is the viewer; "(you)" follows the name. @default false */
  you?: boolean;
}

/** What `onInvite` receives. */
export interface ShareInvite {
  /** The people and teams to add. */
  invitees: PeopleInputOption[];
  /** The one level given to all of them. */
  level: string;
  /** Notify them. */
  notify: boolean;
  /** The optional note sent with the notification; `""` when none. */
  message: string;
}

/** How long a public link stays live. */
export type ShareLinkExpiry = "never" | "1d" | "7d" | "30d";

/** The item's public (view-only) link, when one is on. */
export interface SharePublicLink {
  /** The link. */
  url: string;
  /** When it stops working. */
  expires: ShareLinkExpiry;
}

/** Who in the item's space can open it. */
export interface ShareGeneralAccess {
  /**
   * The item's space. The viewer's own personal space (`access: "personal"`) reads "My space ·
   * Only you and the people above", with no mode or level to change. `null` when the viewer
   * cannot see the space — then `spaceHint` says which kind it is.
   */
  space?: Space | null;
  /**
   * With `space: null`: which kind of space the viewer cannot see holds the item. The row is a
   * plain statement — "In Priya's My space" or "In a private space" — with no mode or level.
   * @default { kind: "private" }
   */
  spaceHint?: SpaceHint | null;
  /** `space` — everyone in the space; `invited` — only people invited. */
  mode: "space" | "invited";
  /** The space members' level while `mode` is `space` — one of `generalLevels`. */
  level: string;
}

/** Every string the dialog renders. */
export interface ShareDialogLabels {
  title: string;
  invitePlaceholder: string;
  inviteEmpty: string;
  inviteLevel: (level: string) => string;
  notify: string;
  messagePlaceholder: string;
  cancel: string;
  peopleHeading: string;
  you: string;
  levelFor: (name: string, level: string) => string;
  generalHeading: string;
  everyoneIn: (space: string) => string;
  onlyInvited: string;
  generalHint: (mode: "space" | "invited", space: string) => string;
  publicHint: string;
  copyPublicLink: string;
  publicLinkField: string;
  resetLink: string;
  resetLinkHint: string;
  expires: string;
  expiry: Record<ShareLinkExpiry, string>;
  copyLink: string;
  copied: string;
  /** The Share tab. */
  shareTab: string;
  /** The Publish tab. */
  publishTab: string;
  /** The invite row's button. */
  invite: string;
  /** The hint beside the footer's Copy link. */
  copyLinkHint: string;
  /** A personal space's row: "My space". */
  mySpace: string;
  /** A personal space's row hint. */
  mySpaceHint: string;
  /** The space row for a space the viewer cannot see: "In Priya's My space". */
  hiddenSpace: (hint: SpaceHint) => string;
  /** The Share tab's notice while the item is published. */
  publishedNotice: string;
  /** The notice's link to the Publish tab. */
  managePublishing: string;
  /** The Publish switch's label. */
  publishHeading: string;
  /** The Publish switch's hint while off. */
  publishHintOff: string;
  /** The Publish tab's text for a viewer who cannot publish, while it is off. */
  notPublished: string;
  /** The button that turns publishing off. */
  stopPublishing: string;
  /** The stop-publishing confirmation's title. */
  stopPublishingTitle: string;
  /** The stop-publishing confirmation's body. */
  stopPublishingBody: string;
  /** A locked built-in row's tooltip, from its reason. */
  lockedReason: (reason: string) => string;
}

const defaultLabels: ShareDialogLabels = {
  title: "Share",
  invitePlaceholder: "Add people or teams…",
  inviteEmpty: "No people or teams found",
  inviteLevel: (level) => `Access for new people: ${level}`,
  notify: "Notify people",
  messagePlaceholder: "Add a message (optional)",
  cancel: "Cancel",
  peopleHeading: "People with access",
  you: "(you)",
  levelFor: (name, level) => `${name}'s access: ${level}`,
  generalHeading: "Space access",
  everyoneIn: (space) => `Everyone in ${space}`,
  onlyInvited: "Only people invited",
  generalHint: (mode, space) =>
    mode === "space"
      ? `Members of ${space} can find and open it`
      : "Only people with access can open it",
  publicHint: "Anyone with the link can view, without signing in",
  copyPublicLink: "Copy public link",
  publicLinkField: "Public link",
  resetLink: "Reset link",
  resetLinkHint: "Reset link — the current link stops working",
  expires: "Expires",
  expiry: { never: "Never", "1d": "1 day", "7d": "7 days", "30d": "30 days" },
  copyLink: "Copy link",
  copied: "Copied",
  shareTab: "Share",
  publishTab: "Publish",
  invite: "Invite",
  copyLinkHint: "Only people with access can open it",
  mySpace: "My space",
  mySpaceHint: "Only you and the people above",
  hiddenSpace: (hint) =>
    hint.kind === "personal"
      ? `In ${hint.ownerName}'s My space`
      : "In a private space",
  publishedNotice: "Published to the web",
  managePublishing: "Manage",
  publishHeading: "Publish to the web",
  publishHintOff: "Off — only people with access can open it",
  notPublished: "Not published",
  stopPublishing: "Stop publishing",
  stopPublishingTitle: "Stop publishing?",
  stopPublishingBody:
    "The public link stops working at once. People with access can still open it.",
  lockedReason: (reason) => `Set by role: ${reason}`,
};

/** Props for `ShareDialog`. */
export interface ShareDialogProps {
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Called when the dialog opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Uncontrolled initial open state. @default false */
  defaultOpen?: boolean;
  /** The element that opens the dialog, such as a Share button. @default undefined */
  trigger?: React.ReactElement;
  /** The access levels, most to least, e.g. Full access / Can edit / Can view. */
  levels: readonly PermissionMenuOption[];
  /** The rows of "People with access". */
  people: readonly ShareEntry[];
  /** The viewer may change access: invite, change levels, general access and the public link. @default true */
  canManage?: boolean;
  /** People with access is still loading; skeleton rows show. @default false */
  loading?: boolean;
  /** Finds people and teams to invite — `PeopleInput`'s `search`. Omit to hide the invite row. @default undefined */
  search?: PeopleInputProps["search"];
  /**
   * People and teams already chosen to invite — the dialog opens in invite mode. Reactive: when it
   * changes (compared by id), the chips are replaced with it; edits made since the last change stay
   * until then. @default []
   */
  defaultInvitees?: PeopleInputOption[];
  /** The level an invite starts at. @default the last of `levels` */
  defaultInviteLevel?: string;
  /**
   * Sends an invite; the chips clear when it resolves. Resolve `false` (or reject) to keep them
   * for a retry — the host shows its own error. @default undefined
   */
  onInvite?: (invite: ShareInvite) => void | boolean | Promise<void | boolean>;
  /** Changes one row's level. @default undefined */
  onLevelChange?: (id: string, level: string) => void;
  /** Removes one row's access; adds "Remove access" to its menu. @default undefined */
  onRemove?: (id: string) => void;
  /** The item's space and who in it can open the item. Omit to hide General access. @default undefined */
  generalAccess?: ShareGeneralAccess;
  /** The levels a whole space may get. @default levels */
  generalLevels?: readonly PermissionMenuOption[];
  /** General access's level shows as text even for a manager, who can still change the mode. @default false */
  generalLevelReadOnly?: boolean;
  /** Changes General access. @default undefined */
  onGeneralAccessChange?: (next: {
    mode: "space" | "invited";
    level: string;
  }) => void;
  /** Offer the public link row at all. @default true */
  publicLinkAvailable?: boolean;
  /** The public link while it is on; `null` while it is off. @default null */
  publicLink?: SharePublicLink | null;
  /**
   * Turns the public link on — called ONLY by the Publish tab's switch, never by a Copy button.
   * A returned URL is ignored (nothing is copied as a side effect). @default undefined
   */
  onCreatePublicLink?: () => Promise<string | void> | string | void;
  /** Replaces the public link with a new one. @default undefined */
  onResetPublicLink?: () => void | Promise<void>;
  /** Changes when the public link expires. @default undefined */
  onPublicLinkExpiresChange?: (expires: ShareLinkExpiry) => void;
  /** Turns the public link off. @default undefined */
  onStopPublicLink?: () => void | Promise<void>;
  /** A public-link change is in flight; its controls wait. @default false */
  publicLinkPending?: boolean;
  /** The item's own link, for Copy link in the footer. Omit to hide Copy link. @default undefined */
  linkUrl?: string;
  /** A muted note above the footer, such as "Admins can view this space." @default undefined */
  footerNote?: React.ReactNode;
  /** Override any rendered string. @default {} */
  labels?: Partial<ShareDialogLabels>;
  /** The tab the dialog opens on — `publish` when opened from a "Published" indicator. @default "share" */
  defaultTab?: "share" | "publish";
}

/** A line tab whose underline and label both start where the dialog's content does. */
const LINE_TAB = "flex-none border-x-0 px-0";

const EXPIRIES: readonly ShareLinkExpiry[] = ["never", "1d", "7d", "30d"];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-muted-foreground">{children}</h3>
  );
}

/** A 32px muted tile holding an icon, beside a row's text. */
function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4"
    >
      {children}
    </span>
  );
}

/**
 * `ShareDialog` — share one item with people and teams, see who in its space can open it, and
 * publish it to the web from its own tab.
 *
 * @example
 * <ShareDialog
 *   trigger={<Button variant="outline">Share</Button>}
 *   levels={LEVELS}
 *   people={entries}
 *   search={searchDirectory}
 *   onInvite={invite}
 *   onLevelChange={setLevel}
 *   onRemove={removeAccess}
 *   onCreatePublicLink={publish}
 *   defaultTab="share"
 * />
 */
export function ShareDialog({
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  trigger,
  levels,
  people,
  canManage = true,
  loading = false,
  search,
  defaultInvitees = [],
  defaultInviteLevel,
  onInvite,
  onLevelChange,
  onRemove,
  generalAccess,
  generalLevels = levels,
  generalLevelReadOnly = false,
  onGeneralAccessChange,
  publicLinkAvailable = true,
  publicLink = null,
  onCreatePublicLink,
  onResetPublicLink,
  onPublicLinkExpiresChange,
  onStopPublicLink,
  publicLinkPending = false,
  linkUrl,
  footerNote,
  labels: labelsProp,
  defaultTab = "share",
}: ShareDialogProps) {
  const labels = { ...defaultLabels, ...labelsProp };

  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const [tab, setTab] = React.useState<"share" | "publish">(defaultTab);
  // Each opening starts on the tab the caller asked for.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setTab(defaultTab);
  }

  const [invitees, setInvitees] =
    React.useState<PeopleInputOption[]>(defaultInvitees);
  // Re-sync the chips when `defaultInvitees` changes — by ids, so a fresh array with the same
  // people each render is not a change and never clobbers what the viewer has edited since.
  const defaultInviteesKey = defaultInvitees
    .map((option) => option.id)
    .join("\u0000");
  const [syncedInviteesKey, setSyncedInviteesKey] =
    React.useState(defaultInviteesKey);
  if (syncedInviteesKey !== defaultInviteesKey) {
    setSyncedInviteesKey(defaultInviteesKey);
    setInvitees(defaultInvitees);
  }
  const [inviteLevel, setInviteLevel] = React.useState(
    defaultInviteLevel ?? levels.at(-1)?.value ?? "",
  );
  const [notify, setNotify] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [inviting, setInviting] = React.useState(false);
  const [confirmStop, setConfirmStop] = React.useState(false);
  const publishLabelId = React.useId();
  const publishTabRef = React.useRef<HTMLButtonElement>(null);
  const panelsRef = React.useRef<HTMLDivElement>(null);
  // The two panels share one scrolling body: a new tab starts at its top, so a list scrolled on
  // Share never leaves Publish's controls above the viewport.
  React.useLayoutEffect(() => {
    panelsRef.current?.parentElement?.scrollTo({ top: 0 });
  }, [tab]);
  const inviteMode = canManage && invitees.length > 0;

  const resetInvite = () => {
    setInvitees([]);
    setMessage("");
    setNotify(true);
  };

  const sendInvite = async () => {
    if (!onInvite || invitees.length === 0) return;
    setInviting(true);
    try {
      const saved = await onInvite({
        invitees,
        level: inviteLevel,
        notify,
        message,
      });
      if (saved !== false) resetInvite();
    } catch {
      // The host reports the error; the chips stay for a retry.
    } finally {
      setInviting(false);
    }
  };

  const levelLabel = (value: string, options = levels) =>
    options.find((option) => option.value === value)?.label ?? value;

  // ---- Share tab --------------------------------------------------------------------------------

  const inviteRow =
    canManage && search ? (
      <div
        data-slot="share-invite-row"
        className="flex flex-col gap-2 @md/share:flex-row @md/share:items-start"
      >
        <div className="min-w-0 flex-1">
          <PeopleInput
            value={invitees}
            onValueChange={setInvitees}
            search={search}
            placeholder={labels.invitePlaceholder}
            emptyText={labels.inviteEmpty}
            aria-label={labels.invitePlaceholder.replace(/…$/, "")}
            disabled={inviting}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PermissionMenu
            variant="outline"
            value={inviteLevel}
            options={levels}
            onValueChange={setInviteLevel}
            disabled={inviting}
            aria-label={labels.inviteLevel(levelLabel(inviteLevel))}
            className="flex-1 @md/share:flex-none"
          />
          <Button
            onClick={sendInvite}
            loading={inviting}
            disabled={invitees.length === 0}
          >
            {labels.invite}
          </Button>
        </div>
      </div>
    ) : null;

  const inviteSection = (
    <div data-slot="share-invite" className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={notify}
          onCheckedChange={(checked) => setNotify(checked === true)}
        />
        {labels.notify}
      </label>
      {notify ? (
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={labels.messagePlaceholder}
          aria-label={labels.messagePlaceholder.replace(/ \(optional\)$/, "")}
          rows={3}
        />
      ) : null}
    </div>
  );

  const peopleSection = (
    <section data-slot="share-people" className="flex flex-col gap-1">
      <SectionHeading>{labels.peopleHeading}</SectionHeading>
      {loading ? (
        <ul aria-busy className="flex flex-col">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-2 py-1.5">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className={i === 1 ? "h-3 w-24" : "h-3 w-32"} />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ItemGroup className="gap-0">
          {people.map((entry) => {
            const label = levelLabel(entry.level);
            const locked = canManage && entry.readOnly;
            return (
              <Item
                key={entry.id}
                size="xs"
                data-slot="share-person"
                className="px-0"
              >
                <ItemMedia>
                  <PersonAvatar person={entry.person} size="default" />
                </ItemMedia>
                <ItemContent className="min-w-0 gap-0">
                  <ItemTitle className="w-full font-normal">
                    <span className="truncate">
                      {entry.person.name}
                      {entry.you ? (
                        <span className="text-muted-foreground">
                          {" "}
                          {labels.you}
                        </span>
                      ) : null}
                    </span>
                  </ItemTitle>
                  {entry.reason != null ? (
                    <ItemDescription className="truncate text-xs">
                      {entry.reason}
                    </ItemDescription>
                  ) : null}
                </ItemContent>
                <ItemActions>
                  <PermissionMenu
                    variant="chip"
                    value={entry.level}
                    options={levels}
                    readOnly={!canManage}
                    locked={locked}
                    lockedReason={
                      entry.lockedReason ??
                      (typeof entry.reason === "string"
                        ? labels.lockedReason(entry.reason)
                        : undefined)
                    }
                    onValueChange={(level) => onLevelChange?.(entry.id, level)}
                    onRemove={onRemove ? () => onRemove(entry.id) : undefined}
                    aria-label={labels.levelFor(entry.person.name, label)}
                  />
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </section>
  );

  const space = generalAccess?.space ?? null;
  // A statement, not a control: the viewer's own My space, or a space they cannot see.
  const statement: { tile: React.ReactNode; text: React.ReactNode } | null =
    !generalAccess
      ? null
      : !space
        ? {
            tile: (
              <IconGlyph
                fallback={
                  generalAccess.spaceHint?.kind === "personal" ? (
                    <UserLock />
                  ) : (
                    <Lock />
                  )
                }
              />
            ),
            text: labels.hiddenSpace(
              generalAccess.spaceHint ?? { kind: "private" },
            ),
          }
        : space.access === "personal"
          ? {
              tile: <UserLock />,
              text: (
                <>
                  {labels.mySpace}
                  <span className="text-muted-foreground">
                    {" · "}
                    {labels.mySpaceHint}
                  </span>
                </>
              ),
            }
          : null;
  const generalSection = !generalAccess ? null : (
    <section data-slot="share-general" className="flex flex-col gap-2">
      <SectionHeading>{labels.generalHeading}</SectionHeading>
      {statement ? (
        <div className="flex min-w-0 items-center gap-2">
          <IconTile>{statement.tile}</IconTile>
          <span className="min-w-0 flex-1 truncate text-sm">
            {statement.text}
          </span>
        </div>
      ) : space ? (
        <div className="flex min-w-0 items-center gap-2">
          <IconGlyph
            fallback={
              space.icon ?? Array.from(space.name.trim())[0]?.toUpperCase()
            }
            hue={space.hue}
            size="default"
          />
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {canManage ? (
              <Select
                items={[
                  { value: "space", label: labels.everyoneIn(space.name) },
                  { value: "invited", label: labels.onlyInvited },
                ]}
                value={generalAccess.mode}
                onValueChange={(mode) =>
                  onGeneralAccessChange?.({
                    mode: mode as "space" | "invited",
                    level: generalAccess.level,
                  })
                }
              >
                <SelectTrigger
                  variant="ghost"
                  size="sm"
                  aria-label={labels.generalHeading}
                  className="-ms-2.5 w-auto max-w-full text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space">
                    {labels.everyoneIn(space.name)}
                  </SelectItem>
                  <SelectItem value="invited">{labels.onlyInvited}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="truncate text-sm">
                {generalAccess.mode === "space"
                  ? labels.everyoneIn(space.name)
                  : labels.onlyInvited}
              </span>
            )}
            <span className="truncate text-xs text-muted-foreground">
              {labels.generalHint(generalAccess.mode, space.name)}
            </span>
          </div>
          {generalAccess.mode === "space" ? (
            <PermissionMenu
              variant="chip"
              value={generalAccess.level}
              options={generalLevels}
              readOnly={!canManage || generalLevelReadOnly}
              onValueChange={(level) =>
                onGeneralAccessChange?.({ mode: "space", level })
              }
              aria-label={labels.levelFor(
                labels.everyoneIn(space.name),
                levelLabel(generalAccess.level, generalLevels),
              )}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );

  // While published, the Share tab says so in one line, with a way to the Publish tab.
  const publishedNotice =
    publicLinkAvailable && publicLink ? (
      <p
        data-slot="share-published-notice"
        className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
      >
        <GlobeIcon aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{labels.publishedNotice}</span>
        <Button
          variant="link"
          size="xs"
          className="ms-auto h-auto shrink-0 px-0"
          onClick={() => {
            // Manage unmounts with the Share tab: hand focus to the Publish trigger first.
            publishTabRef.current?.focus();
            setTab("publish");
          }}
        >
          {labels.managePublishing}
        </Button>
      </p>
    ) : null;

  const shareBody = (
    <div data-slot="share-dialog-body" className="flex flex-col gap-4 pb-1">
      {inviteRow}
      {inviteMode ? (
        inviteSection
      ) : (
        <>
          {peopleSection}
          {generalSection}
          {publishedNotice}
          {footerNote ? (
            <p className="text-xs text-muted-foreground">{footerNote}</p>
          ) : null}
        </>
      )}
    </div>
  );

  // ---- Publish tab ------------------------------------------------------------------------------

  const publishBody = (
    <div data-slot="share-public-link" className="flex flex-col gap-3 pb-1">
      <div className="flex min-w-0 items-center gap-2">
        <IconTile>
          <GlobeIcon />
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col">
          <span id={publishLabelId} className="truncate text-sm">
            {labels.publishHeading}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {publicLink
              ? labels.publicHint
              : canManage
                ? labels.publishHintOff
                : labels.notPublished}
          </span>
        </div>
        {canManage ? (
          <Switch
            aria-labelledby={publishLabelId}
            checked={publicLink !== null}
            disabled={publicLinkPending}
            onCheckedChange={(checked) => {
              if (checked) void onCreatePublicLink?.();
              else setConfirmStop(true);
            }}
          />
        ) : null}
      </div>
      {publicLink ? (
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <InputGroup className="min-w-0 flex-1">
              <InputGroupInput
                readOnly
                value={publicLink.url}
                aria-label={labels.publicLinkField}
                onFocus={(event) => event.currentTarget.select()}
              />
              {canManage ? (
                <InputGroupAddon align="inline-end">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <InputGroupButton
                          size="icon-xs"
                          aria-label={labels.resetLink}
                          disabled={publicLinkPending}
                          onClick={() => onResetPublicLink?.()}
                        />
                      }
                    >
                      <RotateCcwIcon />
                    </TooltipTrigger>
                    <TooltipContent>{labels.resetLinkHint}</TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            <CopyButton
              value={publicLink.url}
              showLabel
              variant="outline"
              size="default"
              copyLabel={labels.copyPublicLink}
              copiedLabel={labels.copied}
            />
          </div>
          {canManage ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {labels.expires}
                </span>
                <Select
                  items={EXPIRIES.map((value) => ({
                    value,
                    label: labels.expiry[value],
                  }))}
                  value={publicLink.expires}
                  onValueChange={(value) =>
                    onPublicLinkExpiresChange?.(value as ShareLinkExpiry)
                  }
                  disabled={publicLinkPending}
                >
                  <SelectTrigger size="sm" aria-label={labels.expires}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {labels.expiry[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={publicLinkPending}
                onClick={() => setConfirmStop(true)}
              >
                {labels.stopPublishing}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.stopPublishingTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.stopPublishingBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmStop(false);
                void onStopPublicLink?.();
              }}
            >
              {labels.stopPublishing}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // The Share tab's footer. It keeps its box on the Publish tab (hidden and inert there), so the
  // dialog does not change height when the tabs switch.
  const footer = inviteMode ? (
    <Button variant="secondary" onClick={resetInvite} disabled={inviting}>
      {labels.cancel}
    </Button>
  ) : linkUrl ? (
    <div
      data-slot="share-copy-link"
      className="flex w-full flex-wrap items-center justify-between gap-2"
    >
      <span className="text-xs text-muted-foreground">
        {labels.copyLinkHint}
      </span>
      <CopyButton
        value={linkUrl}
        showLabel
        variant="outline"
        size="default"
        copyLabel={labels.copyLink}
        copiedLabel={labels.copied}
      />
    </div>
  ) : null;

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {trigger ? <ResponsiveDialogTrigger render={trigger} /> : null}
      <ResponsiveDialogContent size="md" data-share-dialog="">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{labels.title}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as "share" | "publish")}
          className="@container/share flex min-h-0 flex-1 flex-col gap-4"
        >
          {publicLinkAvailable ? (
            // Upstream's line list pads its triggers 3px + 1px border + 6px in from the list edge.
            // Here the underline and the label start ON the content edge, like the title and the
            // rows below: no list padding, no trigger padding, a 16px gap between the tabs. The
            // phone sheet's content has no padding of its own, so the list takes the 16px inset
            // its header and body carry. Two tabs never scroll, so the list does not clip: a
            // focused tab's forced-colours outline keeps its leading side (in RTL too).
            <TabsList
              variant="line"
              overflow="visible"
              className="-mt-1 justify-start gap-4 px-0 in-data-[slot=sheet-content]:mx-4"
            >
              <TabsTrigger value="share" className={LINE_TAB}>
                {labels.shareTab}
              </TabsTrigger>
              <TabsTrigger
                ref={publishTabRef}
                value="publish"
                className={LINE_TAB}
              >
                {labels.publishTab}
                {publicLink ? (
                  <GlobeIcon
                    aria-hidden
                    data-slot="share-published-dot"
                    className="size-3 text-muted-foreground"
                  />
                ) : null}
              </TabsTrigger>
            </TabsList>
          ) : null}
          <ResponsiveDialogBody>
            {/* Both panels stay mounted in ONE grid cell, the inactive one invisible and inert, so
                the body is always as tall as the taller panel and switching tabs never resizes
                the dialog or the sheet. */}
            <div ref={panelsRef} data-slot="share-panels" className="grid">
              <TabsContent
                value="share"
                keepMounted
                hidden={false}
                className="col-start-1 row-start-1 data-hidden:invisible"
              >
                {shareBody}
              </TabsContent>
              {publicLinkAvailable ? (
                <TabsContent
                  value="publish"
                  keepMounted
                  hidden={false}
                  className="col-start-1 row-start-1 data-hidden:invisible"
                >
                  {publishBody}
                </TabsContent>
              ) : null}
            </div>
          </ResponsiveDialogBody>
        </Tabs>
        {footer ? (
          <ResponsiveDialogFooter
            data-hidden={tab === "share" ? undefined : ""}
            inert={tab !== "share"}
            className="data-hidden:invisible"
          >
            {footer}
          </ResponsiveDialogFooter>
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
