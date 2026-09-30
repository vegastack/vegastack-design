// @vegastack code-highlight@0.23.96 sha256-u+3G6FKbLPx5KlAvS0+rwboq5lQAIXs35rvaL0SI4Hs=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
