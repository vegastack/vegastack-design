# Base UI vs Radix Drift

## Conclusion

The current first-party component source is **Base/native**, not Radix-mixed.

The repo still has **maintenance-tooling drift**:

- `apps/docs/components.json` makes the docs app resolve as Radix in the shadcn CLI.
- `apps/docs/package.json` has a direct `radix-ui` dependency with no direct first-party import found.
- `Command` intentionally or accidentally depends on `cmdk`; `cmdk` brings Radix transitively.
- `AGENTS.md` says `--base base-ui`, but the current shadcn CLI uses `--base base`.

## Evidence

| Evidence                                                   | Result                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `rg "from ['\"](@radix-ui                                  | radix-ui)" apps packages tooling`                                      | No first-party component/source imports found. |
| `pnpm dlx shadcn@latest info -c apps/docs --json`          | `"config.base": "radix"` and Radix upstream links.                     |
| `pnpm dlx shadcn@latest add button --dry-run -c apps/docs` | Proposes overwriting `components/ui/button.tsx` and adding `radix-ui`. |
| `pnpm dlx shadcn@latest init --help` / CLI docs            | `--base <base>` accepts `radix` or `base`.                             |
| `pnpm --filter @vegastack/ui why @radix-ui/react-dialog`   | `@radix-ui/react-dialog` arrives through `cmdk@1.1.1`.                 |
| `pnpm --filter @vegastack/docs why radix-ui`               | Direct docs dependency only.                                           |

## Classification

| Area                            | Status                                 | Notes                                                                            |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| Canonical registry components   | Healthy with component-specific issues | Base UI imports where primitives exist; native/custom implementations elsewhere. |
| Docs copy-in components         | Healthy parity                         | Synced byte-for-byte from canonical source.                                      |
| Generated registry JSON         | Healthy                                | Headers/integrity/consume checks pass under Node 24.                             |
| shadcn project config           | P1 drift                               | shadcn sees Radix and can route future maintenance to Radix baselines.           |
| Direct Radix package dependency | P2 cleanup                             | Remove if no direct import needs it.                                             |
| `cmdk`                          | Needs explicit exception               | shadcn still uses `cmdk` for Command; decide whether this is approved.           |
| Project instructions            | P2 wording drift                       | Update `--base base-ui` to current `--base base`.                                |

## Required Fix Direction

1. Make `pnpm dlx shadcn@latest info -c apps/docs --json` report `"base": "base"`.
2. Add a CI guard that fails if the docs app resolves as Radix.
3. Remove direct `radix-ui` from `apps/docs/package.json` if `lint`, `typecheck`, and docs build pass without it.
4. Document `cmdk` as an allowed transitive exception or replace Command with a zero-Radix alternative.
5. Update project docs to say current shadcn uses `--base base`.
