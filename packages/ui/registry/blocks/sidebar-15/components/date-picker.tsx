// @vegastack sidebar-15@0.9.1 sha256-GXcN03O9y/TCSWM60sjuda9eC/zFuzW4C1sW8AF3s88=

"use client";

import * as React from "react";

import { Calendar } from "@/components/ui/calendar";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

export function DatePicker() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12),
  );
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          captionLayout="dropdown"
          className="bg-transparent [--cell-size:2.1rem]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
