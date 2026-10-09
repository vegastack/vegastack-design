// @vegastack email-kit@0.25.7 sha256-u6BVOk9hTcllaNnbO8rnHUbetAp8fyGpoFqebrJ+KQY=

import type { EmailBrand, EmailFooter } from "./email-layout";
import { EmailLayout } from "./email-layout";
import type { EmailCardProps } from "./email-parts";
import {
  EmailButton,
  EmailCard,
  EmailHeading,
  EmailLink,
  EmailText,
} from "./email-parts";
import type { EmailAction } from "./notification-email";

/** Props for `ActionEmail`. */
export interface ActionEmailProps {
  /** The wordmark at the top — the workspace or product name. */
  brand: EmailBrand;
  /** The inbox preview line. */
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
  /** What the person is asked to do: "Priya invited you to Acme". */
  heading: string;
  /**
   * One paragraph, or several.
   * @default undefined
   */
  body?: string | string[];
  /**
   * The thing the action is about — a space, a record, a request.
   * @default undefined
   */
  card?: EmailCardProps;
  /** The one call to action: "Accept invite", "Reset password", "Review request". */
  action: EmailAction;
  /**
   * The label before the raw URL, for clients that block the button
   * ("Or paste this link into your browser:"). Omit to leave the URL out.
   * @default undefined
   */
  linkFallback?: string;
  /**
   * A muted line under the button: expiry, or "If you didn't expect this, you can ignore it."
   * @default undefined
   */
  note?: string;
  /**
   * The closing note and links. Transactional email usually has no preference links.
   * @default undefined
   */
  footer?: EmailFooter;
}

/**
 * A message that asks for one action — an invite, a password reset, an access request. Body
 * paragraphs, an optional card, one button, the raw link as a fallback, and a note.
 *
 * @example
 * <ActionEmail
 *   brand={{ name: "Acme" }}
 *   preview="Priya invited you to the Design space"
 *   heading="Priya invited you to Acme"
 *   action={{ label: "Accept invite", href: "https://acme.example/invite/abc" }}
 *   linkFallback="Or paste this link into your browser:"
 *   note="This invite expires in 7 days."
 * />
 */
export function ActionEmail({
  brand,
  preview,
  title,
  lang,
  dir,
  heading,
  body,
  card,
  action,
  linkFallback,
  note,
  footer,
}: ActionEmailProps) {
  const paragraphs =
    body === undefined ? [] : Array.isArray(body) ? body : [body];
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
      {paragraphs.map((paragraph, index) => (
        <EmailText key={index}>{paragraph}</EmailText>
      ))}
      {card ? <EmailCard {...card} /> : null}
      <EmailButton href={action.href}>{action.label}</EmailButton>
      {linkFallback ? (
        <EmailText tone="muted">
          {linkFallback}
          <br />
          <span style={{ wordBreak: "break-all" }}>
            <EmailLink href={action.href}>{action.href}</EmailLink>
          </span>
        </EmailText>
      ) : null}
      {note ? <EmailText tone="muted">{note}</EmailText> : null}
    </EmailLayout>
  );
}
