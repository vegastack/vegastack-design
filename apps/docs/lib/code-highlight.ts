// @vegastack code-highlight@0.23.119 sha256-ZUL7AAgnprwvrN7XyqeMnjb+DPD3oMUZiXexFisY8+Q=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
