---
---

🛠 **`verify-mdx-manifest`** (docs `lint`) proves the agent export fails closed on the three
failures that leave no artefact behind for `verify-docs-export` to find: an MDX component no manifest
entry classifies, a placeholder whose runtime renderer is missing (nested ones included), and a
component registered in the MDX map but absent from the manifest. Before it, the first rendered to a
single space and the second to its bare children.
