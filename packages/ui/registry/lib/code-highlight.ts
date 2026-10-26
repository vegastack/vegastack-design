// @vegastack code-highlight@0.25.87 sha256-E6Xnc/9ei+1H3d8g/QbYglCLeaDknvb7ZLja5IOU8+0=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
