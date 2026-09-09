"use client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "fumadocs-core/search/client";
// fumadocs-core 16.14 replaced Orama with ZBSearch behind the same module path and renamed
// `oramaStaticClient` → `staticClient` (the old name is a deprecated alias). The client now
// builds its own database from `/api/search`, so the `initOrama` factory — and the direct
// `@orama/orama` dependency it needed — are gone.
import { staticClient } from "fumadocs-core/search/client/orama-static";
import { useI18n } from "fumadocs-ui/contexts/i18n";

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    client: staticClient({ locale }),
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== "empty" ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
