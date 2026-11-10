// @vegastack link-provider@0.61.0 sha256-WXbylnHxXYRQ2JFX+u/Oem38X75ovhGfgf+mIRp58oE=

"use client";

import * as React from "react";

/* ---
WHY THIS EXISTS — one answer, app-wide, to "what does a click on this link do?".

Before it, every component that renders a link took its own knob (`MarkdownView`'s `linkOrigin` and
`onNavigate`, `InlineChipProvider`'s `onOpen`, a `linkRender` element per list), and every surface
that forgot one fell back to the browser: an in-app link reloaded the whole app (a side panel, its
draft and a playing recording lost), and an app link written as a full address (an agent's answer)
opened a new tab. `LinkProvider` is set once, at the app root, with the host router: every
component below reads it by default, and its own props still win.

The rule, in one place (`linkAction`):
- A plain click on an in-app link — a path, or a full address on the app's `origin` — is the
  router's: only the page changes, in the same tab.
- ⌘/Ctrl/Shift/Alt-click and middle-click stay the browser's (a new tab or window).
- Any other origin is external: a new tab, `rel="noopener noreferrer"`.

The same pattern as React Aria's `RouterProvider`.
--- */

/** What `LinkProvider` tells every link below it. */
export interface LinkProviderValue {
  /**
   * Opens an in-app path without reloading the page — the host router's `push`. Without it, an
   * in-app link is a plain browser navigation.
   */
  navigate?: (href: string) => void;
  /**
   * The app's own origin (`https://app.example.com`): a full address on it is an in-app link. Pass
   * the same value on the server and the client so server-rendered links hydrate unchanged.
   */
  origin?: string;
}

const LinkContext = React.createContext<LinkProviderValue>({});

/** Props accepted by `LinkProvider`. */
export interface LinkProviderProps extends LinkProviderValue {
  /** The app (or the part of it) whose links follow the rule. */
  children: React.ReactNode;
}

/**
 * `LinkProvider` — tells every VegaStack link below it how to open an in-app link: `navigate` (the
 * router's `push`) and the app's `origin`. Mount it once, near the root, in a client component that
 * owns the router.
 *
 * @example
 * "use client";
 * export function AppLinks({ origin, children }: { origin: string; children: React.ReactNode }) {
 *   const router = useRouter();
 *   return <LinkProvider navigate={router.push} origin={origin}>{children}</LinkProvider>;
 * }
 */
export function LinkProvider({
  navigate,
  origin,
  children,
}: LinkProviderProps) {
  const value = React.useMemo(() => ({ navigate, origin }), [navigate, origin]);
  return <LinkContext.Provider value={value}>{children}</LinkContext.Provider>;
}

/** The nearest `LinkProvider`'s value, or `{}` outside one. */
export function useLinkProvider(): LinkProviderValue {
  return React.useContext(LinkContext);
}

/**
 * The in-app path of `href` — itself when it is a path (`/tasks/1`, not `//host`), its path, query
 * and hash when it is a full address on `origin` — else `null` (another origin, `mailto:`, a bare
 * `#anchor`, an address carrying a user name).
 *
 * @example
 * inAppPath("https://app.example.com/tasks/1?x=1#c", "https://app.example.com"); // "/tasks/1?x=1#c"
 * inAppPath("https://example.org/a", "https://app.example.com"); // null
 */
export function inAppPath(href: string, origin?: string): string | null {
  const path = href.startsWith("/") && !href.startsWith("//");
  if (!path && (!origin || !/^https?:\/\//i.test(href))) return null;
  const base = new URL(origin ?? "https://app.invalid");
  let url: URL;
  try {
    // As the browser reads it: `/\host`, a tab or a newline inside `//` all reach another host.
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.origin !== base.origin || url.username || url.password) return null;
  // `//host/x` as a path would leave the origin: one leading slash only.
  return `/${url.pathname.replace(/^\/+/, "")}${url.search}${url.hash}`;
}

/** A primary-button click with no modifier: the one gesture an app link handles itself. */
export function isPlainClick(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented?: boolean;
}): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** How a link opens: in place through the router, in the browser, or in a new tab. */
export type LinkAction =
  | { kind: "navigate"; path: string }
  | { kind: "browser"; href: string }
  | { kind: "external"; href: string };

/**
 * What a link to `href` does under `links`: `navigate` for an in-app link when a router is there,
 * `browser` for an in-app link without one (or a non-web scheme: `mailto:`, `#anchor`), `external`
 * for a web address on another origin.
 */
export function linkAction(href: string, links: LinkProviderValue): LinkAction {
  const path = inAppPath(href, links.origin);
  if (path !== null)
    return links.navigate
      ? { kind: "navigate", path }
      : { kind: "browser", href: path };
  return /^https?:\/\//i.test(href) || href.startsWith("//")
    ? { kind: "external", href }
    : { kind: "browser", href };
}

/**
 * `useOpenLink` — opens `href` from a button or a key press (not an `<a>`): an in-app link through
 * the router, an external one in a new tab, `newTab: true` (a modifier was held) always in a new tab.
 *
 * @example
 * const openLink = useOpenLink();
 * <Button onClick={(event) => openLink(href, { newTab: event.metaKey || event.ctrlKey })}>Open</Button>
 */
export function useOpenLink(): (
  href: string,
  options?: { newTab?: boolean },
) => void {
  const links = useLinkProvider();
  return React.useCallback(
    (href, { newTab = false } = {}) => {
      const action = linkAction(href, links);
      if (newTab || action.kind === "external") {
        window.open(
          action.kind === "navigate" ? action.path : action.href,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      if (action.kind === "navigate") links.navigate?.(action.path);
      else window.location.assign(action.href);
    },
    [links],
  );
}

/** Props accepted by `AppLink`. */
export interface AppLinkProps extends React.ComponentProps<"a"> {
  /**
   * Where it goes. Without one it is a plain `<a>` (a template a host clones with its `href`).
   * @default undefined
   */
  href?: string;
  /**
   * Opens an in-app link on a plain click instead of the provider's `navigate` (a surface with its
   * own router hand-off). @default undefined
   */
  onNavigate?: (
    href: string,
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => void;
}

/**
 * `AppLink` — an `<a>` that follows `LinkProvider`'s rule: a plain click on an in-app link is a
 * client-side navigation in the same tab; a modified or middle click stays the browser's; another
 * origin opens a new tab. A full address on the app's origin renders as its path.
 *
 * @example
 * <AppLink href="/tasks/42">TSK-42</AppLink>
 * <AppLink href="https://example.org">example.org</AppLink> // target="_blank"
 */
export function AppLink({ href, onNavigate, onClick, ...props }: AppLinkProps) {
  const links = useLinkProvider();
  if (href === undefined)
    return <a data-slot="app-link" onClick={onClick} {...props} />;
  const action = linkAction(
    href,
    onNavigate ? { ...links, navigate: onNavigate as never } : links,
  );
  if (action.kind === "external")
    return (
      <a
        data-slot="app-link"
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        {...props}
      />
    );
  return (
    <a
      data-slot="app-link"
      href={action.kind === "navigate" ? action.path : action.href}
      onClick={(event) => {
        onClick?.(event);
        // A link that asks for another window or a download keeps its native behaviour.
        const native =
          (props.target !== undefined && props.target !== "_self") ||
          props.download !== undefined;
        if (action.kind !== "navigate" || native || !isPlainClick(event))
          return;
        event.preventDefault();
        if (onNavigate) onNavigate(action.path, event);
        else links.navigate?.(action.path);
      }}
      {...props}
    />
  );
}
