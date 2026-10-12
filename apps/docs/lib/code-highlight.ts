// @vegastack code-highlight@0.25.25 sha256-OBkwgF4YUlBOrmZQP/ILnkzPaLMfjQ7djPC9DnXA3wA=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
