// @vegastack shell-01@0.136.8 sha256-dpKcMd1EH3AlHnPA/L7cAYMWCdtrf1BxWsDDWSKffu4=

/** A task row for the `shell-01` reference page. */
export interface Task {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  assignee: string;
  due: string;
  space: string;
  note: string;
}

/** Sample tasks: replace with your own list. */
export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Send the Q3 pricing review to finance",
    status: "doing",
    assignee: "Manoj Kumar",
    due: "Today",
    space: "General",
    note: "Finance asked for the regional split before Thursday's call.",
  },
  {
    id: "t2",
    title: "Confirm the venue for the launch event",
    status: "todo",
    assignee: "Asha Chen",
    due: "Tomorrow",
    space: "Launch plan",
    note: "Two venues hold the date; the second one needs a deposit by Friday.",
  },
  {
    id: "t3",
    title: "Review the shell layout prototype",
    status: "todo",
    assignee: "Ravi Shah",
    due: "Fri",
    space: "Design",
    note: "Check the peek at 1024 and 820 wide, and the phone sheet in Safari.",
  },
  {
    id: "t4",
    title: "Update the onboarding checklist",
    status: "done",
    assignee: "Manoj Kumar",
    due: "Mon",
    space: "General",
    note: "Added the desktop app download and the workspace invite step.",
  },
  {
    id: "t5",
    title: "Draft the customer email for the price change",
    status: "todo",
    assignee: "Asha Chen",
    due: "18 Nov",
    space: "Pricing review",
    note: "Keep it short: what changes, when, and who to ask.",
  },
  {
    id: "t6",
    title: "Archive last quarter's meeting notes",
    status: "done",
    assignee: "Ravi Shah",
    due: "12 Nov",
    space: "General",
    note: "Moved to Library › Archive › Q2.",
  },
];
