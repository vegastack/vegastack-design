import { internalSource } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/internal">) {
  return (
    <DocsLayout tree={internalSource.getPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
