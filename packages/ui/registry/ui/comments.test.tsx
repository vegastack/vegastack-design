import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { CommentComposer, CommentList } from "./comments";

test("lists comments with a count, and shows the empty state", async () => {
  const screen = await render(
    <CommentList
      comments={[
        {
          id: "a",
          author: { name: "Asha Rao" },
          body: "Hello",
          createdAt: Date.now(),
        },
      ]}
      composer={
        <CommentComposer author={{ name: "Asha Rao" }} onSubmit={() => {}} />
      }
    />,
  );
  await expect.element(screen.getByText("Hello")).toBeVisible();
  expect(screen.container.querySelector("#comment-a")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
  const empty = await render(<CommentList comments={[]} />);
  await expect.element(empty.getByText("No comments yet")).toBeVisible();
});
