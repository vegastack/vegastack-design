// @vegastack accent@0.135.0 sha256-A1aiNUpuBgKZAZc7opA6aWWIh6SqFkqZE7PypPbYMOs=

import {
  ACCENT_COOKIE,
  ACCENTS,
  DEFAULT_ACCENT,
} from "@vegastack/design-tokens/accents";

/* ---
The accent's before-paint script, in a file of its own with no client imports: the root layout
renders it on every page, signed out and public ones included, so importing it must not pull any
client graph into those pages.
--- */

/** A JS literal that cannot close the inline `<script>` it is written into. */
function scriptLiteral(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Props accepted by `AccentScript`. */
export interface AccentScriptProps {
  /**
   * Paths whose pages never wear the person's accent (sign-in, docs, a public link with its own
   * `AccentScope`): the path itself and everything under it.
   * @default []
   */
  skip?: readonly string[];
  /** The request's nonce, under a nonce-based Content Security Policy. @default undefined */
  nonce?: string;
}

/**
 * `AccentScript` — put it in `<head>`. Before the first paint it reads the `vs_accent` cookie and,
 * when it is one of the seven accent ids, marks `<html>` with `data-accent`, so even a cached page
 * paints the person's colour with no flash. Black is no mark at all. A missing, unknown or blocked
 * cookie leaves Black. The host `<html>` needs `suppressHydrationWarning`.
 *
 * @example
 * <head><AccentScript skip={["/login", "/docs", "/s"]} /></head>
 */
export function AccentScript({ skip = [], nonce }: AccentScriptProps) {
  const ids = ACCENTS.map(({ id }) => id).filter((id) => id !== DEFAULT_ACCENT);
  const source = `(function(n,v,s){try{var p=location.pathname,i,k,j;for(i=0;i<s.length;i++)if(p===s[i]||p.indexOf(s[i].replace(/\\/$/,"")+"/")===0)return;k=document.cookie.split(/;\\s*/);for(i=0;i<k.length;i++){j=k[i].indexOf("=");if(j>0&&k[i].slice(0,j)===n){if(v.indexOf(k[i].slice(j+1))>=0)document.documentElement.setAttribute("data-accent",k[i].slice(j+1));return}}}catch(z){}})(${scriptLiteral(ACCENT_COOKIE)},${scriptLiteral(ids)},${scriptLiteral(skip)})`;
  return (
    <script
      data-slot="accent-script"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}
