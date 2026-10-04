// @vegastack code-highlight@0.23.122 sha256-FwVXvL2Z0Ue75ssyLgbdRbBZzz6/lTQPVfSd7sfwKh4=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
