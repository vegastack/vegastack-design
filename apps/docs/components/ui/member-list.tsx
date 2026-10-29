// @vegastack member-list@0.25.104 sha256-KQmqlS3L/7rxOram5HbYs1CsN9ZDDZaEF2fkMDKYbcg=

"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PermissionMenu,
  type PermissionMenuOption,
} from "@/components/ui/permission-menu";
import {
  PersonAvatar,
  personDisplayName,
  type Person,
} from "@/components/ui/person-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------------------------------------
 * MemberList — the ONE "people in X" list: a team's members, a space's members, who an item is
 * shared with, an invite list. An optional add row on top (a picker · an optional role · Add),
 * then 36px rows — avatar · name over a muted sub line ("2 people", "Creator") · the role as a
 * chip menu or plain text · a ⋯ menu with Remove — that scroll inside the list after `maxRows`.
 *
 * Data-agnostic: rows, roles and labels come in through props and every change goes out through
 * a callback. A client module: every row hands its menus a handler of its own.
 * ----------------------------------------------------------------------------------------------*/

/** One row of a `MemberList`. */
export interface MemberListMember {
  /** A stable id — the person's or the team's. */
  id: string;
  /** The person, team (`kind: "team"`) or agent. */
  person: Person;
  /** The muted sub line under the name — "2 people" for a team, "Creator", "via Sales team". @default undefined */
  description?: React.ReactNode;
  /** Their role — one of the list's `roles`, or plain text when the list has none. @default undefined */
  role?: string;
  /** Show this row's role as text, with no menu, even for a manager. @default false */
  roleReadOnly?: boolean;
  /**
   * A built-in row (the creator, an owner): the role shows with a lock and `lockedReason` in a
   * tooltip, and the row has no ⋯ menu. @default false
   */
  locked?: boolean;
  /** Why a `locked` row cannot change, in its tooltip — "Set by role: Creator". @default undefined */
  lockedReason?: React.ReactNode;
  /** This row is the viewer: "(you)" follows the name. @default false */
  you?: boolean;
  /** Offer Remove on this row (when the list has `onRemove`). @default true */
  removable?: boolean;
}

/** Every string a `MemberList` renders. */
export interface MemberListLabels {
  /** The list's accessible name. */
  list: string;
  /** After the viewer's own name. */
  you: string;
  /** A role menu's accessible name, with the visible role in it. */
  roleFor: (name: string, role: string) => string;
  /** A row's ⋯ button. */
  more: (name: string) => string;
  /** The ⋯ menu's remove item. */
  remove: string;
  /** Shown when there are no rows (and no `empty` node). */
  empty: string;
}

const defaultLabels: MemberListLabels = {
  list: "Members",
  you: "(you)",
  roleFor: (name, role) => `${name}'s role: ${role}`,
  more: (name) => `More for ${name}`,
  remove: "Remove",
  empty: "No members yet",
};

/** Props accepted by `MemberList`. */
export interface MemberListProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The rows, in order. */
  members: readonly MemberListMember[];
  /**
   * The roles a row can have, most access first. With them each row's role is a chip menu;
   * without them a row's `role` is plain text. @default undefined
   */
  roles?: readonly PermissionMenuOption[];
  /** Changes one row's role; without it every role reads as text. @default undefined */
  onRoleChange?: (id: string, role: string) => void;
  /** Removes one row; adds Remove to its ⋯ menu. @default undefined */
  onRemove?: (id: string) => void;
  /**
   * More items for a row's ⋯ menu, above Remove — `DropdownMenuItem`s ("Resend invite").
   * @default undefined
   */
  menuItems?: (member: MemberListMember) => React.ReactNode;
  /**
   * The viewer may change the list: role menus and ⋯ menus show. Without it, roles are text and
   * there are no menus. @default true
   */
  canManage?: boolean;
  /** The add row above the list — a `MemberListAdd`. @default undefined */
  add?: React.ReactNode;
  /** Rows are loading: skeleton rows show. @default false */
  loading?: boolean;
  /** What shows with no rows; `null` shows nothing. @default labels.empty, muted */
  empty?: React.ReactNode;
  /** Rows shown before the list scrolls inside itself. @default 8 */
  maxRows?: number;
  /** Override any rendered string. @default {} */
  labels?: Partial<MemberListLabels>;
}

