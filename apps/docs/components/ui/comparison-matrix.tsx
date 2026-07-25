// @vegastack comparison-matrix@0.3.0 sha256-CyYxVXTYRqaH7kc7qyx7too9HN06N++w6o5KL4SBzwo=

"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * ComparisonMatrix — the plan feature matrix (Wave 4, from the pricing-page teardown), with a
 * deliberate a11y IMPROVEMENT over the reference: availability renders as ✓ / − glyphs with
 * screen-reader text, never bare unlabeled dots. Native <table> semantics: column headers are
 * the plans, row headers are the features, group rows span the table. The highlighted plan's
 * column gets a subtle info tint, and the plan COUNT travels with it, so group headings span the
 * real column count and every row renders exactly one cell per plan.
 * ----------------------------------------------------------------------------------------------*/

/** Props for the responsive plan-comparison table. */
export interface ComparisonMatrixProps extends React.ComponentPropsWithRef<"table"> {
  /** Plan names, in column order. */
  plans: React.ReactNode[];
  /** Index into `plans` to tint as the promoted column. @default undefined */
  highlightedIndex?: number;
  /** Optional per-plan header extras (CTAs), aligned under the names. @default undefined */
  planActions?: React.ReactNode[];
}

/** Marks a cell the author never supplied (availability shorter than plans). */
const UNKNOWN_AVAILABILITY = Symbol.for("vegastack.comparison-matrix.unknown");

/** A rendered cell: an author-supplied value, or the not-supplied sentinel. */
type ComparisonCell = boolean | React.ReactNode | typeof UNKNOWN_AVAILABILITY;

/**
 * Rows need two facts the root owns: which column is promoted, and HOW MANY columns exist.
 * The column count is what keeps a group heading's `colSpan` and a row's cell count honest —
 * without it `ComparisonGroup` had to guess (it used `colSpan={99}`, which makes the table a
 * 99-column grid and misreports the row's span to assistive tech) and `ComparisonRow` rendered
 * exactly as many cells as `availability` happened to contain, so a short or long array silently
 * shifted every later column onto the wrong plan.
 */
const MatrixContext = React.createContext<{
  highlightedIndex: number | undefined;
  planCount: number;
}>({ highlightedIndex: undefined, planCount: 0 });

/**
 * `ComparisonMatrix` — compose `ComparisonGroup` and `ComparisonRow` children.
 *
 * @example
 * <ComparisonMatrix plans={['Free', 'Plus', 'Pro']} highlightedIndex={2}>
 *   <ComparisonGroup>Enrichment</ComparisonGroup>
 *   <ComparisonRow feature="Company data" availability={[true, true, true]} />
 *   <ComparisonRow feature="Call intelligence" availability={[false, false, true]} />
 *   <ComparisonRow feature="Seats" availability={['3', '10', 'Unlimited']} />
 * </ComparisonMatrix>
 */
