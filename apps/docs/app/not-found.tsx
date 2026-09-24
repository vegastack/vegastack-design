import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center px-6 py-20">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6">
        <p className="font-sans text-xs text-muted-foreground">
          404 / Not found
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl text-foreground sm:text-6xl">
            This page moved.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            The address does not match a current design-system page. Return to
            the catalog or open the documentation index.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/docs" className={buttonVariants({ size: "lg" })}>
            Browse documentation
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
