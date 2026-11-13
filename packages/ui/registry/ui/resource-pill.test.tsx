import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { InlineChipProvider } from "./inline-chip";
import { LinkProvider } from "./link-provider";
import { ResourcePill, resourceNoun } from "./resource-pill";

const pill = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[data-slot="inline-chip"]')!;

test("a Doc is a link with its real title, named with what it is, opening in a new tab", async () => {
  const screen = await render(
    <p>
      Notes are in{" "}
      <ResourcePill
        data={{
          kind: "doc",
          url: "https://docs.google.com/document/d/1",
          title: "Q3 pricing",
        }}
      />
      .
    </p>,
  );
  const link = screen.getByRole("link", {
    name: "Q3 pricing, Google Doc (opens in new tab)",
  });
  await expect.element(link).toBeVisible();
  const element = link.element() as HTMLAnchorElement;
  expect(element.getAttribute("href")).toBe(
    "https://docs.google.com/document/d/1",
  );
  expect(element.target).toBe("_blank");
  expect(element.rel).toContain("noopener");
  expect(element.dataset.resourceKind).toBe("doc");
  expect(element.textContent).toBe("Q3 pricing");
  expect(element.textContent).not.toMatch(/\d+$/);
  await expectNoA11yViolations(screen.container);
});

test("a Drive file's type names it: a Google Sheet stored in Drive reads as a Sheet", async () => {
  const screen = await render(
    <ResourcePill
      data={{
        kind: "drive_file",
        url: "https://drive.google.com/file/d/1",
        title: "Fixture schedule",
        mimeType: "application/vnd.google-apps.spreadsheet",
      }}
    />,
  );
  expect(pill(screen.container).dataset.resourceKind).toBe("sheet");
  expect(resourceNoun({ kind: "meet" })).toBe("Google Meet");
});

test("the host's onOpen is not asked: a resource is a link, an in-app one opens in place", async () => {
  const opened: string[] = [];
  const navigated: string[] = [];
  const screen = await render(
    <LinkProvider
      origin="https://app.vegastack.com"
      navigate={(path) => navigated.push(path)}
    >
      <InlineChipProvider
        value={{
          onOpen: (target) => {
            opened.push(target.id);
          },
        }}
      >
        <ResourcePill
          data={{
            kind: "record",
            url: "https://app.vegastack.com/tasks/t1",
            title: "Prospect research",
          }}
        />
      </InlineChipProvider>
    </LinkProvider>,
  );
  const link = screen.getByRole("link", { name: "Prospect research, Item" });
  (link.element() as HTMLElement).click();
  expect(opened).toEqual([]);
  expect(navigated).toEqual(["/tasks/t1"]);
});
