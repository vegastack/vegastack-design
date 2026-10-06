// @vegastack email-kit@0.23.128 sha256-4P43uSg5sclHSyo7df/hzQHmL8+VyoLcOeaW2qJcyC8=

import { Section } from "react-email";

import type { EmailBrand, EmailFooter } from "./email-layout";
import { EmailLayout } from "./email-layout";
import type { EmailItemGroup } from "./email-parts";
import {
  EmailButton,
  EmailHeading,
  EmailItems,
  EmailText,
} from "./email-parts";
import type { EmailAction } from "./notification-email";

/** Props for `DigestEmail`. */
export interface DigestEmailProps {
  /** The wordmark at the top — the workspace or product name. */
  brand: EmailBrand;
  /** The inbox preview line: what is in the digest ("3 comments and 2 tasks due today"). */
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
  /** The digest's heading: "Your day in Acme". */
  heading: string;
  /**
   * An optional line under the heading: "5 updates since yesterday".
   * @default undefined
   */
  body?: string;
  /** The grouped rows — by record or by section ("Due today"). */
  groups: EmailItemGroup[];
  /**
   * A line under the list when it was cut short: "And 4 more in your inbox."
   * @default undefined
   */
  more?: string;
  /** The one call to action, usually "Open inbox". */
  action: EmailAction;
  /**
   * Why they got it, the preference links, and the closing note.
   * @default undefined
   */
  footer?: EmailFooter;
}

/**
 * Many events in one email — the daily digest, or due-date reminders. Groups of linked rows, an
 * optional "more" line, and one button.
 *
 * @example
 * <DigestEmail
 *   brand={{ name: "Acme" }}
 *   preview="2 comments and 1 task due today"
 *   heading="Your day in Acme"
 *   groups={[{ title: "Fix login", items: [{ actor: "Priya", text: "commented", time: "10:00 IST" }] }]}
 *   action={{ label: "Open inbox", href: "https://acme.example/inbox" }}
 * />
 */
export function DigestEmail({
  brand,
  preview,
  title,
  lang,
  dir,
  heading,
  body,
  groups,
  more,
  action,
  footer,
}: DigestEmailProps) {
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
      {body ? <EmailText tone="muted">{body}</EmailText> : null}
      <EmailItems groups={groups} />
      {more ? (
        <Section style={{ paddingTop: "8px" }}>
          <EmailText tone="muted">{more}</EmailText>
        </Section>
      ) : null}
      <EmailButton href={action.href}>{action.label}</EmailButton>
    </EmailLayout>
  );
}
