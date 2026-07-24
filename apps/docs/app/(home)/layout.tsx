import { HomeLayout } from "fumadocs-ui/layouts/home";
import { HomeFooter } from "@/components/home-footer";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      <HomeFooter />
    </>
  );
}
