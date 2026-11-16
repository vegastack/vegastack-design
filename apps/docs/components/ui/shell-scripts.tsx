// @vegastack shell@0.95.0 sha256-Cjh9kpYjBtD6hB5T8vS12cuE5gniueBJYIWPE7k/yHA=

import { TIME_ZONE_COOKIE_SCRIPT } from "@/lib/date-time";
import { SHELL_COOKIES, SHELL_SIZES } from "@/lib/shell-layout";

/* ---
The shell's two before-paint scripts, in a file of their own with no client imports: the root
layout renders them on every page, signed out and public ones included, so importing them must not
pull the shell's (or anything's) client graph into those pages.
--- */

/** A JSON string literal that cannot close the inline `<script>` it is written into. */
function scriptLiteral(value: string) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * `ShellStateScript` — put it in `<head>`. Before the first paint it reads the `vs_shell_col` and
 * `vs_shell_panel` cookies (`open:240`, `closed:420`) and marks `<html>` with `data-shell-col`
 * and `data-shell-panel`, and the saved widths as `--shell-column-saved` and
 * `--shell-panel-saved`, so even a cached page paints the person's column and widths with no
 * shift. The column mark wins over `Shell`'s `defaultColumnOpen`; the panel mark only informs —
 * the app decides whether a panel is open (the URL wins, #7) and passes `panelOpen`. A missing,
 * malformed or blocked cookie leaves the defaults. Under a nonce-based Content Security Policy,
 * pass the request's `nonce`.
 *
 * @example
 * <head><ShellStateScript /></head>
 */
export function ShellStateScript({ nonce }: { nonce?: string }) {
  const source = `(function(c,p,a,b,e,f){try{var d=document.documentElement,k=document.cookie.split(/;\\s*/);function g(n){for(var i=0;i<k.length;i++){var j=k[i].indexOf("=");if(j>0&&k[i].slice(0,j)===n)return k[i].slice(j+1)}}function r(v,lo,hi){var m=/^(open|closed)(?::(\\d{2,4}))?$/.exec(v||"");return m?{o:m[1],w:m[2]?Math.min(hi,Math.max(lo,+m[2])):0}:null}var x=r(g(c),a,b),y=r(g(p),e,f);if(x){d.setAttribute("data-shell-col",x.o);if(x.w)d.style.setProperty("--shell-column-saved",x.w+"px")}if(y){d.setAttribute("data-shell-panel",y.o);if(y.w)d.style.setProperty("--shell-panel-saved",y.w+"px")}}catch(z){}})(${scriptLiteral(SHELL_COOKIES.column)},${scriptLiteral(SHELL_COOKIES.panel)},${SHELL_SIZES.columnMin},${SHELL_SIZES.columnMax},${SHELL_SIZES.panelMin},${SHELL_SIZES.panelMax})`;
  return (
    <script
      data-slot="shell-state-script"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}

/**
 * `TimeZoneScript` — writes the browser's zone to the `tz` cookie (and again when the tab comes
 * back), so server renders use the viewer's zone. The same script as `relative-time`'s, from a
 * module with no client imports, for the root layout.
 *
 * @example
 * <head><ShellStateScript /><TimeZoneScript /></head>
 */
export function TimeZoneScript({ nonce }: { nonce?: string }) {
  return (
    <script
      data-slot="time-zone-script"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: TIME_ZONE_COOKIE_SCRIPT }}
    />
  );
}
