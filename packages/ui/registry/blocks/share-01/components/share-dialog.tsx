// @vegastack share-01@0.23.113 sha256-de1a1Owsy8gPyES9U30MMoJdgoKZfvkhQ6Ny3fZnC+k=

"use client";

import * as React from "react";
import { GlobeIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SpaceAvatar, type Space } from "@/components/ui/space-avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/components/ui/use-mobile";

/* ------------------------------------------------------------------------------------------------
 * ShareDialog — the Share surface for one item, data-agnostic: every row, level and link comes
 * in through props and every change goes out through a callback. A Dialog on wide screens and a
 * bottom Sheet below the mobile breakpoint, with the same sections in both:
 *
 *   invite row (PeopleInput) → while chips exist: one access level for the whole batch, Notify,
 *   an optional message, Cancel / Share; otherwise: People with access (avatar, name, the reason
 *   they have it, a PermissionMenu — built-in rows read-only), General access (the item's space),
 *   Anyone with the link (off → "Copy public link"; on → the URL, copy, reset, expiry, Stop
 *   sharing), a footer note, and Copy link / Done.
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
  /** A built-in row (creator, assignee, manager): the level is shown, never changed. @default false */
  readOnly?: boolean;
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
  /** The item's space. */
  space: Space;
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
  share: string;
  peopleHeading: string;
  you: string;
  levelFor: (name: string, level: string) => string;
  generalHeading: string;
  everyoneIn: (space: string) => string;
  onlyInvited: string;
  generalHint: (mode: "space" | "invited", space: string) => string;
  publicSection: string;
  publicHeading: string;
  publicOff: string;
  publicHint: string;
  copyPublicLink: string;
  publicLinkField: string;
  resetLink: string;
  resetLinkHint: string;
  expires: string;
  expiry: Record<ShareLinkExpiry, string>;
  stopSharing: string;
  copyLink: string;
  copied: string;
  done: string;
}

