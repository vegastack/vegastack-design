"use client";

import type { ReactNode } from "react";
import { Lamp } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Thumbnail } from "@/components/ui/thumbnail";

const IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='%23d6d3d1'/><circle cx='2' cy='1.5' r='0.8' fill='%23a8a29e'/></svg>";

export function thumbnail(): ReactNode {
  return (
    <Wrapper>
      <Thumbnail src={IMG} alt="Aurora Downlight" />
      <Thumbnail alt="" fallback={<Lamp aria-hidden />} />
    </Wrapper>
  );
}

export function thumbnailSizes(): ReactNode {
  return (
    <Wrapper>
      <Thumbnail src={IMG} alt="" size="sm" />
      <Thumbnail src={IMG} alt="" />
      <Thumbnail alt="" size="sm" fallback={<Lamp aria-hidden />} />
      <Thumbnail alt="" fallback={<Lamp aria-hidden />} />
    </Wrapper>
  );
}

export function thumbnailFallback(): ReactNode {
  return (
    <Wrapper>
      <Thumbnail src="/does-not-exist.png" alt="" />
      <Thumbnail alt="" />
    </Wrapper>
  );
}