export function ComparisonMatrix({
  className,
  plans,
  highlightedIndex,
  planActions,
  children,
  ref,
  ...props
}: ComparisonMatrixProps) {
  const matrixContext = React.useMemo(
    () => ({ highlightedIndex, planCount: plans.length }),
    [highlightedIndex, plans.length],
  );
  return (
    <div
      data-slot="comparison-matrix-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        ref={ref}
        data-slot="comparison-matrix"
        className={cn("w-full caption-bottom text-base", className)}
        {...props}
      >
        <thead>
          <tr className="border-b border-border">
            <td aria-hidden className="w-1/3 px-3" />
            {plans.map((plan, i) => (
              <th
                key={i}
                scope="col"
                data-highlighted={i === highlightedIndex ? "" : undefined}
                className={cn(
                  "px-3 py-3 text-start align-top text-label",
                  i === highlightedIndex && "bg-info/(--alpha-surface-faint)",
                )}
              >
                <span className="flex flex-col items-start gap-2">
                  {plan}
                  {planActions?.[i] ?? null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          <MatrixContext.Provider value={matrixContext}>
            {children}
          </MatrixContext.Provider>
        </tbody>
      </table>
    </div>
  );
}

/** Native row props for a full-width comparison section heading. */
export type ComparisonGroupProps = React.ComponentPropsWithRef<"tr">;

/** `ComparisonGroup` — a full-width section heading row. @example <ComparisonGroup>Enrichment</ComparisonGroup> */
export function ComparisonGroup({
  className,
  children,
  ...props
}: ComparisonGroupProps) {
  const { planCount } = React.useContext(MatrixContext);
  return (
    <tr
      data-slot="comparison-group"
      className={cn("border-b border-border", className)}
      {...props}
    >
      <th
        // The feature column plus one column per plan — the row's TRUE span. A fixed oversized
        // value (this was 99) makes the browser lay the table out on that many columns and tells
        // assistive tech the heading spans columns that do not exist.
        colSpan={planCount + 1}
        scope="colgroup"
        className="px-3 pt-6 pb-2 text-start text-lg font-medium"
      >
        {children}
      </th>
    </tr>
  );
}

/** Props for one feature row in a comparison matrix. */
export interface ComparisonRowProps extends React.ComponentPropsWithRef<"tr"> {
  /** The feature name (the row header). */
  feature: React.ReactNode;
  /**
   * One entry per plan: `true` (included → ✓), `false` (not included → −), or
   * any node for a literal value ("3 seats").
   */
  availability: Array<boolean | React.ReactNode>;
  /** Screen-reader copy for included boolean cells. @default 'Included' */
  includedLabel?: string;
  /** Screen-reader copy for unavailable boolean cells. @default 'Not included' */
  notIncludedLabel?: string;
  /**
   * Screen-reader copy for a cell with no supplied value (fewer `availability` entries than
   * `plans`). @default 'Not specified'
   */
  unknownLabel?: string;
}

/** `ComparisonRow` — one feature row. @example <ComparisonRow feature="Seats" availability={['3', 'Unlimited']} /> */
export function ComparisonRow({
  className,
  feature,
  availability,
  includedLabel = "Included",
  notIncludedLabel = "Not included",
  unknownLabel = "Not specified",
  ...props
}: ComparisonRowProps) {
  const { highlightedIndex, planCount } = React.useContext(MatrixContext);
  // Always render exactly one cell per plan. A shorter `availability` used to end the row early,
  // silently sliding every following row's columns out of alignment with the plan headers — the
  // worst failure mode for this component, because the table still LOOKS right while attributing
  // features to the wrong plan. A longer array used to add phantom columns past the last header.
  // Overflow is dropped; a gap renders as an explicitly unknown cell rather than a claim.
  const cells = React.useMemo<ComparisonCell[]>(() => {
    const out: ComparisonCell[] = availability.slice(0, planCount);
    while (out.length < planCount) out.push(UNKNOWN_AVAILABILITY);
    return out;
  }, [availability, planCount]);
  return (
    <tr
      data-slot="comparison-row"
      className={cn("h-(--size-lg) border-b border-border", className)}
      {...props}
    >
      <th
        scope="row"
        className="px-3 text-start text-sm font-medium text-muted-foreground"
      >
        {feature}
      </th>
      {cells.map((value, i) => (
        <td
          key={i}
          className={cn(
            "px-3",
            i === highlightedIndex && "bg-info/(--alpha-surface-faint)",
          )}
        >
          {value === true ? (
            <>
              <Check
                aria-hidden
                className="size-(--icon-inline) text-success-text"
              />
              <span className="sr-only">{includedLabel}</span>
            </>
          ) : value === false ? (
            <>
              <Minus
                aria-hidden
                className="size-(--icon-inline) text-muted-foreground-faint"
              />
              <span className="sr-only">{notIncludedLabel}</span>
            </>
          ) : value === UNKNOWN_AVAILABILITY ? (
            // `availability` was shorter than `plans`. Hold the column open rather than shifting
            // the row, and say the value is unknown instead of asserting "not included" — the
            // author simply did not supply it.
            <>
              <span aria-hidden className="text-sm text-muted-foreground-faint">
                —
              </span>
              <span className="sr-only">{unknownLabel}</span>
            </>
          ) : (
            <span className="text-sm">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
