// @vegastack email-kit@0.23.125 sha256-uuY+IJT4P2oCkY6CNfgnXi3w1gmP/mhIHl2lQUP1REA=

import type { ReactElement } from "react";
import { render, toPlainText } from "react-email";

import { applyMsoGhostTable } from "./mso";

/** A rendered email: the HTML part and the plain-text part, ready for your mail provider. */
export interface RenderedEmail {
  /** The full HTML document (XHTML doctype), without React's streaming markers. */
  html: string;
  /** The plain-text alternative: preheader skipped, links as "text url", headings not uppercased. */
  text: string;
}

// React's streaming markers (`<!--$-->`, `<!--html-->`, …) cost bytes and mean nothing to a mail client.
const REACT_MARKERS = /<!--\/?\$-->|<!--\/?(?:html|head|body)-->/g;

// html-to-text sets headings in capitals by default; email headings are sentence case, so they
// render as plain blocks.
const HEADINGS = ["h1", "h2", "h3"].map((selector) => ({
  selector,
  format: "block",
}));

/**
 * Render an email template to its HTML and plain-text parts. Server-only in practice (it uses
 * `react-dom/server` through react-email); call it from a route handler, a server action or a job.
 *
 * @example
 * const { html, text } = await renderEmail(
 *   <NotificationEmail {...props} />,
 * );
 * await mailer.send({ subject: "Fix login", html, text });
 */
export async function renderEmail(
  element: ReactElement,
): Promise<RenderedEmail> {
  const html = applyMsoGhostTable(
    (await render(element)).replace(REACT_MARKERS, ""),
  );
  const text = toPlainText(html, { selectors: HEADINGS }).trim();
  return { html, text };
}
