"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/toggle-group` (dogfoods the registry).
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function toggleGroup(): ReactNode {
  return (
    <Wrapper>
      <ToggleGroup variant="outline" multiple>
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupComposition(): ReactNode {
  return (
    <Wrapper>
      <ToggleGroup variant="outline" defaultValue={["a"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupOutline(): ReactNode {
  return (
    <Wrapper>
      <ToggleGroup variant="outline" defaultValue={["all"]}>
        <ToggleGroupItem value="all" aria-label="Toggle all">
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="missed" aria-label="Toggle missed">
          Missed
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupSize(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <ToggleGroup size="sm" defaultValue={["top"]} variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup defaultValue={["top"]} variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup size="lg" defaultValue={["top"]} variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupSpacing(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <ToggleGroup
        size="sm"
        defaultValue={["top"]}
        variant="outline"
        spacing={2}
      >
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        size="sm"
        defaultValue={["top"]}
        variant="outline"
        spacing={0}
      >
        <ToggleGroupItem value="top" aria-label="Toggle top joined">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom joined">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left joined">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right joined">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupVertical(): ReactNode {
  return (
    <Wrapper>
      <ToggleGroup
        multiple
        orientation="vertical"
        spacing={1}
        defaultValue={["bold", "italic"]}
      >
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupDisabled(): ReactNode {
  return (
    <Wrapper>
      <ToggleGroup disabled>
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupCustom(): ReactNode {
  return <FontWeightSelector />;
}

/**
 * Upstream's Custom example is a `Field`-wrapped font-weight selector. The `field` component is
 * not part of this reset batch, so the label and description are plain markup here; the toggle
 * group — controlled `value`, `spacing`, `size` and per-item `className` — is upstream's.
 */
function FontWeightSelector(): ReactNode {
  const [fontWeight, setFontWeight] = React.useState("normal");

  return (
    <Wrapper className="flex-col items-start gap-3">
      <span className="text-sm font-medium" id="toggle-group-font-weight">
        Font Weight
      </span>
      <ToggleGroup
        aria-labelledby="toggle-group-font-weight"
        value={[fontWeight]}
        onValueChange={(value) => setFontWeight(value[0] ?? fontWeight)}
        variant="outline"
        spacing={2}
        size="lg"
      >
        <ToggleGroupItem
          value="light"
          aria-label="Light"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-light">Aa</span>
          <span className="text-xs text-muted-foreground">Light</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="normal"
          aria-label="Normal"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-normal">Aa</span>
          <span className="text-xs text-muted-foreground">Normal</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="medium"
          aria-label="Medium"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-medium">Aa</span>
          <span className="text-xs text-muted-foreground">Medium</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="bold"
          aria-label="Bold"
          className="flex size-16 flex-col items-center justify-center rounded-xl"
        >
          <span className="text-2xl leading-none font-bold">Aa</span>
          <span className="text-xs text-muted-foreground">Bold</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        Use{" "}
        <code className="rounded-md bg-muted px-1 py-0.5 font-mono">
          font-{fontWeight}
        </code>{" "}
        to set the font weight.
      </p>
    </Wrapper>
  );
}

export function toggleGroupRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex flex-wrap justify-center gap-2" dir="ltr">
        <ToggleGroup variant="outline" defaultValue={["list"]}>
          <ToggleGroupItem value="list" aria-label="List">
            List
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid">
            Grid
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Cards">
            Cards
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex flex-wrap justify-center gap-2" dir="rtl">
        <ToggleGroup variant="outline" defaultValue={["list"]}>
          <ToggleGroupItem value="list" aria-label="قائمة">
            قائمة
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="شبكة">
            شبكة
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="بطاقات">
            بطاقات
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </Wrapper>
  );
}
