// @vegastack code-highlight@0.25.26 sha256-tjpF5I7wHKOc/JVokvBxsTQmV2hJ8eNecedGCHJLHSQ=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
