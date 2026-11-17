// @vegastack shell@0.111.0 sha256-PV/6DpM9FlH0341U+ddFjwO/xI3D1Xz0luzpMYRXWiA=

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
 * `ShellStateScript` — put it in `<head>`. Before the first paint it reads the `vs_shell_col`
 * cookie (`open:240`, `closed:200`) and marks `<html>` with `data-shell-col` and the saved width
 * as `--shell-column-saved`, so even a cached page paints the person's column with no shift. The
 * mark wins over `Shell`'s `defaultColumnOpen`. A missing, malformed or blocked cookie leaves the
 * defaults. Under a nonce-based Content Security Policy,
 * pass the request's `nonce`.
 *
 * @example
 * <head><ShellStateScript /></head>
 */
export function ShellStateScript({ nonce }: { nonce?: string }) {
  const source = `(function(c,a,b){try{var d=document.documentElement,k=document.cookie.split(/;\\s*/);function g(n){for(var i=0;i<k.length;i++){var j=k[i].indexOf("=");if(j>0&&k[i].slice(0,j)===n)return k[i].slice(j+1)}}var m=/^(open|closed)(?::(\\d{2,4}))?$/.exec(g(c)||"");if(m){d.setAttribute("data-shell-col",m[1]);if(m[2])d.style.setProperty("--shell-column-saved",Math.min(b,Math.max(a,+m[2]))+"px")}}catch(z){}})(${scriptLiteral(SHELL_COOKIES.column)},${SHELL_SIZES.columnMin},${SHELL_SIZES.columnMax})`;
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
