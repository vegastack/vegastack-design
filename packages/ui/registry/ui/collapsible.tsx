// @vegastack collapsible@0.24.5 sha256-LCRPSnRyVHiXqY2rEBOXbCRZ+64T8lsM5qgGjb/3BSA=

"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
