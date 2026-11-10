"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { BrandLogo, type Brand } from "@/components/ui/brand-logo";

const BRANDS: { brand: Brand; name: string }[] = [
  { brand: "anthropic", name: "Anthropic" },
  { brand: "openai", name: "OpenAI" },
  { brand: "google", name: "Google" },
  { brand: "openrouter", name: "OpenRouter" },
  { brand: "claude", name: "Claude" },
  { brand: "claude-code", name: "Claude Code" },
  { brand: "chatgpt", name: "ChatGPT" },
  { brand: "codex", name: "Codex" },
  { brand: "cursor", name: "Cursor" },
  { brand: "copilot", name: "Copilot" },
  { brand: "gemini", name: "Gemini" },
  { brand: "slack", name: "Slack" },
  { brand: "gmail", name: "Gmail" },
  { brand: "mcp", name: "MCP" },
];

export function brandLogo(): ReactNode {
  return (
    <Wrapper>
      <span className="flex items-center gap-2 text-sm">
        <BrandLogo brand="anthropic" />
        Anthropic
      </span>
    </Wrapper>
  );
}

/** Every brand, beside its name: a Simple Icons mark, or the first letter where none is CC0. */
export function brandLogoBrands(): ReactNode {
  return (
    <Wrapper>
      <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        {BRANDS.map(({ brand, name }) => (
          <li key={brand} className="flex min-w-0 items-center gap-2">
            <BrandLogo brand={brand} />
            <span className="truncate">{name}</span>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

/** `default` is a 20px tile; `sm` a 16px one for dense rows. */
export function brandLogoSizes(): ReactNode {
  return (
    <Wrapper>
      <BrandLogo brand="slack" size="sm" label="Slack" />
      <BrandLogo brand="slack" label="Slack" />
      <BrandLogo brand="mcp" size="sm" label="MCP" />
      <BrandLogo brand="mcp" label="MCP" />
      <BrandLogo brand="openai" size="sm" label="OpenAI" />
      <BrandLogo brand="openai" label="OpenAI" />
    </Wrapper>
  );
}
