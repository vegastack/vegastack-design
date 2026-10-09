// @vegastack email-kit@0.25.1 sha256-U1pG9YwMMJZ/xKMm1Ryfc5aot0u3tWLeWaRbSbMP658=

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { Lexer, type Token, type Tokens } from "marked";
import { Heading, Hr, Link, Section, Text } from "react-email";
import { emailColors, emailFontFamily } from "./email-tokens";

/**
 * Markdown (CommonMark + GFM) as email-safe React: the same reading styles the
 * in-app notes use (`MarkdownView`'s prose — heading scale, lists, bold, task
 * checkboxes, quotes, code), with inline styles and the kit's `vs-*` dark-mode
 * hooks. Never injects HTML: raw HTML and images are dropped, mention links
 * (`mention://…`) read as their bold label, and only http(s) or in-app links stay links.
 * Relative imports only, so a worker can render it.
 *
 * @example
 * <EmailMarkdown markdown={notes.summary} appUrl="https://app.example.com" />
 */

const c = emailColors.light;
const font = emailFontFamily;
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const body: CSSProperties = {
  color: c.text,
  fontFamily: font,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const HEADING: Record<number, CSSProperties> = {
  1: { fontSize: "20px", lineHeight: "28px", margin: "24px 0 8px" },
  2: { fontSize: "17px", lineHeight: "26px", margin: "20px 0 6px" },
  3: { fontSize: "15px", lineHeight: "24px", margin: "16px 0 4px" },
};

/** A link target the email may carry: http(s), or an in-app path on the app's origin. */
function safeHref(href: string, appUrl: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//"))
    return new URL(href, appUrl).toString();
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

type Ctx = { appUrl: string };

function inline(tokens: readonly Token[] | undefined, ctx: Ctx): ReactNode {
  return (tokens ?? []).map((token, i) => (
    <Fragment key={i}>{inlineToken(token, ctx)}</Fragment>
  ));
}

function inlineToken(token: Token, ctx: Ctx): ReactNode {
  switch (token.type) {
    case "strong":
      return (
        <strong style={{ fontWeight: 600 }}>{inline(token.tokens, ctx)}</strong>
      );
    case "em":
      return <em>{inline(token.tokens, ctx)}</em>;
    case "del":
      return <s>{inline(token.tokens, ctx)}</s>;
    case "codespan":
      return (
        <code
          className="vs-quote"
          style={{
            backgroundColor: c.quoteBg,
            borderRadius: "4px",
            fontFamily: mono,
            fontSize: "13px",
            padding: "1px 4px",
          }}
        >
          {(token as Tokens.Codespan).text}
        </code>
      );
    case "br":
      return <br />;
    case "link": {
      const link = token as Tokens.Link;
      // A mention reads as its name: a person as `@name`, anything else as its label.
      if (link.href.startsWith("mention://"))
        return (
          <strong style={{ fontWeight: 600 }}>
            {inline(link.tokens, ctx)}
          </strong>
        );
      const href = safeHref(link.href, ctx.appUrl);
      return href ? (
        <Link
          href={href}
          className="vs-text"
          style={{ color: c.text, textDecoration: "underline" }}
        >
          {inline(link.tokens, ctx)}
        </Link>
      ) : (
        inline(link.tokens, ctx)
      );
    }
    case "image":
    case "html":
      return null;
    case "escape":
    case "text": {
      const text = token as Tokens.Text;
      return text.tokens ? inline(text.tokens, ctx) : decode(text.text);
    }
    default:
      return "text" in token && typeof token.text === "string"
        ? decode(token.text)
        : null;
  }
}

/** marked escapes `&<>"'` in text; React escapes again, so they go back first. */
const decode = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

function block(token: Token, ctx: Ctx, key: number): ReactNode {
  switch (token.type) {
    case "heading": {
      const h = token as Tokens.Heading;
      const level = Math.min(Math.max(h.depth, 1), 3);
      return (
        <Heading
          key={key}
          as={level === 1 ? "h2" : level === 2 ? "h3" : "h4"}
          className="vs-text"
          style={{
            color: c.text,
            fontFamily: font,
            fontWeight: 600,
            ...HEADING[level],
          }}
        >
          {inline(h.tokens, ctx)}
        </Heading>
      );
    }
    case "paragraph":
      return (
        <Text key={key} className="vs-text" style={body}>
          {inline((token as Tokens.Paragraph).tokens, ctx)}
        </Text>
      );
    case "list": {
      const list = token as Tokens.List;
      const Tag = list.ordered ? "ol" : "ul";
      return (
        <Tag
          key={key}
          style={{ ...body, paddingLeft: "24px", margin: "0 0 12px" }}
        >
          {list.items.map((item, i) => (
            <li
              key={i}
              className="vs-text"
              style={{
                color: c.text,
                margin: "0 0 4px",
                listStyleType: item.task ? "none" : undefined,
              }}
            >
              {item.task ? (item.checked ? "☑ " : "☐ ") : null}
              {item.tokens.map((child, j) =>
                child.type === "text" || child.type === "paragraph" ? (
                  <Fragment key={j}>
                    {inline((child as Tokens.Text).tokens ?? [child], ctx)}
                  </Fragment>
                ) : child.type === "checkbox" ? null : (
                  block(child, ctx, j)
                ),
              )}
            </li>
          ))}
        </Tag>
      );
    }
    case "blockquote":
      return (
        <Section
          key={key}
          className="vs-quote-bar"
          style={{
            borderLeft: `3px solid ${c.quoteBar}`,
            margin: "0 0 12px",
            paddingLeft: "12px",
          }}
        >
          {(token as Tokens.Blockquote).tokens.map((child, i) =>
            block(child, ctx, i),
          )}
        </Section>
      );
    case "code":
      return (
        <Text
          key={key}
          className="vs-quote vs-text"
          style={{
            ...body,
            backgroundColor: c.quoteBg,
            borderRadius: "6px",
            fontFamily: mono,
            fontSize: "13px",
            lineHeight: "20px",
            padding: "8px 12px",
            whiteSpace: "pre-wrap",
          }}
        >
          {(token as Tokens.Code).text}
        </Text>
      );
    case "table": {
      // A table reads as one line per row: email clients mangle wide tables.
      const table = token as Tokens.Table;
      return (
        <Fragment key={key}>
          {[table.header, ...table.rows].map((row, i) => (
            <Text
              key={i}
              className="vs-text"
              style={{
                ...body,
                margin: "0 0 4px",
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {row.map((cell, j) => (
                <Fragment key={j}>
                  {j > 0 ? " · " : null}
                  {inline(cell.tokens, ctx)}
                </Fragment>
              ))}
            </Text>
          ))}
        </Fragment>
      );
    }
    case "hr":
      return (
        <Hr
          key={key}
          className="vs-rule"
          style={{ borderTop: `1px solid ${c.border}`, margin: "16px 0" }}
        />
      );
    default:
      return null;
  }
}

/** Props for `EmailMarkdown`. */
export interface EmailMarkdownProps {
  /** The Markdown source (CommonMark + GFM). */
  markdown: string;
  /** The app's origin; in-app paths (`/tasks/1`) resolve against it. */
  appUrl: string;
}

/**
 * Markdown as email blocks; links resolve against `appUrl`.
 *
 * @example
 * <EmailMarkdown markdown="## Decisions\n- Ship on **Friday**" appUrl="https://app.example.com" />
 */
export function EmailMarkdown({ markdown, appUrl }: EmailMarkdownProps) {
  const tokens = new Lexer({ gfm: true }).lex(markdown);
  return <>{tokens.map((token, i) => block(token, { appUrl }, i))}</>;
}
