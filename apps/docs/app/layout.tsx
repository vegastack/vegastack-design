import './global.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Newsreader } from 'next/font/google';
import { Provider } from '@/components/provider';
import { cn } from '@/lib/cn';
import { createMetadata, siteUrl, defaultDescription } from '@/lib/metadata';
import { appName } from '@/lib/shared';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = createMetadata({
  title: {
    template: `%s · ${appName}`,
    default: appName,
  },
  description: defaultDescription,
  metadataBase: siteUrl,
});

// Next's `viewport.themeColor` is a browser-chrome `<meta>` tag value, resolved before any CSS
// (including our `@theme inline` custom properties) loads — it must be a literal color, not a
// token reference. Values mirror packages/design-tokens `--background` light/dark (theme.css :root / .dark).
export const viewport: Viewport = {
  themeColor: [
    // eslint-disable-next-line no-restricted-syntax -- literal required, see comment above
    { media: '(prefers-color-scheme: dark)', color: '#11100f' },
    // eslint-disable-next-line no-restricted-syntax -- literal required, see comment above
    { media: '(prefers-color-scheme: light)', color: '#fdfdfc' },
  ],
};

// Serif ACCENT face (D17): Newsreader (optical-size axis) — display emphasis + pull-quotes only.
// next/font self-hosts at build time, so the static export ships the woff2 itself (no runtime
// Google request) — the self-host half of the font-delivery contract (CX-10).
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', display: 'swap', style: ['normal', 'italic'] });

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, GeistMono.variable, newsreader.variable)}
      suppressHydrationWarning
    >
      {/* `isolate` (isolation: isolate) makes <body> a root stacking context so Base UI portaled
          popups — Dialog, Popover, Tooltip, Select, menus, Sheet — reliably render above the
          Fumadocs chrome. Required by Base UI's portal setup; mirrored in @vegastack/design-tokens/base.css
          for consumers. */}
      <body className="isolate flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