/** A row is 36px (`h-9`); the scroll cap is a whole number of rows. */
const ROW_HEIGHT_SPACING = 9;

/**
 * `MemberList` — who is in a team, a space or an item's share list, with a role and Remove per
 * row. 36px rows (avatar · name over a muted sub line · role chip menu or text · ⋯
 * menu); a long list scrolls inside itself after `maxRows`. Built-in rows are `locked`: the role
 * shows with a lock and a reason, and there is no ⋯. The ⋯ column keeps its width on every row,
 * so the role chips line up.
 *
 * @example
 * <MemberList
 *   add={<MemberListAdd picker={<PeoplePicker … />} roles={ROLES} role={role} onRoleChange={setRole} onAdd={add} />}
 *   members={[
 *     { id: "u1", person: { name: "Manoj Kumar" }, role: "full", you: true },
 *     { id: "t1", person: { name: "Product team", kind: "team" }, description: "2 people", role: "edit" },
 *   ]}
 *   roles={ROLES}
 *   onRoleChange={setRole}
 *   onRemove={remove}
 * />
 */
export function MemberList({
  members,
  roles,
  onRoleChange,
  onRemove,
  menuItems,
  canManage = true,
  add,
  loading = false,
  empty,
  maxRows = 8,
  labels: labelsProp,
  className,
  ref,
  ...props
}: MemberListProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const hasMenu =
    canManage && (onRemove !== undefined || menuItems !== undefined);
  const scrolls = members.length > maxRows;
  const roleLabel = (value: string) =>
    roles?.find((option) => option.value === value)?.label ?? value;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <ul
        aria-busy
        aria-label={labels.list}
        data-slot="member-list-rows"
        className="flex flex-col"
      >
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex h-9 items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className={i === 1 ? "h-3 w-24" : "h-3 w-32"} />
          </li>
        ))}
      </ul>
    );
  } else if (members.length === 0) {
    body =
      empty === null ? null : (
        <div
          data-slot="member-list-empty"
          className="py-2 text-sm text-muted-foreground"
        >
          {empty ?? labels.empty}
        </div>
      );
  } else {
    const rows = (
      <ul
        aria-label={labels.list}
        data-slot="member-list-rows"
        className={cn("flex flex-col", scrolls && "pe-3")}
      >
        {members.map((member) => {
          const name = personDisplayName(member.person);
          const locked = canManage && member.locked === true;
          const removable =
            onRemove !== undefined && member.removable !== false && !locked;
          const showMenu =
            hasMenu && !locked && (removable || menuItems !== undefined);
          const extra = showMenu ? menuItems?.(member) : null;
          return (
            <li
              key={member.id}
              data-slot="member-list-row"
              className="flex h-9 min-w-0 items-center gap-2"
            >
              <PersonAvatar person={member.person} size="sm" />
              {/* Name over its sub line: 20px + 16px fill the 36px row exactly. */}
              <span
                data-slot="member-list-name"
                className="flex min-w-0 flex-1 flex-col"
              >
                <span className="truncate text-sm">
                  {name}
                  {member.you ? (
                    <span className="text-muted-foreground"> {labels.you}</span>
                  ) : null}
                </span>
                {member.description != null ? (
                  <span
                    data-slot="member-list-description"
                    className="truncate text-xs text-muted-foreground"
                  >
                    {member.description}
                  </span>
                ) : null}
              </span>
              {member.role !== undefined ? (
                roles ? (
                  <PermissionMenu
                    variant="chip"
                    value={member.role}
                    options={roles}
                    // No handler, no menu: a role that cannot change reads as text.
                    readOnly={
                      !canManage ||
                      member.roleReadOnly === true ||
                      onRoleChange === undefined
                    }
                    locked={locked}
                    lockedReason={member.lockedReason}
                    onValueChange={(role) => onRoleChange?.(member.id, role)}
                    aria-label={labels.roleFor(name, roleLabel(member.role))}
                  />
                ) : (
                  <span
                    data-slot="member-list-role"
                    className="shrink-0 px-2 text-sm text-muted-foreground"
                  >
                    {member.role}
                  </span>
                )
              ) : null}
              {showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        data-slot="member-list-more"
                        aria-label={labels.more(name)}
                        className="text-muted-foreground"
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {extra}
                    {extra && removable ? <DropdownMenuSeparator /> : null}
                    {removable ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onRemove?.(member.id)}
                      >
                        {labels.remove}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : hasMenu ? (
                // Keeps the ⋯ column on a row without a menu, so every role chip lines up.
                <span
                  aria-hidden
                  data-slot="member-list-more-spacer"
                  className="size-7 shrink-0"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    );
    body = scrolls ? (
      <ScrollArea
        data-slot="member-list-scroll"
        className="flex flex-col"
        style={{
          maxHeight: `calc(var(--spacing) * ${ROW_HEIGHT_SPACING * maxRows})`,
        }}
      >
        {rows}
      </ScrollArea>
    ) : (
      rows
    );
  }

  return (
    <div
      ref={ref}
      data-slot="member-list"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      {add}
      {body}
    </div>
  );
}

/** Props accepted by `MemberListAdd`. */
export interface MemberListAddProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The picker that chooses who to add — a `PeoplePicker`, say. It fills the row. */
  picker: React.ReactNode;
  /** The roles the new members can get. Omit for no role control. @default undefined */
  roles?: readonly PermissionMenuOption[];
  /** The role the new members get — one of `roles`. @default the last of `roles` */
  role?: string;
  /** Changes the role for the new members; without it the role reads as text. @default undefined */
  onRoleChange?: (role: string) => void;
  /** Adds the chosen people. @default undefined */
  onAdd?: () => void;
  /** An add is in flight: Add spins, and the role control waits. @default false */
  adding?: boolean;
  /** Nothing to add yet (no one chosen): Add is disabled. @default false */
  disabled?: boolean;
  /** The Add button's text. @default "Add" */
  addLabel?: string;
  /** The role control's accessible name, with the visible role in it. @default (role) => `Role for new members: ${role}` */
  roleLabel?: (role: string) => string;
}

/**
 * `MemberListAdd` — the add row above a `MemberList`: the picker, an optional role for the new
 * members (a bordered menu that lines up with the picker), and Add. It follows its own width
 * (`@container/member-list-add`): narrower than 28rem, the role and Add go under the picker.
 *
 * @example
 * <MemberListAdd
 *   picker={<PeoplePicker multiple value={chosen} onValueChange={setChosen} search={search} />}
 *   roles={ROLES}
 *   role={role}
 *   onRoleChange={setRole}
 *   onAdd={add}
 *   disabled={chosen.length === 0}
 * />
 */
export function MemberListAdd({
  picker,
  roles,
  role,
  onRoleChange,
  onAdd,
  adding = false,
  disabled = false,
  addLabel = "Add",
  roleLabel = (label) => `Role for new members: ${label}`,
  className,
  ref,
  ...props
}: MemberListAddProps) {
  const value = role ?? roles?.at(-1)?.value ?? "";
  const label = roles?.find((option) => option.value === value)?.label ?? value;
  return (
    <div
      ref={ref}
      data-slot="member-list-add"
      className={cn("@container/member-list-add min-w-0", className)}
      {...props}
    >
      <div className="flex flex-col gap-2 @md/member-list-add:flex-row @md/member-list-add:items-start">
        <div data-slot="member-list-add-picker" className="min-w-0 flex-1">
          {picker}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {roles ? (
            <PermissionMenu
              variant="outline"
              value={value}
              options={roles}
              readOnly={onRoleChange === undefined}
              onValueChange={onRoleChange}
              disabled={adding}
              aria-label={roleLabel(label)}
              className="flex-1 @md/member-list-add:flex-none"
            />
          ) : null}
          <Button
            data-slot="member-list-add-button"
            onClick={onAdd}
            loading={adding}
            disabled={disabled}
          >
            {addLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
