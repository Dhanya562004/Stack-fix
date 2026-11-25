# StackFix benchmark v1

14 cases (8 Python, 6 JavaScript).

## Pass rules

**Original heuristic/Gemini pass rule:** A case passes if the returned `fixedCode` differs from the input and runs without error. This measures runnable changed code, not verified correctness. It must not be described as accuracy.

**Stricter correctness rule:** A case passes only if:
1. The returned code differs from the input.
2. The returned code runs without error.
3. The fix satisfies the case's `expect` condition.

The `expect` values are descriptive hints, not necessarily precise automated correctness checks. Therefore, the stricter rule must only be reported where the expected condition can actually be verified. Do not claim correctness based solely on keyword matching.

Case 7 requires a `pip install` command rather than a code-only fix, so it needs separate evaluation.

## Results

| Engine | Pass | Notes |
|---|---|---|
| Heuristic fallback | 1/14 | 2 wrong edits, 11 unchanged. Rule-order bugs and missing rules. |
| Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite`) | 12/14, 13/14, 14/14 (3 runs) | Run 1: 12/14; Run 2: 13/14; Run 3: 13/14 initially (Case 8 marked `API_ERROR` after 4 HTTP 503 attempts), 14/14 after 1 permitted rerun of Case 8. |

Pass rule: A case passes if the returned `fixedCode` differs from the input and runs without error.
Benchmark date: November 25, 2026 | Model: `gemini-3.5-flash-lite` (Gemini 3.5 Flash Lite) | The 14 benchmark cases were not changed after results were seen.

Known limits: "runs without error" is a weak check, and case 7 needs a pip command, not a code change.