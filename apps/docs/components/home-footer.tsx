import github from "thesvg/github";
import linkedin from "thesvg/linkedin";
import xIcon from "thesvg/x";
import { BrandIcon } from "@vegastack/design/icons";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/vegastack", icon: github },
  { label: "X", href: "https://x.com/vegastack", icon: xIcon },
  {
    label: "LinkedIn",
    href: "https://in.linkedin.com/company/vegastack",
    icon: linkedin,
  },
] as const;

/**
 * Site footer for the marketing home route.
 *
 * Rendered by `app/(home)/layout.tsx` as a SIBLING of Fumadocs' `HomeLayout`, never from
 * inside the page — `HomeLayout` renders a `<main>`, and a `<footer>` descended from `main`
 * maps to `generic` rather than `contentinfo` (HTML-AAM), which silently removes the footer
 * landmark and makes its label unreachable.
 */
export function HomeFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
        <p className="text-center text-sm text-muted-foreground sm:text-start">
          © 2026 VegaStack Inc.
        </p>
        <nav aria-label="VegaStack social media">
          <ul className="flex items-center justify-center gap-1">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`VegaStack on ${social.label}`}
                  className="inline-flex size-(--size-md) items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <BrandIcon
                    icon={social.icon}
                    variant="mono"
                    size="sm"
                    aria-label=""
                    className="[&_path]:fill-current"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
