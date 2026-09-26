// @vegastack list-page-01@0.23.39 sha256-bQBhmeTHaL5lpENbTbitTiBAnX5DUkMM9x6YvCLT1YQ=

import { Plus } from "lucide-react";

import { CustomerList } from "./components/customer-list";
import { AppShellPage } from "@/components/ui/app-shell";
import { buttonVariants } from "@/components/ui/button";

/**
 * `list-page-01` — the list page reference: `CustomerList` — a `PageHeader` h1 with its create link,
 * the Mine | Team tabs and the Grid | List toggle under the title — over a list that filters, pages and switches between a table and a grid of the same records.
 *
 * Server-safe: the interactive half is the client leaf it imports. Replace the sample customers
 * with your API, and each href with your routes.
 *
 * @example
 * // app/customers/page.tsx, straight after `shadcn add @vegastack/list-page-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <AppShellPage>
      <CustomerList
        actions={
          <a href="/customers/new" className={buttonVariants()}>
            <Plus />
            New customer
          </a>
        }
      />
    </AppShellPage>
  );
}
