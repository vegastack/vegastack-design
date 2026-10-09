"use client";

/**
 * `preview/email-kit.tsx` — the docs live previews for the `email-kit` registry block.
 *
 * An email is a whole HTML document, so each preview renders the REAL template (a cross-package
 * relative import, like every block preview here) to HTML with the kit's own `renderEmail`, then
 * shows it in two sandboxed iframes: light, and dark with the kit's `prefers-color-scheme` block
 * forced on. The kit and react-email load with a dynamic `import()` on mount, so they stay out of
 * the preview barrel's initial bundle.
 */

import { createElement, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";

type Sample = "notification" | "digest" | "action" | "markdown";

const brand = { name: "Acme", url: "https://acme.example" };
const preferences = {
  label: "Manage notifications",
  href: "https://acme.example/settings/notifications",
};

async function renderSample(sample: Sample): Promise<string> {
  const [
    { renderEmail },
    { NotificationEmail },
    { DigestEmail },
    { ActionEmail },
    { EmailLayout },
    { EmailMarkdown },
  ] = await Promise.all([
    import("../../../../packages/ui/registry/blocks/email-kit/render"),
    import("../../../../packages/ui/registry/blocks/email-kit/notification-email"),
    import("../../../../packages/ui/registry/blocks/email-kit/digest-email"),
    import("../../../../packages/ui/registry/blocks/email-kit/action-email"),
    import("../../../../packages/ui/registry/blocks/email-kit/email-layout"),
    import("../../../../packages/ui/registry/blocks/email-kit/email-markdown"),
  ]);
  const element =
    sample === "markdown"
      ? createElement(EmailLayout, {
          brand,
          preview: "Notes ready for Weekly sync",
          children: createElement(EmailMarkdown, {
            appUrl: brand.url,
            markdown: [
              "## Summary",
              "The team agreed to ship the **login fix** on Friday; [@Priya](mention://user/u1) owns the release.",
              "",
              "### Decisions",
              "1. Freeze the release branch on Thursday.",
              "2. Move the analytics work to [next sprint](/tasks/42).",
              "",
              "- [x] QA sign-off",
              "- [ ] Release notes",
              "",
              "> Ship small, ship often.",
            ].join("\n"),
          }),
        })
      : sample === "notification"
        ? createElement(NotificationEmail, {
            brand,
            preview: "Priya: Can we ship this by Friday?",
            heading: "Priya commented on Fix login",
            quotes: [
              {
                author: "Priya",
                time: "Fri 9 Oct, 10:00 IST",
                body: "Can we ship this by Friday? The login fix is the last thing blocking the release.",
              },
            ],
            card: {
              title: "Fix login",
              href: "https://acme.example/tasks/42",
              meta: [
                { label: "Status", value: "In progress" },
                { label: "Due", value: "Fri 9 Oct, 18:00 IST" },
              ],
            },
            action: {
              label: "View comment",
              href: "https://acme.example/tasks/42#comment-7",
            },
            footer: {
              reason: "You're getting this because you follow this task.",
              noteHref: "https://vegastack.com",
              links: [
                preferences,
                {
                  label: "Unsubscribe from comment emails",
                  href: "https://acme.example/unsubscribe/comments",
                },
              ],
            },
          })
        : sample === "digest"
          ? createElement(DigestEmail, {
              brand,
              preview: "2 comments and 2 tasks due today",
              heading: "Your day in Acme",
              body: "4 updates since yesterday",
              groups: [
                {
                  title: "Due today",
                  items: [
                    {
                      text: "Fix login is due at 18:00 IST",
                      href: "https://acme.example/tasks/42",
                    },
                    {
                      text: "Write release notes is due at 20:00 IST",
                      href: "https://acme.example/tasks/43",
                    },
                  ],
                },
                {
                  title: "Fix login",
                  items: [
                    {
                      actor: "Priya",
                      text: "commented: Can we ship this by Friday?",
                      href: "https://acme.example/tasks/42#comment-7",
                      time: "10:00 IST",
                    },
                    {
                      actor: "Anand",
                      text: "changed the status to In review",
                      href: "https://acme.example/tasks/42",
                      time: "11:30 IST",
                    },
                  ],
                },
              ],
              more: "And 4 more in your inbox.",
              action: {
                label: "Open inbox",
                href: "https://acme.example/inbox",
              },
              footer: {
                reason: "You're getting this because the daily digest is on.",
                links: [preferences],
              },
            })
          : createElement(ActionEmail, {
              brand,
              preview: "Priya invited you to the Design space in Acme",
              heading: "Priya invited you to Acme",
              body: "Join the Design space to see its tasks, pages and meetings.",
              card: {
                title: "Design",
                meta: [{ label: "Members", value: "12" }],
              },
              action: {
                label: "Accept invite",
                href: "https://acme.example/invite/3f9c2a",
              },
              linkFallback: "Or paste this link into your browser:",
              note: "This invite expires in 7 days. If you didn't expect it, you can ignore this email.",
            });
  return (await renderEmail(element)).html;
}

/**
 * Pin each frame to one mode whatever the reader's OS prefers: the dark frame turns the kit's
 * `prefers-color-scheme` block on, the light frame turns it off.
 */
const DARK_MEDIA = "@media (prefers-color-scheme:dark)";
const inMode = (html: string, mode: "Light" | "Dark") =>
  html.replace(DARK_MEDIA, mode === "Dark" ? "@media all" : "@media not all");

function EmailFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(560);
  const fit = () => {
    const body = ref.current?.contentDocument?.documentElement;
    if (body) setHeight(body.scrollHeight);
  };
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      // Same origin so the frame can be measured; no scripts, no navigation out of the preview.
      sandbox="allow-same-origin"
      onLoad={fit}
      className="block w-full rounded-md border border-border"
      style={{ height }}
    />
  );
}

function EmailSample({ sample, label }: { sample: Sample; label: string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void renderSample(sample).then((next) => {
      if (live) setHtml(next);
    });
    return () => {
      live = false;
    };
  }, [sample]);
  return (
    <Wrapper className="block p-4">
      <div className="grid w-full gap-4 lg:grid-cols-2">
        {(["Light", "Dark"] as const).map((mode) => (
          <figure key={mode} className="m-0 grid min-w-0 gap-2">
            <figcaption className="text-sm text-muted-foreground">
              {mode}
            </figcaption>
            {html ? (
              <EmailFrame
                html={inMode(html, mode)}
                title={`${label}, ${mode.toLowerCase()} mode`}
              />
            ) : (
              <div
                className="h-[560px] w-full rounded-md border border-border bg-muted"
                aria-hidden
              />
            )}
          </figure>
        ))}
      </div>
    </Wrapper>
  );
}

/** `NotificationEmail`: one comment on a task — quote, record card, one button, footer links. */
export function emailKitNotification(): ReactNode {
  return <EmailSample sample="notification" label="Notification email" />;
}

/** `DigestEmail`: the daily digest — due today, then activity grouped by record. */
export function emailKitDigest(): ReactNode {
  return <EmailSample sample="digest" label="Digest email" />;
}

/** `EmailMarkdown`: notes Markdown in the in-app reading styles, inside an `EmailLayout`. */
export function emailKitMarkdown(): ReactNode {
  return <EmailSample sample="markdown" label="Markdown email" />;
}

/** `ActionEmail`: an invite — body, card, button, raw-link fallback and an expiry note. */
export function emailKitAction(): ReactNode {
  return <EmailSample sample="action" label="Action email" />;
}
