---
"@vegastack/design": patch
---

🛠 `vegastack-design check-updates` and the registry verification behind `add` retry transient registry failures before reporting the registry unreachable. A network error ("fetch failed"), a response cut off mid-read ("terminated"), a 5xx or a 429 gets up to three tries, with jittered exponential backoff, a 15-second timeout per try and `Retry-After` honoured (seconds or a date, up to 5 seconds). Item fetches still run at most eight at a time. A 404, a 401/403 or an integrity mismatch is still an answer and fails at once. This stops `--fail-on-update` from failing CI on a passing network flake. [docs](https://design.vegastack.com/docs/guides/troubleshooting)
