// @vegastack email-kit@0.25.15 sha256-iLa8EAZQbpdZWQoM/a5AlOzAwA6//dKxSX335ct1AcY=

/**
 * Classic Outlook (the Word engine) ignores `max-width`, so a fluid 600px column fills its whole
 * reading pane. The fix is a fixed-width "ghost" table that only Outlook sees, written as
 * conditional comments — which React cannot render. The layout places these two empty markers
 * around its container instead, and `renderEmail` swaps each for its conditional comment.
 */
export const MSO_OPEN = { "data-vs-mso": "open" } as const;
/** The closing marker; see `MSO_OPEN`. */
export const MSO_CLOSE = { "data-vs-mso": "close" } as const;

/**
 * Replace the layout's markers with the Outlook-only 600px ghost table. `renderEmail` calls it;
 * call it yourself only if you render with react-email's `render` directly.
 *
 * @example
 * const html = applyMsoGhostTable(await render(<NotificationEmail {...props} />));
 */
export function applyMsoGhostTable(html: string): string {
  return html
    .replace(
      '<span data-vs-mso="open"></span>',
      '<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->',
    )
    .replace(
      '<span data-vs-mso="close"></span>',
      "<!--[if mso]></td></tr></table><![endif]-->",
    );
}
