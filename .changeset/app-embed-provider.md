---
"@vegastack/ui": minor
---

🧩 TextEdit and MarkdownView: `appEmbed` — the host app's own embeds. `{ hosts, render }` (`AppEmbed`, from `embed-providers`) makes a link alone on its line to exactly `https://<host>/recordings/<uuid>` on one of `hosts` an `embed` block with provider `app` that the host draws with `render(url)` (its own card and player); no frame, no `frame-src` origin. Matching is strict (`matchAppEmbed`: lowercase UUID, no other path or `/meetings` alias, no query, hash, credentials or port). It writes to Markdown as its URL alone on the line, so any other reader keeps a link; without `appEmbed` it stays a link. `markdownToDoc` and `normalizeMarkdown` take `appEmbedHosts`, `textEditExtensions` takes `appEmbedHosts`, and `MarkdownAppEmbed` wraps the host's card.
