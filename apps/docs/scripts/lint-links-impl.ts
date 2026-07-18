/**
 * The actual link check — see `lint-links.ts` for the loader bootstrap. Scans every route the
 * app serves (app-router preset + the docs catch-all populated from the fumadocs source), then
 * validates every internal link in the MDX content, including `#fragment` links against each
 * page's real TOC. Any broken link exits non-zero.
 */
import { printErrors, scanURLs, validateFiles, type FileObject } from 'next-validate-link';
import { source } from '@/lib/source';

function getHeadings(page: (typeof source)['$inferPage']): string[] {
  return page.data.toc.map((item) => item.url.slice(1));
}

async function getFiles(): Promise<FileObject[]> {
  return Promise.all(
    source.getPages().map(
      async (page): Promise<FileObject> => ({
        // `absolutePath` is typed optional (non-file-backed sources); every page in this
        // app is file-backed, so fall back to the page URL purely for the error display.
        path: page.absolutePath ?? page.url,
        content: await page.data.getText('raw'),
        url: page.url,
        data: page.data,
      }),
    ),
  );
}

const scanned = await scanURLs({
  preset: 'next',
  populate: {
    'docs/[[...slug]]': source.getPages().map((page) => ({
      value: { slug: page.slugs },
      hashes: getHeadings(page),
    })),
  },
});

const files = await getFiles();
const errors = await validateFiles(files, {
  scanned,
  markdown: {
    // Components whose attributes carry internal links.
    components: { Card: { attributes: ['href'] } },
  },
  checkRelativePaths: 'as-url',
});

printErrors(errors, true);
console.log(`✓ lint-links: ${files.length} pages validated, no broken links`);
