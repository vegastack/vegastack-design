---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **TruncatedText**: a truncating cell inside a grid or list host costs less to mount. Measured on contact (a host-owned, hover-capable cell), `TruncatedText` and `IconText` keep their element in a ref, so a newly mounted cell renders once instead of twice; observed elements are unchanged. Every `TruncatedText` and `IconText` reads `(hover: none)` from one shared list and listener instead of calling `matchMedia` on each read. [docs](https://design.vegastack.com/docs/components/truncated-text)
