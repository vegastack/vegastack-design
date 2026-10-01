// @vegastack code-highlight@0.23.110 sha256-cGJjI1CqY5wEeZu4qfTKRhl7Jyr2ASoeQr+8J9fwXS8=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