const defaultLabels: ShareDialogLabels = {
  title: "Share",
  invitePlaceholder: "Add people or teams…",
  inviteEmpty: "No people or teams found",
  inviteLevel: (level) => `Access for new people: ${level}`,
  notify: "Notify people",
  messagePlaceholder: "Add a message (optional)",
  cancel: "Cancel",
  share: "Share",
  peopleHeading: "People with access",
  you: "(you)",
  levelFor: (name, level) => `${name}'s access: ${level}`,
  generalHeading: "General access",
  everyoneIn: (space) => `Everyone in ${space}`,
  onlyInvited: "Only people invited",
  generalHint: (mode, space) =>
    mode === "space"
      ? `Members of ${space} can find and open it`
      : "Only people with access can open it",
  publicSection: "Public link",
  publicHeading: "Anyone with the link",
  publicOff: "Off",
  publicHint: "Anyone with the link can view, without signing in",
  copyPublicLink: "Copy public link",
  publicLinkField: "Public link",
  resetLink: "Reset link",
  resetLinkHint: "Reset link — the current link stops working",
  expires: "Expires",
  expiry: { never: "Never", "1d": "1 day", "7d": "7 days", "30d": "30 days" },
  stopSharing: "Stop sharing",
  copyLink: "Copy link",
  copied: "Copied",
  done: "Done",
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
  /** Sends an invite; the chips clear when it resolves. @default undefined */
  onInvite?: (invite: ShareInvite) => void | Promise<void>;
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
  /** Turns the public link on; return its URL and it is copied. @default undefined */
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
}

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
 * `ShareDialog` — share one item with people and teams, set who in its space can open it, and
 * turn its public link on or off.
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
}: ShareDialogProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const mobile = useIsMobile();

  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

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
  const inviteMode = canManage && invitees.length > 0;

  const resetInvite = () => {
    setInvitees([]);
    setMessage("");
    setNotify(true);
  };

  const sendInvite = async () => {
    if (!onInvite) return;
    setInviting(true);
    try {
      await onInvite({ invitees, level: inviteLevel, notify, message });
      resetInvite();
    } finally {
      setInviting(false);
    }
  };

  const createPublicLink = async () => {
    const url = await onCreatePublicLink?.();
    if (typeof url === "string") {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // The link is on either way; the field below now offers its own Copy.
      }
    }
  };

  const levelLabel = (value: string, options = levels) =>
    options.find((option) => option.value === value)?.label ?? value;

  const inviteRow =
    canManage && search ? (
      <PeopleInput
        value={invitees}
        onValueChange={setInvitees}
        search={search}
        placeholder={labels.invitePlaceholder}
        emptyText={labels.inviteEmpty}
        aria-label={labels.invitePlaceholder.replace(/…$/, "")}
        disabled={inviting}
      />
    ) : null;

  const inviteSection = (
    <div data-slot="share-invite" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={notify}
            onCheckedChange={(checked) => setNotify(checked === true)}
          />
          {labels.notify}
        </label>
        <PermissionMenu
          value={inviteLevel}
          options={levels}
          onValueChange={setInviteLevel}
          aria-label={labels.inviteLevel(levelLabel(inviteLevel))}
        />
      </div>
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
        <ul className="flex flex-col">
          {people.map((entry) => {
            const label = levelLabel(entry.level);
            return (
              <li
                key={entry.id}
                data-slot="share-person"
                className="flex min-w-0 items-center gap-2 py-1.5"
              >
                <PersonAvatar person={entry.person} size="default" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">
                    {entry.person.name}
                    {entry.you ? (
                      <span className="text-muted-foreground">
                        {" "}
                        {labels.you}
                      </span>
                    ) : null}
                  </span>
                  {entry.reason != null ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {entry.reason}
                    </span>
                  ) : null}
                </div>
                <PermissionMenu
                  value={entry.level}
                  options={levels}
                  readOnly={!canManage || entry.readOnly}
                  onValueChange={(level) => onLevelChange?.(entry.id, level)}
                  onRemove={onRemove ? () => onRemove(entry.id) : undefined}
                  aria-label={labels.levelFor(entry.person.name, label)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  const generalSection = generalAccess ? (
    <section data-slot="share-general" className="flex flex-col gap-2">
      <SectionHeading>{labels.generalHeading}</SectionHeading>
      <div className="flex min-w-0 items-center gap-2">
        <SpaceAvatar space={generalAccess.space} size="default" />
        <div className="flex min-w-0 flex-1 flex-col items-start">
          {canManage ? (
            <Select
              items={[
                {
                  value: "space",
                  label: labels.everyoneIn(generalAccess.space.name),
                },
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
                className="-ms-2.5 w-auto max-w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="space">
                  {labels.everyoneIn(generalAccess.space.name)}
                </SelectItem>
                <SelectItem value="invited">{labels.onlyInvited}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="truncate text-sm">
              {generalAccess.mode === "space"
                ? labels.everyoneIn(generalAccess.space.name)
                : labels.onlyInvited}
            </span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {labels.generalHint(generalAccess.mode, generalAccess.space.name)}
          </span>
        </div>
        {generalAccess.mode === "space" ? (
          <PermissionMenu
            value={generalAccess.level}
            options={generalLevels}
            readOnly={!canManage || generalLevelReadOnly}
            onValueChange={(level) =>
              onGeneralAccessChange?.({ mode: "space", level })
            }
            aria-label={labels.levelFor(
              labels.everyoneIn(generalAccess.space.name),
              levelLabel(generalAccess.level, generalLevels),
            )}
          />
        ) : null}
      </div>
    </section>
  ) : null;

  const publicSection = publicLinkAvailable ? (
    <section data-slot="share-public-link" className="flex flex-col gap-2">
      <SectionHeading>{labels.publicSection}</SectionHeading>
      <div className="flex min-w-0 items-center gap-2">
        <IconTile>
          <GlobeIcon />
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">{labels.publicHeading}</span>
          <span className="truncate text-xs text-muted-foreground">
            {publicLink ? labels.publicHint : labels.publicOff}
          </span>
        </div>
        {!publicLink && canManage ? (
          <Button
            variant="outline"
            size="sm"
            loading={publicLinkPending}
            onClick={createPublicLink}
          >
            {labels.copyPublicLink}
          </Button>
        ) : null}
      </div>
      {publicLink ? (
        <div className="flex flex-col gap-2">
          <InputGroup>
            <InputGroupInput
              readOnly
              value={publicLink.url}
              aria-label={labels.publicLinkField}
              onFocus={(event) => event.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <CopyButton
                value={publicLink.url}
                size="icon-xs"
                copyLabel={labels.copyPublicLink}
                copiedLabel={labels.copied}
              />
              {canManage ? (
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
              ) : null}
            </InputGroupAddon>
          </InputGroup>
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
                loading={publicLinkPending}
                onClick={() => onStopPublicLink?.()}
              >
                {labels.stopSharing}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  ) : null;

  const body = (
    <div data-slot="share-dialog-body" className="flex flex-col gap-4 pb-1">
      {inviteRow}
      {inviteMode ? (
        inviteSection
      ) : (
        <>
          {peopleSection}
          {generalSection}
          {publicSection}
          {footerNote ? (
            <p className="text-xs text-muted-foreground">{footerNote}</p>
          ) : null}
        </>
      )}
    </div>
  );

  const Close = mobile ? SheetClose : DialogClose;
  const footer = inviteMode ? (
    <>
      <Button variant="secondary" onClick={resetInvite} disabled={inviting}>
        {labels.cancel}
      </Button>
      <Button onClick={sendInvite} loading={inviting}>
        {labels.share}
      </Button>
    </>
  ) : (
    <>
      {linkUrl ? (
        <CopyButton
          value={linkUrl}
          showLabel
          variant="outline"
          size="default"
          copyLabel={labels.copyLink}
          copiedLabel={labels.copied}
          className="sm:me-auto"
        />
      ) : null}
      <Close render={<Button />}>{labels.done}</Close>
    </>
  );

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        {trigger ? <SheetTrigger render={trigger} /> : null}
        <SheetContent side="bottom" data-share-dialog="">
          <SheetHeader className="pb-0">
            <SheetTitle>{labels.title}</SheetTitle>
          </SheetHeader>
          <SheetBody>{body}</SheetBody>
          <SheetFooter className="pt-0 pb-[calc(var(--spacing)*4+env(safe-area-inset-bottom))] *:data-[slot=copy-button]:me-auto">
            {footer}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent data-share-dialog="">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <DialogBody>{body}</DialogBody>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
