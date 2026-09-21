"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wrapper } from "./wrapper";

export function searchInput(): ReactNode {
  const [value, setValue] = useState("Regent");

  return (
    <Wrapper>
      <SearchInput
        className="max-w-sm"
        value={value}
        onValueChange={setValue}
        aria-label="Search projects"
        placeholder="Search projects…"
      />
    </Wrapper>
  );
}

export function searchInputStates(): ReactNode {
  return (
    <Wrapper className="grid gap-4 sm:grid-cols-2">
      <SearchInput defaultValue="Active query" aria-label="Default search" />
      <SearchInput aria-label="Empty search" placeholder="Empty" />
      <SearchInput
        defaultValue="Locked query"
        aria-label="Disabled search"
        disabled
      />
      <SearchInput
        defaultValue="Fixed query"
        aria-label="Read-only search"
        readOnly
      />
      <SearchInput
        defaultValue="Invalid query"
        aria-label="Invalid search"
        aria-invalid="true"
      />
    </Wrapper>
  );
}

export function searchInputForm(): ReactNode {
  const [submitted, setSubmitted] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(String(new FormData(event.currentTarget).get("query") ?? ""));
  }

  return (
    <Wrapper>
      <form className="grid w-full max-w-sm gap-3" onSubmit={submit}>
        <Label htmlFor="docs-search-query">Query</Label>
        <SearchInput
          id="docs-search-query"
          name="query"
          defaultValue="Regent"
          aria-describedby="docs-search-help"
        />
        <p id="docs-search-help" className="text-sm text-muted-foreground">
          Clear or edit the native form value, then submit it.
        </p>
        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
        </div>
        {submitted ? <p className="text-sm">Submitted: {submitted}</p> : null}
      </form>
    </Wrapper>
  );
}
