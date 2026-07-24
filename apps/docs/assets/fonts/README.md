# Open Graph build fonts

These files are embedded into statically generated Open Graph PNGs. They are build inputs, not
runtime web fonts.

| File                            | Source                                                  | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `Geist-Regular.ttf`             | `geist@1.7.2`                                           | `5c8968eafb98a4c4f47033daf29e38e284a6f2a82eb017d171ab040fe7c4b615` |
| `Geist-Bold.ttf`                | `geist@1.7.2`                                           | `e866b423b755233cae8bce6a37519f6fe630be9772fa08fc3114bff15bc8580f` |
| `NotoSansSymbols2-Regular.woff` | `@fontsource/noto-sans-symbols-2@5.3.0`, symbols subset | `037f0debac96bfbae0376e70a419ddef2c0b17b12655396c89ac6d950ee2bca0` |

Geist renders the Latin copy and Noto Sans Symbols 2 supplies symbols missing from Geist,
including U+2318 COMMAND PLACE (`⌘`). The adjacent license files must remain with the fonts.
