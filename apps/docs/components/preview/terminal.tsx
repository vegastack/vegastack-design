"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Terminal } from "@/components/ui/terminal";

export function terminal(): ReactNode {
  return (
    <Wrapper className="p-0">
      <div className="w-full max-w-md p-6">
        <Terminal
          title="Install"
          lines={[
            "pnpm dlx shadcn@latest add @vegastack/button",
            { output: "✓ Installed 1 component" },
          ]}
        />
      </div>
    </Wrapper>
  );
}

export function terminalMultiline(): ReactNode {
  return (
    <Wrapper className="p-0">
      <div className="w-full max-w-md p-6">
        <Terminal
          title="Setup"
          prompt=">"
          lines={[
            "pnpm install",
            "pnpm run tokens:build",
            { output: "✓ tokens built: dist/theme.css" },
            "pnpm run registry:build",
          ]}
        />
      </div>
    </Wrapper>
  );
}
