// @vegastack email-kit@0.25.7 sha256-u6BVOk9hTcllaNnbO8rnHUbetAp8fyGpoFqebrJ+KQY=

import type { EmailFooter, EmailBrand } from "./email-layout";
import { EmailLayout } from "./email-layout";
import type { EmailCardProps, EmailQuoteProps } from "./email-parts";
import {
  EmailButton,
  EmailCard,
  EmailHeading,
  EmailQuote,
  EmailText,
} from "./email-parts";

/** The email's one call to action. */
export interface EmailAction {
  /** Verb first: "View comment", "Open page", "Review request". */
  label: string;
  /** Absolute URL. */
  href: string;
}

/** Props for `NotificationEmail`. */
export interface NotificationEmailProps {
  /** The wordmark at the top — the workspace or product name. */
  brand: EmailBrand;
  /** The inbox preview line: the event sentence or the quote. */
  preview: string;
  /**
   * The document `<title>`.
   * @default heading
   */
  title?: string;
  /**
   * Language of the email.
   * @default "en"
   */
  lang?: string;
  /**
   * Text direction.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
  /** Who did what to what: "Priya commented on Fix login", or a count line for a collapsed batch. */
  heading: string;
  /**
   * An optional sentence under the heading.
   * @default undefined
   */
  body?: string;
  /**
   * Quoted comments or messages, oldest first.
   * @default []
   */
  quotes?: EmailQuoteProps[];
  /**
   * A summary of the record the event is about.
   * @default undefined
   */
  card?: EmailCardProps;
  /** The one call to action. */
  action: EmailAction;
  /**
   * Why they got it, the preference links, and the closing note.
   * @default undefined
   */
  footer?: EmailFooter;
}

/**
 * One event about one record — an assignment, a mention, a comment, a change, a reminder. The
 * heading carries the event; quotes, a record card and one button follow. Every string comes in
 * through props.
 *
 * @example
 * <NotificationEmail
 *   brand={{ name: "Acme" }}
 *   preview="Priya: Can we ship this by Friday?"
 *   heading="Priya commented on Fix login"
 *   quotes={[{ author: "Priya", time: "Fri 9 Oct, 10:00 IST", body: "Can we ship this by Friday?" }]}
 *   action={{ label: "View comment", href: "https://acme.example/tasks/42#comment-7" }}
 *   footer={{ reason: "You're getting this because you follow this task." }}
 * />
 */
export function NotificationEmail({
  brand,
  preview,
  title,
  lang,
  dir,
  heading,
  body,
  quotes = [],
  card,
  action,
  footer,
}: NotificationEmailProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={preview}
      title={title ?? heading}
      lang={lang}
      dir={dir}
      footer={footer}
    >
      <EmailHeading>{heading}</EmailHeading>
      {body ? <EmailText>{body}</EmailText> : null}
      {quotes.map((quote, index) => (
        <EmailQuote key={index} {...quote} />
      ))}
      {card ? <EmailCard {...card} /> : null}
      <EmailButton href={action.href}>{action.label}</EmailButton>
    </EmailLayout>
  );
}
