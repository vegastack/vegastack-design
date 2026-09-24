// @vegastack command-search-01@0.20.0 sha256-wlflkcS11d3GdasYSIv7MdSu8gd1YkSlV2AfhGS51zs=

/**
 * A stand-in for the host's search API: an in-memory index, a short delay, and the abort signal
 * honoured. Replace `sampleSearch` with your own call.
 */

import type { SearchResult } from "./command-search";

/** Everything the sample can find. */
export const INDEX: SearchResult[] = [
  {
    id: "m12",
    type: "meeting",
    title: "Weekly sync with Skyline",
    description: "Meeting · Skyline Hotels · 3 Sep",
    href: "/meetings/m12",
  },
  {
    id: "m9",
    type: "meeting",
    title: "Skyline lighting walkthrough",
    description: "Meeting · Skyline Hotels · 28 Aug",
    href: "/meetings/m9",
  },
  {
    id: "t41",
    type: "task",
    title: "Confirm the support hiring budget",
    description: "Task · Raj Patel · due Friday",
    href: "/tasks/t41",
  },
  {
    id: "t39",
    type: "task",
    title: "Send Skyline the regional numbers",
    description: "Task · Raj Patel · due today",
    href: "/tasks/t39",
  },
  {
    id: "p7",
    type: "product",
    title: "Skyline pendant",
    description: "Product · Lighting · SKY-240",
    href: "/products/p7",
  },
  {
    id: "c1",
    type: "customer",
    title: "Skyline Hotels",
    description: "Customer · Austin · 6 projects",
    href: "/customers/c1",
  },
  {
    id: "pg-settings",
    type: "page",
    title: "Settings",
    description: "Page",
    href: "/settings",
  },
];

const SCOPE_TYPES: Record<string, SearchResult["type"] | undefined> = {
  meetings: "meeting",
  tasks: "task",
  products: "product",
  customers: "customer",
  pages: "page",
};

/** Recently opened results, shown while the query is empty. */
export const RECENTS: SearchResult[] = INDEX.filter((r) =>
  ["m12", "t41"].includes(r.id),
);

/** The sample search: matches titles, scoped by type. */
export function sampleSearch(
  query: string,
  scope: string,
  signal: AbortSignal,
): Promise<SearchResult[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const needle = query.toLowerCase();
      const type = SCOPE_TYPES[scope];
      resolve(
        INDEX.filter(
          (r) =>
            (!type || r.type === type) &&
            r.title.toLowerCase().includes(needle),
        ),
      );
    }, 250);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
