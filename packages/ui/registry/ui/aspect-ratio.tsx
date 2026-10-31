// @vegastack aspect-ratio@0.27.0 sha256-voV4m1n9/AUxkv8fPyC8DHt24rNXDQKNXIZwSs61y7c=

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
