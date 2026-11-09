// @vegastack aspect-ratio@0.60.0 sha256-CA7K/QjWxijnRBqs3EsLJOSy9AuV4ZJY3uEAuJiA0IU=

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
