// @vegastack accent@0.138.0 sha256-cUZFc7NhaftpUPiRqwAmoqUzIqvb8b5rMIQB3Cyjh3Q=

import * as React from "react";
import { Inbox, ListTodo } from "lucide-react";
import { cn, proseClassName } from "@vegastack/design";
import type { AccentId } from "@vegastack/design-tokens/accents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NavTree, NavTreeItem, NavTreeSection } from "@/components/ui/nav-tree";
import { NotificationDot } from "@/components/ui/notification-dot";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusIcon } from "@/components/ui/status-icon";
import { Switch } from "@/components/ui/switch";

/** The words in `AccentPreview`, for translation. */
export interface AccentPreviewLabels {
  tasks: string;
  newTask: string;
  taskDone: string;
  taskOpen: string;
  myTasks: string;
  inbox: string;
  linkBefore: string;
  link: string;
  badge: string;
  notify: string;
  choice: string;
  otherChoice: string;
  cancel: string;
  save: string;
  same: string;
  overdue: string;
  inProgress: string;
  done: string;
  remove: string;
  retry: string;
}

const LABELS: AccentPreviewLabels = {
  tasks: "My tasks",
  newTask: "New task",
  taskDone: "Pick two rug options",
  taskOpen: "Update the product sheet",
  myTasks: "My tasks",
  inbox: "Inbox",
  linkBefore: "Priya shared the",
  link: "lighting plan",
  badge: "New",
  notify: "Notify the team",
  choice: "Everyone in Design",
  otherChoice: "Only me",
  cancel: "Cancel",
  save: "Save",
  same: "Stays the same with every colour",
  overdue: "Overdue",
  inProgress: "In progress",
  done: "Done",
  remove: "Delete",
  retry: "Retry",
};

/** Props accepted by `AccentPreview`. */
export interface AccentPreviewProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The accent it is drawn in, whatever the page wears. Left out, it wears the page's. @default undefined */
  accent?: AccentId;
  /** Other words, for translation. @default undefined */
  labels?: Partial<AccentPreviewLabels>;
}

const CARD =
  "flex min-w-0 flex-col gap-3 rounded-card border border-border bg-background p-4 text-sm";
const ROW = "flex min-w-0 items-center gap-2";

/**
 * `AccentPreview` — what a colour changes and what it never does, drawn with the real components.
 * It is a picture: nothing in it takes the pointer or the keyboard, and assistive technology skips it.
 *
 * @example
 * <AccentPreview accent={own ?? workspace.accent} />
 */
export function AccentPreview({
  accent,
  labels,
  className,
  ...props
}: AccentPreviewProps) {
  const words = { ...LABELS, ...labels };
  return (
    <div
      {...props}
      data-slot="accent-preview"
      data-accent={accent}
      aria-hidden="true"
      inert
      className={cn("@container/accent-preview w-full select-none", className)}
    >
      <div className="grid gap-3 @min-[34rem]/accent-preview:grid-cols-2 @min-[68rem]/accent-preview:grid-cols-4">
        <div className={CARD}>
          <div className={cn(ROW, "justify-between")}>
            <span className="font-medium">{words.tasks}</span>
            <Button size="sm">{words.newTask}</Button>
          </div>
          <div className={ROW}>
            <Checkbox checked readOnly />
            {words.taskDone}
          </div>
          <div className={ROW}>
            <Checkbox checked={false} readOnly />
            {words.taskOpen}
          </div>
        </div>
        <div className={CARD}>
          <NavTree aria-label={words.tasks}>
            <NavTreeSection>
              <NavTreeItem icon={<ListTodo />} label={words.myTasks} active />
              <NavTreeItem
                icon={<Inbox />}
                label={
                  <span className={ROW}>
                    {words.inbox}
                    <NotificationDot />
                  </span>
                }
              />
            </NavTreeSection>
          </NavTree>
          <div className={cn(ROW, "flex-wrap justify-between")}>
            <span className={proseClassName}>
              {words.linkBefore} <a href="#accent-preview">{words.link}</a>
            </span>
            <Badge>{words.badge}</Badge>
          </div>
        </div>
        <div className={CARD}>
          <div className={ROW}>
            <Switch checked readOnly />
            {words.notify}
          </div>
          <RadioGroup value="all" readOnly className="gap-2">
            <div className={ROW}>
              <RadioGroupItem value="all" />
              {words.choice}
            </div>
            <div className={ROW}>
              <RadioGroupItem value="me" />
              {words.otherChoice}
            </div>
          </RadioGroup>
          <div className={ROW}>
            <Button size="sm" variant="outline">
              {words.cancel}
            </Button>
            <Button size="sm">{words.save}</Button>
          </div>
        </div>
        <div className={CARD}>
          <span className="text-xs text-muted-foreground">{words.same}</span>
          <div className={cn(ROW, "flex-wrap gap-x-3")}>
            <span className="text-destructive-text">{words.overdue}</span>
            <span className="flex items-center gap-1.5">
              <StatusIcon status="progress" label="" />
              {words.inProgress}
            </span>
            <span className="flex items-center gap-1.5">
              <StatusIcon status="done" label="" />
              {words.done}
            </span>
          </div>
          <div className={ROW}>
            <Button size="sm" variant="destructive">
              {words.remove}
            </Button>
            <Button size="sm" variant="outline">
              {words.retry}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
