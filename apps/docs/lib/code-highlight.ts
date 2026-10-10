// @vegastack code-highlight@0.25.12 sha256-SI7spdfDZzt2cgUcvp+B6TH8xWkAJuozMZUy1e5uXBQ=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
