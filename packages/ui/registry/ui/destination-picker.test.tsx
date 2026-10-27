import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DestinationPicker, type Destination } from "./destination-picker";

const SPACES = [
  { id: "s1", label: "Sales" },
  { id: "s2", label: "Design" },
];
const loadFolders = async (spaceId: string, parentId: string | null) =>
  spaceId === "s1" && parentId === null
    ? [
        { id: "f1", label: "Contracts", hasChildren: false },
        { id: "f2", label: "Archive", hasChildren: false },
      ]
    : [];

function Host(props: Partial<React.ComponentProps<typeof DestinationPicker>>) {
  const [value, setValue] = React.useState<Destination | null>(null);
  return (
    <>
      <output data-testid="value">
        {value ? `${value.spaceId}/${value.folderId ?? "top"}` : ""}
      </output>
      <DestinationPicker
        spaces={SPACES}
        loadFolders={loadFolders}
        value={value}
        onValueChange={setValue}
        {...props}
      />
    </>
  );
}

test("a space is its top level; opening it loads its folders, and a folder can be chosen", async () => {
  const screen = await render(<Host />);
  await userEvent.click(
    screen.getByRole("button", { name: "Sales", exact: true }),
  );
  await expect.element(screen.getByTestId("value")).toHaveTextContent("s1/top");
  await userEvent.click(screen.getByRole("button", { name: "Sales folder" }));
  await userEvent.click(screen.getByRole("button", { name: "Contracts" }));
  await expect.element(screen.getByTestId("value")).toHaveTextContent("s1/f1");
  await expectNoA11yViolations(screen.container);
});

test("a destination with a reason is shown, refused and explained", async () => {
  const screen = await render(
    <Host
      disabledReason={(d) =>
        d.folderId === null && d.spaceId === "s2"
          ? "You can't add here"
          : undefined
      }
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Design", exact: true }),
    { force: true },
  );
  await expect.element(screen.getByTestId("value")).toHaveTextContent("");
  await expect
    .poll(
      () =>
        screen.container.querySelector(
          '[data-slot="destination-picker-refused"]',
        )?.textContent,
    )
    .toBe("You can't add here");
});

test("recents and search find a destination anywhere", async () => {
  const search = vi.fn(async (query: string) =>
    query === "arch"
      ? [{ spaceId: "s1", folderId: "f2", label: "Archive", path: "Sales" }]
      : [],
  );
  const screen = await render(
    <Host
      recents={[
        { spaceId: "s1", folderId: "f1", label: "Contracts", path: "Sales" },
      ]}
      search={search}
    />,
  );
  await expect.element(screen.getByText("Recent")).toBeVisible();
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search folders" }),
    "arch",
  );
  await userEvent.click(screen.getByRole("button", { name: /Archive/ }));
  await expect.element(screen.getByTestId("value")).toHaveTextContent("s1/f2");
});

test("ids with delimiters round-trip, and a refused tree row is aria-disabled with its reason", async () => {
  function Odd() {
    const [value, setValue] = React.useState<Destination | null>(null);
    return (
      <>
        <output data-testid="value">
          {value ? `${value.spaceId}/${value.folderId ?? "top"}` : ""}
        </output>
        <DestinationPicker
          spaces={[{ id: "tenant:sales", label: "Sales" }]}
          loadFolders={async () => [
            { id: "a|b:c", label: "Odd", hasChildren: false },
          ]}
          value={value}
          onValueChange={setValue}
          disabledReason={(d) =>
            d.folderId === null ? "Pick a folder" : undefined
          }
        />
      </>
    );
  }
  const screen = await render(<Odd />);
  const space = screen.getByRole("button", { name: "Sales", exact: true });
  await expect.element(space).toHaveAttribute("aria-disabled", "true");
  await expect.element(space).toHaveAccessibleDescription("Pick a folder");
  await userEvent.click(screen.getByRole("button", { name: "Sales folder" }));
  await userEvent.click(screen.getByRole("button", { name: "Odd" }));
  await expect
    .element(screen.getByTestId("value"))
    .toHaveTextContent("tenant:sales/a|b:c");
});
