export function reconcileGateTree(start, completed) {
  if (!start?.hash || !completed?.hash)
    throw new Error("gate tree snapshots must contain a content hash");
  const sameHash = start.hash === completed.hash;
  const sameFiles =
    JSON.stringify(start.files ?? []) === JSON.stringify(completed.files ?? []);
  if (!sameHash || !sameFiles)
    throw new Error(
      `working-tree content changed during gate execution (${start.hash} -> ${completed.hash})`,
    );
  return { hash: completed.hash, files: completed.files, unchanged: true };
}
