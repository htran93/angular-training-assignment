---
name: angular-code-review
description: Review Angular 21.2 and TypeScript changes for correctness, regressions, security, accessibility, maintainability, and missing Vitest coverage.
---

# Angular Code Review

## Review process

1. Inspect the diff and surrounding code needed to understand behavior.
2. Check relevant Angular, TypeScript, RxJS, and dependency versions before judging API usage.
3. Trace affected flows through components, services, routing, forms, and API boundaries as needed.
   - The app is standalone Angular under `frontend/src/`; inspect `frontend/src/app/shared/` and `docs/design/shared-components.md` before flagging or recommending duplicate UI primitives.
   - Shared UI styles and tokens are in `frontend/src/styles/`; requirement feature HTML under `docs/requirements/` is the chosen visual reference.
4. Look for concrete issues:
   - Incorrect behavior, boundary cases, race conditions, or stale state.
   - Resource, subscription, or event-listener cleanup problems.
   - Incorrect loading or error handling.
   - Unsafe type assumptions or unvalidated external data.
   - Shared presentation components making authoritative financial calculations or converting VND strings through JavaScript `number`.
   - Accessibility regressions in shared controls, especially missing labels/descriptions, focus handling, status announcements, or hiding over-budget values when the progress fill is capped.
   - Authentication, authorization, secret-handling, or injection risks.
   - Accessibility problems in markup or interaction.
   - Breaking public-contract changes or unnecessary performance costs.
   - Missing or ineffective regression tests.
5. Check whether Vitest coverage meaningfully exercises changed behavior.
6. Report actionable findings supported by code. Do not invent issues or treat personal style preferences as defects.

## Finding format

For each finding, provide:
- **Severity:** Critical, High, Medium, or Low.
- **Location:** File and line(s), if available.
- **Problem:** The specific behavior or risk.
- **Impact:** Why it matters.
- **Recommendation:** A concrete fix.

Prioritize by severity. If no actionable issues are found, say so and note important areas that were not verified. Do not claim tests or builds were executed unless they actually were.
