// @vegastack code-highlight@0.25.43 sha256-BNu7bC25ovvj4I5KYrbkOUFQ80uw2JV5Hu7YBEDl/8k=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
