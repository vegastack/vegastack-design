import type { ReactElement } from "react";
import { afterEach, expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { ActionEmail } from "./action-email";
import { DigestEmail } from "./digest-email";
import { NotificationEmail } from "./notification-email";
import { EmailMarkdown } from "./email-markdown";
import { emailColors } from "./email-tokens";
import { renderEmail } from "./render";

const brand = { name: "Acme", url: "https://acme.example" };
const footer = {
  reason: "You're getting this because you follow this task.",
  links: [
    {
      label: "Manage notifications",
      href: "https://acme.example/settings/notifications",
    },
    {
      label: "Unsubscribe from comment emails",
      href: "https://acme.example/u/token",
    },
  ],
};

const TEMPLATES: Record<string, { element: ReactElement; href: string }> = {
  notification: {
    href: "https://acme.example/tasks/42#comment-7",
    element: (
      <NotificationEmail
        brand={brand}
        preview="Priya: Can we ship this by Friday?"
        heading="Priya commented on Fix login"
        quotes={[
          {
            author: "Priya",
            time: "Fri 9 Oct, 10:00 IST",
            body: "Can we ship this by Friday?",
          },
        ]}
        card={{
          title: "Fix login",
          href: "https://acme.example/tasks/42",
          meta: [{ label: "Due", value: "Fri 9 Oct, 18:00 IST" }],
        }}
        action={{
          label: "View comment",
          href: "https://acme.example/tasks/42#comment-7",
        }}
        footer={footer}
      />
    ),
  },
  digest: {
    href: "https://acme.example/inbox",
    element: (
      <DigestEmail
        brand={brand}
        preview="2 comments and 1 task due today"
        heading="Your day in Acme"
        body="3 updates since yesterday"
        groups={[
          {
            title: "Due today",
            items: [
              {
                text: "Fix login is due at 18:00 IST",
                href: "https://acme.example/tasks/42",
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
            ],
          },
        ]}
        more="And 4 more in your inbox."
        action={{ label: "Open inbox", href: "https://acme.example/inbox" }}
        footer={footer}
      />
    ),
  },
  action: {
    href: "https://acme.example/invite/3f9c2a",
    element: (
      <ActionEmail
        brand={brand}
        preview="Priya invited you to Acme"
        heading="Priya invited you to Acme"
        body="Join the Design space to see its tasks, pages and meetings."
        action={{
          label: "Accept invite",
          href: "https://acme.example/invite/3f9c2a",
        }}
        linkFallback="Or paste this link into your browser:"
        note="This invite expires in 7 days."
      />
    ),
  },
};

// Gmail clips a message over 102KB; stay well under it.
const GMAIL_CLIP_BYTES = 102_000;
const DARK_MEDIA = "@media (prefers-color-scheme:dark)";

// What caniemail reports for these templates, each a deliberate progressive enhancement that
// degrades to the light inline design: the dark `<style>` (class, attribute and descendant
// selectors, `@media`) where a client ignores it, the hidden preheader (`display:none`, `opacity`,
// `overflow`), table `role`, link `target`, rounded corners, the quote's line breaks and the
// fallback URL's wrapping. Anything NEW fails this suite and needs the same judgement.
const ACCEPTED_GAPS = [
  "Attribute selector",
  "Class selector",
  "Descendant combinator",
  "@media",
  "<body> element",
  "display:none",
  "overflow",
  "opacity",
  "role attribute",
  "target attribute",
  "border-radius",
  "white-space",
  "word-break",
];

/**
 * doiuse-email is written for Node: one of its dependencies (util, via micromatch) reads
 * `process.env` at import time. Give this page an empty `process.env` before loading it — it reads
 * nothing else from Node here.
 */
async function loadDoIUseEmail() {
  const scope = globalThis as { process?: { env: Record<string, string> } };
  scope.process ??= { env: {} };
  return import("doiuse-email");
}

let hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts) host.remove();
  hosts = [];
});

type Mode = "light" | "dark" | "outlook";

/**
 * Mount a rendered email's body into the page, with its style blocks, so axe and computed styles
 * can measure it. `dark` turns the `prefers-color-scheme` block on (the test page itself is
 * light); `outlook` marks the canvas the way Outlook.com marks the elements it recolours.
 */
