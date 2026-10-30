// @vegastack code-highlight@0.26.3 sha256-TQWP4ZxDbu8j7v+qeRfp+uBpNZUuBuQYU5k7+CvOWUc=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
