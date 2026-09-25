// @vegastack list-page-01@0.23.11 sha256-JWjhEJqt1a9HeCqwWdI36Jx74/gYA/VyJRJ/XyT5w7k=

import { Plus } from "lucide-react";

import { CustomerList } from "./components/customer-list";
import { AppShellPage } from "@/components/ui/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/**
 * `list-page-01` — the list page reference: a `PageHeader` h1 with its create link over
 * `CustomerList`, which filters, pages and switches between a table and a grid of the same records.
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
      <PageHeader
        title="Customers"
        description="Everyone you sell to, with their projects and status."
        actions={
          <a href="/customers/new" className={buttonVariants()}>
            <Plus />
            New customer
          </a>
        }
      />
      <CustomerList />
    </AppShellPage>
  );
}