function mount(html: string, mode: Mode): HTMLElement {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const host = document.createElement("div");
  host.lang = doc.documentElement.lang;
  for (const source of doc.querySelectorAll("style")) {
    const style = document.createElement("style");
    style.textContent = (source.textContent ?? "").replace(
      DARK_MEDIA,
      mode === "dark" ? "@media all" : "@media not all",
    );
    host.append(style);
  }
  host.append(...[...doc.body.childNodes].map((node) => node.cloneNode(true)));
  if (mode === "outlook") {
    const canvas = host.querySelector("table.vs-canvas")!;
    canvas.setAttribute("data-ogsc", "");
    canvas.setAttribute("data-ogsb", "");
  }
  document.body.append(host);
  hosts.push(host);
  return host;
}

/**
 * doiuse-email does not descend into `@media` blocks, so whatever sits inside one is never
 * checked. Lift the rules out of every at-rule so their selectors and declarations are.
 */
function liftMediaRules(html: string): string {
  return html.replace(/<style>([^<]*)<\/style>/g, (_, css: string) => {
    let out = "";
    let i = 0;
    while (i < css.length) {
      if (css[i] === "@") {
        const open = css.indexOf("{", i);
        let depth = 1;
        let j = open + 1;
        for (; j < css.length && depth > 0; j++) {
          if (css[j] === "{") depth++;
          else if (css[j] === "}") depth--;
        }
        out += css.slice(open + 1, j - 1);
        i = j;
      } else {
        out += css[i++];
      }
    }
    return `<style>${out}</style>`;
  });
}

async function unsupported(html: string): Promise<string[]> {
  const { doIUseEmail } = await loadDoIUseEmail();
  const found = new Set<string>();
  for (const candidate of [html, liftMediaRules(html)]) {
    const result = doIUseEmail(candidate, {
      emailClients: ["gmail.*", "outlook.*", "apple-mail.*"],
    });
    for (const error of result.success ? [] : result.errors) found.add(error);
  }
  return [...found].filter(
    (error) => !ACCEPTED_GAPS.some((gap) => error.startsWith(`\`${gap}\``)),
  );
}

