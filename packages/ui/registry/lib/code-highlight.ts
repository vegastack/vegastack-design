// @vegastack code-highlight@0.26.2 sha256-vf1SyY+YdAn1/MrHoh7ABJ8IkdoCqfozxMs1tcjF9KE=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
