import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import github from "thesvg/github";
import { BrandIcon } from "@vegastack/design/icons";
import { gitConfig } from "./shared";
import { BrandNavigationTitle } from "@/components/brand-navigation-title";

export function baseOptions(): BaseLayoutProps {
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

  return {
    nav: { title: <BrandNavigationTitle /> },
    // NOTE: fumadocs' richer `GithubInfo` card was trialled here and REVERTED — it fetches
    // the repo from the GitHub API at render time, and while this repo is private/unpushed
    // the 404 crashes every docs page (and would fail the static build). Re-add once the
    // repo is public: links: [{ type: 'custom', children: <GithubInfo owner repo /> }].
    links: [
      {
        type: "icon",
        url: githubUrl,
        text: "GitHub",
        label: "GitHub",
        icon: (
          <BrandIcon icon={github} variant="mono" size="md" aria-label="" />
        ),
        external: true,
      },
    ],
  };
}
