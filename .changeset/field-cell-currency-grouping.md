---
"@vegastack/ui": patch
---

🐛 `FieldCellDisplay` and `FieldInput` group a rupee amount in lakhs and crores wherever it is read: `INR` 588000 reads ₹5,88,000.00, not ₹588,000.00. A small currency-to-locale map (`INR` → `en-IN`) sets a currency's own grouping; every other currency and `config.decimals` are unchanged.
