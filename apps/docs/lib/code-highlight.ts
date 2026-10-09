// @vegastack code-highlight@0.25.1 sha256-8Rgk2BT0y7zzfp0papD+RddG0i/W4MrQtmXzsd7F8Ks=

import { common, createLowlight } from "lowlight";

/**
 * The one lowlight instance (highlight.js `common` grammars) `CodeBlock` and `TextEdit`'s code
 * block share. Its own module so the grammars load only where code is highlighted: `CodeBlock`
 * imports it dynamically after mount, and the editor chunk statically — one instance either way.
 */
export const codeLowlight = createLowlight(common);
