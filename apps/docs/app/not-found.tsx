import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center px-6 py-20">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6">
        <p className="font-mono text-mono-label text-muted-foreground">
          404 / Not found
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-display-md text-foreground sm:text-display-lg">
            This page moved.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            The address does not match a current design-system page. Return to
            the catalog or open the documentation index.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/docs" />}>
            Browse documentation
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Return home
          </Button>
        </div>
      </div>
    </main>
  );
}
