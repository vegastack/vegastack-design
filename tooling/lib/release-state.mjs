const RELEASE_SURFACE = /^(packages\/|\.changeset\/)/;
const RELEASE_WORKFLOW = /^\.github\/workflows\/release\.ya?ml$/;

export function interpretNpmLookup({
  status,
  stdout = "",
  stderr = "",
  error,
  expected,
}) {
  if (status === 0) {
    try {
      const value = JSON.parse(stdout.trim());
      return value === expected
        ? { status: "published", version: value }
        : {
            status: "unknown",
            reason: `registry returned ${JSON.stringify(value)}; expected ${expected}`,
          };
    } catch {
      return { status: "unknown", reason: "npm returned malformed JSON" };
    }
  }
  if (/\bE404\b/.test(stderr)) return { status: "missing" };
  const reason = error?.code
    ? `npm lookup failed: ${error.code}`
    : `npm lookup failed${status == null ? "" : ` with exit ${status}`}${stderr.trim() ? `: ${stderr.trim().slice(0, 240)}` : ""}`;
  return { status: "unknown", reason };
}

export function classifyReleaseState({
  changedFiles,
  changesets,
  publicPackages,
  versionPr,
}) {
  const nonempty = changesets.filter((entry) => entry.releases.length > 0);
  const empty = changesets.filter((entry) => entry.releases.length === 0);
  const invalid = changesets.filter((entry) => entry.error);
  const workflowChanged = changedFiles.some((file) =>
    RELEASE_WORKFLOW.test(file),
  );
  const releaseSurfaceChanged = changedFiles.some((file) =>
    RELEASE_SURFACE.test(file),
  );
  let decision;
  let reason;

  if (invalid.length > 0) {
    decision = {
      state: "changesets-invalid",
      blocked: true,
      release_required: true,
      version_pr: false,
      npm_publish: false,
    };
    reason = invalid.map((entry) => `${entry.name}: ${entry.error}`).join("; ");
  } else if (empty.length > 0 && nonempty.length === 0) {
    decision = {
      state: "changesets-all-empty",
      blocked: true,
      release_required: true,
      version_pr: false,
      npm_publish: false,
    };
    reason =
      "all pending changesets are empty; remove or repair them before resuming";
  } else if (nonempty.length > 0 && workflowChanged) {
    decision = {
      state: "workflow-diff-conflict",
      blocked: true,
      release_required: true,
      version_pr: false,
      npm_publish: false,
    };
    reason =
      "release workflow and a nonempty changeset changed together; split the safety surface";
  } else if (nonempty.length > 0) {
    const open = versionPr.status === "open";
    const unknown = versionPr.status === "unknown";
    decision = {
      state: open ? "version-pr-open" : "changesets-nonempty",
      blocked: unknown,
      release_required: true,
      version_pr: !unknown,
      npm_publish: false,
    };
    reason = unknown
      ? `Version Packages PR state is unknown: ${versionPr.reason ?? "lookup failed"}`
      : open
        ? `Version Packages PR #${versionPr.number} is open and may be updated; merging remains a separate MK decision`
        : "nonempty changesets require creating the Version Packages PR; publishing is not reachable";
  } else {
    const unknown = publicPackages.filter(
      (entry) => entry.registry.status === "unknown",
    );
    const missing = publicPackages.filter(
      (entry) => entry.registry.status === "missing",
    );
    if (unknown.length > 0) {
      decision = {
        state: "registry-unknown",
        blocked: true,
        release_required: true,
        version_pr: false,
        npm_publish: false,
      };
      reason = unknown
        .map(
          (entry) =>
            `${entry.name}@${entry.version}: ${entry.registry.reason ?? "unknown"}`,
        )
        .join("; ");
    } else if (missing.length > 0) {
      decision = {
        state: "versioned-unpublished",
        blocked: false,
        release_required: true,
        version_pr: false,
        npm_publish: true,
      };
      reason = `exact workspace version is absent: ${missing.map((entry) => `${entry.name}@${entry.version}`).join(", ")}`;
    } else if (releaseSurfaceChanged) {
      decision = {
        state: "published",
        blocked: false,
        release_required: true,
        version_pr: false,
        npm_publish: false,
      };
      reason =
        "release surface changed, but every exact public workspace version already exists on npm";
    } else {
      decision = {
        state: "clean-noop",
        blocked: false,
        release_required: false,
        version_pr: false,
        npm_publish: false,
      };
      reason =
        "no pending changeset, unpublished exact public version, or release-surface change";
    }
  }

  const nextAction =
    decision.state === "changesets-nonempty" && decision.blocked
      ? "Restore the authenticated Version Packages PR lookup and rerun; do not mutate a PR while its state is unknown."
      : {
          "clean-noop": "No release action.",
          "changesets-all-empty":
            "Remove or repair the empty changeset, then rerun release classification.",
          "changesets-invalid":
            "Repair the malformed changeset frontmatter, then rerun release classification.",
          "workflow-diff-conflict":
            "Split the release-workflow change from the changeset-bearing change.",
          "changesets-nonempty":
            "Create or update the Version Packages PR; do not publish npm.",
          "version-pr-open":
            "Review the existing Version Packages PR; ask MK separately before merge.",
          "registry-unknown":
            "Restore authoritative npm lookup and rerun; do not publish while state is unknown.",
          "versioned-unpublished":
            "Run the hosted artifact build and npm OIDC publication path; do not deploy.",
          published:
            "Run only the required self-hosted quality path; skip hosted npm jobs.",
        }[decision.state];

  return {
    schema: "vegastack-release-state/v1",
    decision,
    reason,
    nextAction,
    approvalBoundary:
      decision.state === "version-pr-open"
        ? "MK approval is required before merging the Version Packages PR."
        : decision.npm_publish
          ? "Publication is authorized only by the already reviewed Version Packages merge; production deploy remains separate."
          : "No outward approval boundary is crossed by this decision.",
    changedFiles: [...changedFiles].sort(),
    changesets,
    publicPackages,
    versionPr,
  };
}
