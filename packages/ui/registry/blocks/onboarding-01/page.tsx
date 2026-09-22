// @vegastack onboarding-01@0.11.0 sha256-3dtvKTN3sjSzgSGkKkFdXvS1c7KVVNR4Edzt9EHr16U=

import { ArrowRight, BookOpen, MessagesSquare } from "lucide-react";

import { GettingStarted } from "./components/getting-started";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const next = [
  {
    title: "Read the quickstart",
    description: "Ten minutes from an empty workspace to a running agent.",
    icon: BookOpen,
  },
  {
    title: "Talk to us",
    description: "A setup call with the team that builds Acme.",
    icon: MessagesSquare,
  },
];

/**
 * `onboarding-01` — the first-run starter page: the getting-started checklist beside two
 * what-is-next cards.
 *
 * @example
 * // app/welcome/page.tsx, straight after `shadcn add @vegastack/onboarding-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome to Acme</h1>
        <p className="text-sm text-muted-foreground">
          Five short steps and your workspace is doing real work.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <GettingStarted />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          {next.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="size-5 text-muted-foreground" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Open
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
