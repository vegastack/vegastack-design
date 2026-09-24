---
---

🛠 The real `shadcn add` consume gate retries a `shadcn add` that fails on a transient network error (EAI_AGAIN and friends from ui.shadcn.com) twice before failing, so a runner's flaky resolver no longer blocks a deploy; every other failure still fails on the first attempt.
