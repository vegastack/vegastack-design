// @vegastack aspect-ratio@0.23.57 sha256-nXSVapKhxRfP3JuJ2m9Uxbkyq+ezBGjV7ZxlphXr5V8=

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