for (const [name, { element, href }] of Object.entries(TEMPLATES)) {
  test(`${name}: a self-contained HTML email under Gmail's clip size, with a plain-text part`, async () => {
    const { html, text } = await renderEmail(element);
    expect(new TextEncoder().encode(html).length).toBeLessThan(
      GMAIL_CLIP_BYTES,
    );
    expect(html).toMatch(/<html[^>]* lang="en"/);
    expect(html).toContain('<meta name="color-scheme" content="light dark"/>');
    expect(html).toContain(
      '<meta name="supported-color-schemes" content="light dark"/>',
    );
    expect(html).toContain(DARK_MEDIA);
    expect(html).toContain("[data-ogsc] .vs-text");
    expect(html).toContain("[data-ogsb] .vs-surface");
    // Nothing external, nothing a client strips or blocks.
    expect(html).not.toMatch(/<link\b|<script\b|@import|@font-face|var\(--/i);
    expect(html).not.toMatch(/<!--\/?\$-->/);
    // No pure white or black for Gmail's inversion to special-case.
    expect(html.toLowerCase()).not.toMatch(/#(?:fff|ffffff|000|000000)\b/);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain(href);
    expect(text).not.toContain("PRIYA");
    expect(text).toContain("Sent with VegaStack");
  });

  test(`${name}: axe-clean, contrast included, in light, dark and Outlook.com dark`, async () => {
    const { html } = await renderEmail(element);
    for (const mode of ["light", "dark", "outlook"] as const) {
      await expectNoA11yViolations(mount(html, mode));
      hosts.pop()?.remove();
    }
  });

  test(`${name}: uses no email-client feature beyond the accepted enhancements`, async () => {
    const { html } = await renderEmail(element);
    expect(await unsupported(html)).toEqual([]);
  });
}

test("the compatibility check reaches inside @media blocks", async () => {
  const { html } = await renderEmail(TEMPLATES.notification!.element);
  const planted = html.replace(
    DARK_MEDIA + "{",
    DARK_MEDIA + "{.vs-planted{display:grid}",
  );
  expect((await unsupported(planted)).join("\n")).toContain("grid");
});

test("Outlook.com dark repaints text and fill together", async () => {
  const { html } = await renderEmail(TEMPLATES.notification!.element);
  const host = mount(html, "outlook");
  const dark = emailColors.dark;
  const rgb = (hex: string) =>
    `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
  const heading = host.querySelector("h1")!;
  const button = host.querySelector<HTMLElement>(".vs-button")!;
  expect(getComputedStyle(heading).color).toBe(rgb(dark.text));
  expect(getComputedStyle(button).backgroundColor).toBe(rgb(dark.buttonBg));
  expect(getComputedStyle(button).color).toBe(rgb(dark.buttonText));
});

test("classic Outlook gets a 600px ghost table, and quotes keep their line breaks", async () => {
  const { html, text } = await renderEmail(
    <NotificationEmail
      brand={brand}
      preview="Priya replied"
      heading="Priya commented on Fix login"
      quotes={[{ author: "Priya", body: "First line\nSecond line" }]}
      action={{ label: "View comment", href: "https://acme.example/c/1" }}
    />,
  );
  expect(html).toContain(
    '<!--[if mso]><table role="presentation" width="600" align="center"',
  );
  expect(html).toContain("<!--[if mso]></td></tr></table><![endif]-->");
  expect(html).not.toContain("data-vs-mso");
  expect(html).toContain("First line<br/>Second line");
  expect(text).toMatch(/First line\nSecond line/);
  expect(html.match(/<style>/g)).toHaveLength(2);
});

test("the button is a tap target of at least 44px, full width on a phone", async () => {
  const { html } = await renderEmail(TEMPLATES.notification!.element);
  const host = mount(html, "light");
  const style = document.createElement("style");
  // The phone-width rules, applied unconditionally.
  style.textContent = (
    new DOMParser().parseFromString(html, "text/html").querySelector("style")
      ?.textContent ?? ""
  ).replace("@media only screen and (max-width:599px)", "@media all");
  host.prepend(style);
  const button = host.querySelector<HTMLElement>(".vs-button")!;
  const box = button.getBoundingClientRect();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(getComputedStyle(button).display).toBe("block");
});

test("the footer note defaults to the VegaStack line, null hides it, and dir reaches the document", async () => {
  const hidden = await renderEmail(
    <ActionEmail
      brand={{ name: "Acme" }}
      preview="Reset your password"
      heading="Reset your password"
      dir="rtl"
      lang="ar"
      action={{ label: "Reset password", href: "https://acme.example/reset" }}
      footer={{ note: null }}
    />,
  );
  expect(hidden.text).not.toContain("Sent with VegaStack");
  expect(hidden.html).toMatch(/<html dir="rtl" lang="ar"/);
  // Without a URL the wordmark is plain text, not a link.
  expect(hidden.html).not.toContain('href="undefined"');
  expect(hidden.text.startsWith("Acme")).toBe(true);
});

test("noteHref links VegaStack in the default note, or the whole of a string note", async () => {
  const linked = await renderEmail(
    <ActionEmail
      brand={brand}
      preview="Reset your password"
      heading="Reset your password"
      action={{ label: "Reset password", href: "https://acme.example/reset" }}
      footer={{ noteHref: "https://vegastack.com" }}
    />,
  );
  expect(linked.html).toMatch(
    /Sent with(<!-- -->)? <a[^>]*href="https:\/\/vegastack\.com"[^>]*>VegaStack<\/a>/,
  );

  const custom = await renderEmail(
    <ActionEmail
      brand={brand}
      preview="Reset your password"
      heading="Reset your password"
      action={{ label: "Reset password", href: "https://acme.example/reset" }}
      footer={{ note: "Sent by Acme", noteHref: "https://acme.example" }}
    />,
  );
  expect(custom.html).toMatch(
    /<a[^>]*href="https:\/\/acme\.example"[^>]*>Sent by Acme<\/a>/,
  );

  const plain = await renderEmail(
    <ActionEmail
      brand={brand}
      preview="Reset your password"
      heading="Reset your password"
      action={{ label: "Reset password", href: "https://acme.example/reset" }}
    />,
  );
  expect(plain.text).toContain("Sent with VegaStack");
  expect(plain.html).not.toMatch(/<a[^>]*>VegaStack<\/a>/);
});

test("EmailMarkdown renders notes Markdown as safe email blocks", async () => {
  const { html } = await renderEmail(
    <EmailMarkdown
      appUrl="https://acme.example"
      markdown={[
        "## Decisions",
        "- [x] Ship **v2** & tell [@Priya](mention://user/u1)",
        "- See [the task](/tasks/42) or [bad](javascript:alert(1))",
        "",
        "<script>alert(1)</script>",
        "",
        "> Quoted `code`",
      ].join("\n")}
    />,
  );
  expect(html).toContain("<h3");
  expect(html).toContain("Decisions");
  expect(html).toContain("☑ ");
  expect(html).toContain("&amp; tell");
  expect(html).toContain('href="https://acme.example/tasks/42"');
  expect(html).not.toContain("javascript:");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("mention://");
  expect(html).toContain("vs-quote-bar");
});
