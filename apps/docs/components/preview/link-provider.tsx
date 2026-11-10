"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AppLink, LinkProvider } from "@/components/ui/link-provider";
import { MarkdownView } from "@/components/ui/markdown-view";

const ORIGIN = "https://app.example.com";

// A stand-in router: the preview shows where a plain click went, in place, without leaving the page.
export function linkProviderDemo(): ReactNode {
  return <LinkProviderDemo />;
}

function LinkProviderDemo() {
  const [path, setPath] = useState("/home");
  return (
    <Wrapper>
      <LinkProvider navigate={setPath} origin={ORIGIN}>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Showing <code>{path}</code>
          </p>
          <p>
            Open <AppLink href="/tasks/42">a task</AppLink>,{" "}
            <AppLink href={`${ORIGIN}/library/7`}>
              a table by its full address
            </AppLink>{" "}
            or <AppLink href="https://example.org">another site</AppLink>.
          </p>
          <MarkdownView untrusted showLinkDomains>
            {`An agent's answer: [the quote](${ORIGIN}/customers/3) and [a datasheet](https://example.org/spec).`}
          </MarkdownView>
        </div>
      </LinkProvider>
    </Wrapper>
  );
}
