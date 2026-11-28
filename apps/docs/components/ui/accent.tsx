// @vegastack accent@0.143.1 sha256-t3ZT2HvHikG+bg0ZHTHD+ewUCEMFiwcSd4WK8KhF7To=

"use client";

import * as React from "react";
import {
  ACCENT_COOKIE,
  DEFAULT_ACCENT,
  isAccentId,
  type AccentId,
} from "@vegastack/design-tokens/accents";

/* ---
The accent on screen (COL-27). `<html data-accent>` is the one place it lives: the token CSS reads
it, `AccentScript` writes it before paint, and this module moves it afterwards. Black is no
attribute. A person's accent comes from `setAccent` (or, before the app has called it, the cookie);
an `AccentScope` covers it while it is mounted.
--- */

const YEAR = 60 * 60 * 24 * 365;

let own: AccentId | undefined;
const scopes: { accent: AccentId }[] = [];
const listeners = new Set<() => void>();

const known = (value: unknown): AccentId =>
  isAccentId(value) ? value : DEFAULT_ACCENT;

function readCookie(): AccentId {
  try {
    for (const part of document.cookie.split(/;\s*/)) {
      const at = part.indexOf("=");
      if (part.slice(0, at) === ACCENT_COOKIE) return known(part.slice(at + 1));
    }
  } catch {
    // Cookies are blocked: Black until the session says otherwise.
  }
  return DEFAULT_ACCENT;
}

function writeCookie(accent: AccentId | null) {
  try {
    const secure = location.protocol === "https:" ? ";secure" : "";
    document.cookie = `${ACCENT_COOKIE}=${accent ?? ""};path=/;max-age=${accent ? YEAR : 0};samesite=lax${secure}`;
  } catch {
    // Cookies are blocked: the accent still applies to this page.
  }
}

const onScreen = (): AccentId =>
  known(document.documentElement.getAttribute("data-accent"));

/** Nothing eases between two accents: every colour on the page changes in one frame. */
function withoutTransitions(change: () => void) {
  let sheet: CSSStyleSheet | undefined;
  try {
    // Unlayered, so it outranks every Tailwind layer by itself; constructed, so it needs no nonce.
    sheet = new CSSStyleSheet();
    sheet.replaceSync("*,::before,::after{transition:none}");
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch {
    // No constructable style sheets: the colours ease, which is all that is lost.
  }
  change();
  // The new colours are computed now, with transitions off; only then do transitions come back.
  if (document.body) void getComputedStyle(document.body).color;
  setTimeout(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (entry) => entry !== sheet,
    );
  }, 1);
}

function apply() {
  const accent = scopes.at(-1)?.accent ?? own ?? readCookie();
  if (accent !== onScreen())
    withoutTransitions(() => {
      const root = document.documentElement;
      if (accent === DEFAULT_ACCENT) root.removeAttribute("data-accent");
      else root.setAttribute("data-accent", accent);
    });
  for (const listener of listeners) listener();
}

/**
 * `setAccent` — the person's accent: applied to the page at once, in one frame, and kept in the
 * `vs_accent` cookie so the next document paints it first. Saving it to the server is the app's. An
 * unknown id is Black. While an `AccentScope` is mounted the page keeps the scope's colour and this
 * one waits under it. `null` forgets the accent and the cookie (sign-out).
 *
 * @example
 * setAccent("violet");
 * setAccent(null); // signed out
 */
export function setAccent(accent: string | null) {
  own = accent === null ? undefined : known(accent);
  writeCookie(own ?? null);
  apply();
}

/**
 * `restoreAccent` — re-read the cookie and show it: for a page the browser brings back from its
 * back/forward cache after the accent moved on.
 *
 * @example
 * window.addEventListener("pageshow", (event) => event.persisted && restoreAccent());
 */
export function restoreAccent() {
  own = undefined;
  apply();
}

/**
 * `useAccent` — the accent on screen. Black on the server and while hydrating.
 *
 * @example
 * const accent = useAccent();
 */
export function useAccent(): AccentId {
  return React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onScreen,
    () => DEFAULT_ACCENT,
  );
}

/** Props accepted by `AccentScope`. */
export interface AccentScopeProps {
  /** The page's own accent; an unknown id is Black. */
  accent: string;
  /** The request's nonce, under a nonce-based Content Security Policy. @default undefined */
  nonce?: string;
  /** The scope's page. @default undefined */
  children?: React.ReactNode;
}

const never = () => () => {};

/**
 * `AccentScope` — a page with its own accent, whoever is looking: a public link in its workspace's
 * colour, the docs in Black. It marks `<html>` while it is mounted, so dialogs and menus match, and
 * gives the person's accent back when it leaves. On the first load an inline script marks it before
 * the page paints. Mount one at a time; to colour a region only, set `data-accent` on the element.
 *
 * @example
 * <AccentScope accent={workspace.accent}>{children}</AccentScope>
 */
export function AccentScope({ accent, nonce, children }: AccentScopeProps) {
  const id = known(accent);
  const entry = React.useRef<{ accent: AccentId }>({ accent: id });
  // The script is for the server's HTML only: React never runs one it creates in the browser.
  const inHtml = React.useSyncExternalStore(
    never,
    () => false,
    () => true,
  );
  React.useLayoutEffect(() => {
    const scope = entry.current;
    scopes.push(scope);
    return () => {
      scopes.splice(scopes.indexOf(scope), 1);
      apply();
    };
  }, []);
  React.useLayoutEffect(() => {
    entry.current.accent = id;
    apply();
  }, [id]);
  return (
    <>
      {inHtml ? (
        <script
          data-slot="accent-scope-script"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            // `id` is one of the known ids, so it is safe to write as it is.
            __html:
              id === DEFAULT_ACCENT
                ? `document.documentElement.removeAttribute("data-accent")`
                : `document.documentElement.setAttribute("data-accent","${id}")`,
          }}
        />
      ) : null}
      {children}
    </>
  );
}
