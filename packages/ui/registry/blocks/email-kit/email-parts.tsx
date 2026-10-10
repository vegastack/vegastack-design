// @vegastack email-kit@0.25.12 sha256-9g9oZSfDNYX4ei5UHE1KIms5isHyj2ubukjwIW5Yj4k=

import { Fragment } from "react";
import type { ReactNode } from "react";
import { Button, Heading, Hr, Link, Section, Text } from "react-email";

import { emailColors, emailFontFamily } from "./email-tokens";

const c = emailColors.light;
// Set on every text element: classic Outlook does not reliably inherit a font through tables.
const font = emailFontFamily;

/** Props for `EmailHeading`. */
export interface EmailHeadingProps {
  /** The heading text — for a notification, the event sentence ("Priya commented on Fix login"). */
  children: ReactNode;
  /**
   * The heading level. One `h1` per email; `h2` for a section inside it.
   * @default "h1"
   */
  as?: "h1" | "h2";
}

/**
 * The email's heading: 20px semibold for `h1`, 16px for `h2`.
 *
 * @example
 * <EmailHeading>Priya commented on Fix login</EmailHeading>
 */
export function EmailHeading({ children, as = "h1" }: EmailHeadingProps) {
  const h1 = as === "h1";
  return (
    <Heading
      as={as}
      className="vs-text"
      style={{
        color: c.text,
        fontFamily: font,
        fontSize: h1 ? "20px" : "16px",
        fontWeight: 600,
        lineHeight: h1 ? "28px" : "24px",
        margin: h1 ? "0 0 12px" : "24px 0 8px",
      }}
    >
      {children}
    </Heading>
  );
}

/** Props for `EmailText`. */
export interface EmailTextProps {
  /** The paragraph. Inline `EmailLink`s are fine inside it. */
  children: ReactNode;
  /**
   * `muted` for secondary copy — an expiry note, a "you can ignore this" line.
   * @default "default"
   */
  tone?: "default" | "muted";
}

/**
 * A body paragraph, 15px on a 24px line.
 *
 * @example
 * <EmailText>Anand assigned you to Fix login in Acme.</EmailText>
 */
