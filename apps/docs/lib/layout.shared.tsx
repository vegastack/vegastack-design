import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: appName },
    // NOTE: fumadocs' richer `GithubInfo` card was trialled here and REVERTED — it fetches
    // the repo from the GitHub API at render time, and while this repo is private/unpushed
    // the 404 crashes every docs page (and would fail the static build). Re-add once the
    // repo is public: links: [{ type: 'custom', children: <GithubInfo owner repo /> }].
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
