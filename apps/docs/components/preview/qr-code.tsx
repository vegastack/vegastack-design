"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { QrCode } from "@/components/ui/qr-code";

const URL = "https://app.example.com/meetings/42/record";

export function qrCode(): ReactNode {
  return (
    <Wrapper>
      <QrCode value={URL} label="Open this meeting on your phone" />
    </Wrapper>
  );
}

/** Size comes from a `size-*` class; the drawing scales with the box. */
export function qrCodeSizes(): ReactNode {
  return (
    <Wrapper>
      <QrCode value={URL} label="Small code" className="size-24" />
      <QrCode value={URL} label="Default code" />
      <QrCode value={URL} label="Large code" className="size-56" />
    </Wrapper>
  );
}

/** A higher level survives more damage and draws more, smaller modules for the same value. */
export function qrCodeErrorCorrection(): ReactNode {
  return (
    <Wrapper>
      <QrCode value={URL} label="Error correction L" errorCorrection="L" />
      <QrCode value={URL} label="Error correction M" />
      <QrCode value={URL} label="Error correction H" errorCorrection="H" />
    </Wrapper>
  );
}

/** An empty value, or one too long to encode, draws the empty tile and keeps its name. */
export function qrCodeEmpty(): ReactNode {
  return (
    <Wrapper>
      <QrCode value="" label="Recording link not ready yet" />
    </Wrapper>
  );
}
