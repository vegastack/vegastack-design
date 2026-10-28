// @vegastack aspect-ratio@0.25.96 sha256-zob/IYe6yuLztHW1ZTxkdZxEV/xaLwIYP/wnqy3mHvw=

import { cn } from "@vegastack/design";

function AspectRatio({
  ratio,
  className,
  ...props
}: React.ComponentProps<"div"> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          "--ratio": ratio,
        } as React.CSSProperties
      }
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  );
}

export { AspectRatio };
