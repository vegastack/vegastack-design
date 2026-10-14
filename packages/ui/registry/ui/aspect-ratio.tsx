// @vegastack aspect-ratio@0.25.39 sha256-fFZvZAW0/I/RJgHLvmAc3PANLCac7gyFAYvYYhz+/Gw=

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
