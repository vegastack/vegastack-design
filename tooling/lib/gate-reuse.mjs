import { verifyReceipt } from "./gate-receipt.mjs";
import { PRODUCTION_PROFILE } from "./gate-profile.mjs";
import { COMPONENT_ROUTES } from "./route-scope.mjs";

export const EXACT_TREE_REUSABLE_GATES = [
  "unit",
  "smoke",
  "all-browsers",
  "contracts",
];

export function assessExactTreeProductionReceipt(receipt, context) {
  if (receipt?.__unreadable)
    return {
      eligible: false,
      reusableGates: [],
      problems: [`gate receipt is unreadable: ${receipt.__unreadable}`],
      reason: `gate receipt is unreadable: ${receipt.__unreadable}`,
    };
  if (receipt?.carriedFrom !== undefined)
    return {
      eligible: false,
      reusableGates: [],
      problems: [
        "carried version-bump evidence was executed on another tree and is not exact-tree reuse",
      ],
      reason:
        "carried version-bump evidence was executed on another tree and is not exact-tree reuse",
    };
  if (receipt?.profile !== PRODUCTION_PROFILE)
    return {
      eligible: false,
      reusableGates: [],
      problems: [
        `gate receipt profile is ${receipt?.profile ?? "missing"}, not production-full`,
      ],
      reason: `gate receipt profile is ${receipt?.profile ?? "missing"}, not production-full`,
    };
  if (receipt?.tree !== context.treeHash)
    return {
      eligible: false,
      reusableGates: [],
      problems: [
        `gate receipt describes different content (${receipt?.tree ?? "missing"} versus ${context.treeHash})`,
      ],
      reason: `gate receipt describes different content (${receipt?.tree ?? "missing"} versus ${context.treeHash})`,
    };
  const { problems } = verifyReceipt(receipt, {
    treeHash: context.treeHash,
    required: { contracts: true, unit: true, smoke: true },
    pinned: context.pinned,
    contractSha: context.contractSha,
    allowedSkips: [],
    profile: PRODUCTION_PROFILE,
    contractRoutes: COMPONENT_ROUTES,
  });
  return {
    eligible: problems.length === 0,
    reusableGates: problems.length === 0 ? [...EXACT_TREE_REUSABLE_GATES] : [],
    problems: problems.slice(0, 10),
    reason:
      problems.length === 0
        ? "verified production-full evidence was executed on this exact tree"
        : `${problems.slice(0, 3).join("; ")}${problems.length > 3 ? `; … ${problems.length - 3} more problem(s)` : ""}`,
  };
}

function candidateHasFailure(candidate) {
  return (
    (candidate.skips?.length ?? 0) > 0 ||
    Object.values(candidate.gates ?? {}).some(
      (gate) => gate?.status === "fail" || gate?.status === "skipped",
    )
  );
}

/**
 * Exact-tree evidence is monotonic. A successful scoped/change receipt cannot erase a verified full
 * receipt. A later deliberate skip/failure is still made visible by annotating the strong receipt,
 * so it cannot silently pass CI while its canonical production leaves remain available for review.
 */
export function chooseMonotonicReceipt({ existing, candidate, context }) {
  const assessment = assessExactTreeProductionReceipt(existing, context);
  if (!assessment.eligible)
    return {
      receipt: candidate,
      disposition: "wrote-candidate",
      assessment,
    };
  if (candidateHasFailure(candidate)) {
    const failedGates = Object.fromEntries(
      Object.entries(candidate.gates ?? {}).filter(([, gate]) =>
        ["fail", "skipped"].includes(gate?.status),
      ),
    );
    return {
      receipt: {
        ...existing,
        writtenAt: candidate.writtenAt,
        gates: { ...existing.gates, ...failedGates },
        skips: candidate.skips ?? [],
        observedWeakerRun: {
          mode: candidate.mode,
          writtenAt: candidate.writtenAt,
        },
      },
      disposition: "annotated-production-full-failure",
      assessment,
    };
  }
  return {
    receipt: existing,
    disposition: "preserved-production-full",
    assessment,
  };
}

/** Shadow-only until the recorded following-run checkpoint is satisfied and MK approves enablement. */
export function exactTreeReusePlan(
  receipt,
  context,
  { plannedGates = EXACT_TREE_REUSABLE_GATES } = {},
) {
  const assessment = assessExactTreeProductionReceipt(receipt, context);
  return {
    schema: 1,
    enabled: false,
    decision: assessment.eligible ? "would-reuse" : "execute",
    wouldReuse: assessment.eligible
      ? plannedGates.filter((gate) => assessment.reusableGates.includes(gate))
      : [],
    execute: [...plannedGates],
    reason: assessment.reason,
    checkpoint:
      "disabled until 20 following push observations show exact-tree agreement and MK approves enablement",
  };
}
