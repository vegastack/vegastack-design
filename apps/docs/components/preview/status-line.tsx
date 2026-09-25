"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/ui/status-line";

export function statusLine(): ReactNode {
  return (
    <Wrapper className="flex flex-col items-start gap-3">
      <StatusLine status="progress">
        Transcribing… updates on its own
      </StatusLine>
      <StatusLine status="info">
        Notes were edited, so they are not regenerated automatically.
      </StatusLine>
      <StatusLine
        status="error"
        action={
          <>
            <Button size="xs" variant="outline">
              Retry
            </Button>
            <Button size="xs" variant="ghost">
              Regenerate
            </Button>
          </>
        }
      >
        Transcription failed: the recording has no audio.
      </StatusLine>
    </Wrapper>
  );
}
