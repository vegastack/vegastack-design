import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ActionList,
  ActionListEmpty,
  ActionListItem,
  RecordAsideCard,
  RecordAsideSection,
} from "./record-aside";

test("renders sections and edge-to-edge rows", async () => {
  const screen = await render(
    <RecordAsideCard>
      <RecordAsideSection title="Tasks" count={1}>
        <ActionList>
          <ActionListItem>Send the quote</ActionListItem>
        </ActionList>
        <ActionListEmpty>No suggestions</ActionListEmpty>
      </RecordAsideSection>
    </RecordAsideCard>,
  );
  await expect
    .element(screen.getByRole("region", { name: /Tasks/ }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});
