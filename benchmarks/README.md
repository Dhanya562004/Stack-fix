# StackFix benchmark v1
14 cases (8 Python, 6 JavaScript). A case passes if the returned fixedCode differs from the input and runs without error.

| Engine | Pass | Notes |
|---|---|---|
| Heuristic fallback | 1/14 | 2 wrong edits, 11 unchanged. Rule-order bugs and missing rules. |
| Gemini | pending | |

Known limits: "runs without error" is a weak check, and case 7 needs a pip command, not a code change.
