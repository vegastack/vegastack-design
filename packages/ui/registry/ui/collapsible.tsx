// @vegastack collapsible@0.111.0 sha256-o1YbeESTrVrS+vuGTcfc+lwgVbIcaqRgmt278c8q+Ak=

"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "@vegastack/design";

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}

function CollapsibleContent({
  className,
  children,
  ...props
}: Omit<CollapsiblePrimitive.Panel.Props, "className"> & {
  className?: string;
}) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className="h-(--collapsible-panel-height) w-full min-w-0 overflow-hidden transition-[height,opacity] duration-state ease-enter data-ending-style:h-0 data-ending-style:opacity-0 data-ending-style:duration-state-exit data-ending-style:ease-exit data-starting-style:h-0 data-starting-style:opacity-0"
      {...props}
    >
      <div data-slot="collapsible-content-body" className={cn(className)}>
        {children}
      </div>
    </CollapsiblePrimitive.Panel>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
