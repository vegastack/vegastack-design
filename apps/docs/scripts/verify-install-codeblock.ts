/**
 * The generated Install command must use Fumadocs' server code-block composition.
 *
 * Wrapping the highlighted `<Pre>` in a second `CodeBlock` leaves Shiki's light-theme
 * `background-color` on the inner pre. Light mode hides the mistake; dark mode exposes it as a
 * white strip behind the command. Render the real helper so this checks the output contract rather
 * than an implementation spelling.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { Command } from "@/components/generated-sections";

export function codeBlockProblems(html: string): string[] {
  const problems: string[] = [];
  const figures = html.match(/<figure\b/g) ?? [];
  const pres = html.match(/<pre\b/g) ?? [];
  const figure = /<figure\b[^>]*>/.exec(html)?.[0] ?? "";

  if (figures.length !== 1) {
    problems.push(`expected one code-block figure, found ${figures.length}`);
  }
  if (pres.length !== 1) {
    problems.push(`expected one code pre, found ${pres.length}`);
  }
  if (!figure.includes("--shiki-dark-bg:")) {
    problems.push(
      "the Shiki theme variables are not owned by the outer figure",
    );
  }
  if (/background-color\s*:/.test(html)) {
    problems.push(
      "a highlighted child retained its own background-color (white strip in dark mode)",
    );
  }
  return problems;
}

if (process.argv.includes("--self-test")) {
  const broken =
    '<figure class="shiki"><div><pre class="shiki github-light github-dark" style="background-color:#fff;--shiki-dark-bg:#24292e"><code>pnpm</code></pre></div></figure>';
  const reported = codeBlockProblems(broken);
  if (
    !reported.some((problem) => problem.includes("background-color")) ||
    !reported.some((problem) => problem.includes("outer figure"))
  ) {
    console.error(
      `✗ verify-install-codeblock --self-test: broken nested surface was not rejected (${reported.join("; ") || "nothing reported"})`,
    );
    process.exit(1);
  }
  console.log(
    "✓ verify-install-codeblock --self-test: the pre-fix nested light background is rejected",
  );
  process.exit(0);
}

const command = "pnpm dlx shadcn@latest add @vegastack/dropzone";
const node = await Command({ command });
const html = renderToStaticMarkup(node);
const problems = codeBlockProblems(html);

if (problems.length > 0) {
  console.error(
    `✗ verify-install-codeblock:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  "✓ verify-install-codeblock: one themed Fumadocs surface, with no child background override",
);
