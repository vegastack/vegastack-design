// @vegastack sidebar-15@0.9.1 sha256-GXcN03O9y/TCSWM60sjuda9eC/zFuzW4C1sW8AF3s88=

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
    isActive?: boolean;
  }[];
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            isActive={item.isActive}
            render={<a href={item.url} />}
          >
            {item.icon}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