export function EmailText({ children, tone = "default" }: EmailTextProps) {
  const muted = tone === "muted";
  return (
    <Text
      className={muted ? "vs-muted" : "vs-text"}
      style={{
        color: muted ? c.muted : c.text,
        fontFamily: font,
        fontSize: muted ? "14px" : "15px",
        lineHeight: muted ? "22px" : "24px",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

/** Props for `EmailLink`. */
export interface EmailLinkProps {
  /** Absolute URL. */
  href: string;
  /** Descriptive text that says where the link goes — never "click here". */
  children: ReactNode;
}

/**
 * An underlined inline link in the text colour.
 *
 * @example
 * <EmailText>
 *   Or open <EmailLink href="https://acme.example/tasks/42">Fix login</EmailLink>.
 * </EmailText>
 */
export function EmailLink({ href, children }: EmailLinkProps) {
  return (
    <Link
      href={href}
      className="vs-text"
      style={{
        color: c.text,
        textDecoration: "underline",
        textDecorationLine: "underline",
      }}
    >
      {children}
    </Link>
  );
}

/** Props for `EmailButton`. */
export interface EmailButtonProps {
  /** Absolute URL the button opens. */
  href: string;
  /** The action, verb first: "View comment", "Open page", "Review request". */
  children: ReactNode;
}

/**
 * The one call to action: a bulletproof link button (padding Outlook understands, no image), at
 * least 44px tall, full width on a phone.
 *
 * @example
 * <EmailButton href="https://acme.example/tasks/42#comment-7">View comment</EmailButton>
 */
export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Section style={{ padding: "8px 0 8px" }}>
      <Button
        href={href}
        className="vs-button"
        style={{
          backgroundColor: c.buttonBg,
          border: `1px solid ${c.buttonBg}`,
          borderRadius: "8px",
          color: c.buttonText,
          fontFamily: font,
          fontSize: "15px",
          fontWeight: 600,
          padding: "13px 24px",
          textAlign: "center",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

/** One label/value row on an `EmailCard`. */
export interface EmailCardMeta {
  /** The field name: "Status", "Due", "Space". */
  label: string;
  /** The value, already formatted ("Fri 9 Oct, 10:00 IST"). */
  value: string;
}

/** Props for `EmailCard`. */
export interface EmailCardProps {
  /** The record's title. */
  title: string;
  /**
   * Link for the title; omit for plain text.
   * @default undefined
   */
  href?: string;
  /**
   * Label/value rows under the title.
   * @default []
   */
  meta?: EmailCardMeta[];
  /**
   * Extra content under the meta rows.
   * @default undefined
   */
  children?: ReactNode;
}

/**
 * A summary of the record the email is about: its title (linked) and a few label/value rows.
 *
 * @example
 * <EmailCard
 *   title="Fix login"
 *   href="https://acme.example/tasks/42"
 *   meta={[{ label: "Due", value: "Fri 9 Oct, 10:00 IST" }]}
 * />
 */
export function EmailCard({
  title,
  href,
  meta = [],
  children,
}: EmailCardProps) {
  const titleStyle = {
    color: c.text,
    fontFamily: font,
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: "22px",
  };
  return (
    <Section
      className="vs-border"
      style={{
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        borderCollapse: "separate",
        margin: "0 0 16px",
        padding: "16px",
      }}
    >
      <Text className="vs-text" style={{ ...titleStyle, margin: 0 }}>
        {href ? (
          <Link
            href={href}
            className="vs-text"
            style={{
              ...titleStyle,
              textDecoration: "underline",
              textDecorationLine: "underline",
            }}
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </Text>
      {meta.map((row) => (
        <Text
          key={row.label}
          className="vs-muted"
          style={{
            color: c.muted,
            fontFamily: font,
            fontSize: "13px",
            lineHeight: "20px",
            margin: "4px 0 0",
          }}
        >
          {row.label}:{" "}
          <span className="vs-text" style={{ color: c.text }}>
            {row.value}
          </span>
        </Text>
      ))}
      {children}
    </Section>
  );
}

/** Props for `EmailQuote`. */
export interface EmailQuoteProps {
  /**
   * Who wrote it.
   * @default undefined
   */
  author?: string;
  /**
   * When, already formatted with its zone ("Fri 9 Oct, 10:00 IST").
   * @default undefined
   */
  time?: string;
  /** The quoted text, as plain text. Each line break becomes a `<br>` (and a line in the plain-text part). */
  body: string;
}

/**
 * A quoted comment or message: a tinted block with a leading bar, the author and time above.
 *
 * @example
 * <EmailQuote author="Priya" time="Fri 9 Oct, 10:00 IST" body="Can we ship this by Friday?" />
 */
export function EmailQuote({ author, time, body }: EmailQuoteProps) {
  return (
    <Section
      className="vs-quote vs-quote-bar"
      style={{
        backgroundColor: c.quoteBg,
        borderLeft: `3px solid ${c.quoteBar}`,
        borderRadius: "4px",
        margin: "0 0 16px",
        padding: "12px 16px",
      }}
    >
      {author || time ? (
        <Text
          className="vs-muted"
          style={{
            color: c.muted,
            fontFamily: font,
            fontSize: "13px",
            lineHeight: "20px",
            margin: "0 0 4px",
          }}
        >
          {author ? (
            <strong className="vs-text" style={{ color: c.text }}>
              {author}
            </strong>
          ) : null}
          {author && time ? " · " : null}
          {time}
        </Text>
      ) : null}
      <Text
        className="vs-text"
        style={{
          color: c.text,
          fontFamily: font,
          fontSize: "15px",
          lineHeight: "24px",
          margin: 0,
        }}
      >
        {/* Explicit breaks: classic Outlook ignores white-space, and the plain-text part needs them. */}
        {body.split(/\r?\n/).map((line, index) => (
          <Fragment key={index}>
            {index > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
      </Text>
    </Section>
  );
}

/** One row in an `EmailItems` group. */
export interface EmailItem {
  /** Who did it — a person, or the agent's name. Omit for system events. */
  actor?: string;
  /** What happened, after the actor: "commented on Fix login". */
  text: string;
  /** Where the row links. */
  href?: string;
  /** When, already formatted ("10:00 IST"). */
  time?: string;
}

/** A titled group of rows, e.g. one record or one day. */
export interface EmailItemGroup {
  /** The group heading: a record title or "Due today". */
  title: string;
  /** The rows. */
  items: EmailItem[];
}

/** Props for `EmailItems`. */
export interface EmailItemsProps {
  /** The groups, in order. */
  groups: EmailItemGroup[];
}

/**
 * The digest list: groups with a heading, each row "**Actor** did something" with its time.
 *
 * @example
 * <EmailItems
 *   groups={[
 *     {
 *       title: "Fix login",
 *       items: [{ actor: "Priya", text: "commented", href: "https://acme.example/tasks/42", time: "10:00 IST" }],
 *     },
 *   ]}
 * />
 */
export function EmailItems({ groups }: EmailItemsProps) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <Section
          key={`${group.title}-${groupIndex}`}
          style={{ margin: groupIndex === 0 ? "0" : "16px 0 0" }}
        >
          <Heading
            as="h2"
            className="vs-text"
            style={{
              color: c.text,
              fontFamily: font,
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "20px",
              margin: "0 0 4px",
            }}
          >
            {group.title}
          </Heading>
          {group.items.map((item, index) => {
            const sentence = item.actor ? (
              <>
                <strong>{item.actor}</strong> {item.text}
              </>
            ) : (
              item.text
            );
            return (
              <Text
                key={index}
                className="vs-text vs-rule"
                style={{
                  borderTop: index === 0 ? "none" : `1px solid ${c.border}`,
                  color: c.text,
                  fontFamily: font,
                  fontSize: "14px",
                  lineHeight: "22px",
                  margin: 0,
                  padding: "8px 0",
                }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="vs-text"
                    style={{
                      color: c.text,
                      textDecoration: "underline",
                      textDecorationLine: "underline",
                    }}
                  >
                    {sentence}
                  </Link>
                ) : (
                  sentence
                )}
                {item.time ? (
                  <span className="vs-muted" style={{ color: c.muted }}>
                    {" · "}
                    <span style={{ whiteSpace: "nowrap" }}>{item.time}</span>
                  </span>
                ) : null}
              </Text>
            );
          })}
        </Section>
      ))}
    </>
  );
}

/**
 * A hairline between sections of the card.
 *
 * @example
 * <EmailDivider />
 */
export function EmailDivider() {
  return (
    <Hr
      className="vs-rule"
      style={{
        border: "none",
        borderTop: `1px solid ${c.border}`,
        margin: "24px 0",
      }}
    />
  );
}
