// @vegastack email-kit@0.23.127 sha256-pYvbLtZC3BL6fYXk/Yn+YhLzy+g6YlnGEIZ3M9wYXwY=

import type { ReactNode } from "react";
import {
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

import {
  emailColors,
  emailCss,
  emailFontFamily,
  emailOutlookCss,
} from "./email-tokens";
import { MSO_CLOSE, MSO_OPEN } from "./mso";

const c = emailColors.light;

/** The product or workspace the email comes from, shown as a text wordmark at the top. */
export interface EmailBrand {
  /** The wordmark text — the product or workspace name. No logo image is used. */
  name: string;
  /** Where the wordmark links; omit for plain text. */
  url?: string;
}

/** One footer link, e.g. "Manage notifications". */
export interface EmailFooterLink {
  /** Descriptive link text — never "click here". */
  label: string;
  /** Absolute URL. */
  href: string;
}

/** The footer under the card: why the person got this, what they can do about it, who sent it. */
export interface EmailFooter {
  /** Why the recipient got this email, e.g. "You're getting this because you're assigned to this task." */
  reason?: string;
  /** Preference and unsubscribe links, shown in one row. */
  links?: EmailFooterLink[];
  /**
   * The closing line. `null` hides it.
   * @default "Sent with VegaStack"
   */
  note?: string | null;
}

/** Props for `EmailLayout`. */
export interface EmailLayoutProps {
  /** The wordmark at the top of the email. */
  brand: EmailBrand;
  /** The inbox preview line (preheader), at most ~150 characters. Hidden in the body and the plain-text part. */
  preview: string;
  /**
   * The document `<title>`; some clients show it in a browser view.
   * @default preview
   */
  title?: string;
  /**
   * The language of the email, set on `<html>` and `<body>`.
   * @default "en"
   */
  lang?: string;
  /**
   * Text direction.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
  /**
   * The footer under the card.
   * @default undefined
   */
  footer?: EmailFooter;
  /** The card's content — compose the parts from `email-parts`. */
  children: ReactNode;
}

/**
 * The shell every VegaStack email renders in: `<html lang>`, the `color-scheme` metas, a hidden
 * preheader, a text wordmark, one 600px fluid card on a canvas, and the footer. Light colours are
 * inline; dark mode comes from one `<style>` block (`prefers-color-scheme` plus the Outlook.com
 * `[data-ogsc]`/`[data-ogsb]` hooks). Server-safe — render it with `renderEmail`.
 *
 * @example
 * <EmailLayout
 *   brand={{ name: "Acme", url: "https://acme.example" }}
 *   preview="Priya commented on Fix login"
 *   footer={{ reason: "You're getting this because you follow this task." }}
 * >
 *   <EmailHeading>Priya commented on Fix login</EmailHeading>
 * </EmailLayout>
 */
export function EmailLayout({
  brand,
  preview,
  title,
  lang = "en",
  dir = "ltr",
  footer,
  children,
}: EmailLayoutProps) {
  const note = footer?.note === undefined ? "Sent with VegaStack" : footer.note;
  const links = footer?.links ?? [];
  const wordmarkStyle = {
    color: c.text,
    fontFamily: emailFontFamily,
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: "24px",
    textDecoration: "none",
    textDecorationLine: "none",
  };
  const footerText = {
    color: c.muted,
    fontFamily: emailFontFamily,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 8px",
  };
  return (
    <Html lang={lang} dir={dir}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>{title ?? preview}</title>
        <style dangerouslySetInnerHTML={{ __html: emailCss }} />
        <style dangerouslySetInnerHTML={{ __html: emailOutlookCss }} />
      </Head>
      <body
        lang={lang}
        dir={dir}
        className="vs-canvas"
        style={{
          backgroundColor: c.canvas,
          margin: 0,
          padding: 0,
          WebkitTextSizeAdjust: "100%",
        }}
      >
        <Preview useTitleTag={false}>{preview}</Preview>
        {/* The canvas is a full-width table cell, not just <body>: several clients drop body styles. */}
        <Section
          className="vs-canvas"
          style={{
            backgroundColor: c.canvas,
            color: c.text,
            fontFamily: emailFontFamily,
          }}
        >
          {/* Classic Outlook ignores max-width: renderEmail swaps these markers for a 600px ghost table. */}
          <span {...MSO_OPEN} />
          <Container
            tdClassName="vs-gutter"
            style={{
              maxWidth: "600px",
              width: "100%",
              margin: "0 auto",
              padding: "32px 24px",
            }}
          >
            <Section style={{ padding: "0 4px 16px" }}>
              <Text className="vs-text" style={{ ...wordmarkStyle, margin: 0 }}>
                {brand.url ? (
                  <Link
                    href={brand.url}
                    className="vs-text"
                    style={wordmarkStyle}
                  >
                    {brand.name}
                  </Link>
                ) : (
                  brand.name
                )}
              </Text>
            </Section>
            <Section
              className="vs-surface vs-border"
              tdClassName="vs-pad"
              style={{
                backgroundColor: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: "12px",
                borderCollapse: "separate",
                padding: "32px",
              }}
            >
              {children}
            </Section>
            {footer?.reason || links.length > 0 || note ? (
              <Section style={{ padding: "24px 4px 0" }}>
                {footer?.reason ? (
                  <Text className="vs-muted" style={footerText}>
                    {footer.reason}
                  </Text>
                ) : null}
                {links.length > 0 ? (
                  <Text className="vs-muted" style={footerText}>
                    {links.map((link, index) => (
                      <span key={link.href}>
                        {index > 0 ? " · " : null}
                        <Link
                          href={link.href}
                          className="vs-muted"
                          style={{
                            color: c.muted,
                            textDecoration: "underline",
                            textDecorationLine: "underline",
                          }}
                        >
                          {link.label}
                        </Link>
                      </span>
                    ))}
                  </Text>
                ) : null}
                {note ? (
                  <Text className="vs-muted" style={footerText}>
                    {note}
                  </Text>
                ) : null}
              </Section>
            ) : null}
          </Container>
          <span {...MSO_CLOSE} />
        </Section>
      </body>
    </Html>
  );
}
