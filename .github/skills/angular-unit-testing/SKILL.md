---
name: angular-unit-testing
description: Create, improve, or troubleshoot unit tests for this standalone Angular 21.2 project using the configured Vitest 4 runner, including shared UI components.
---

# Angular Unit Testing

## Workflow

1. Inspect `frontend/package.json`, `frontend/angular.json`, TypeScript configuration, and nearby tests. Confirm the test runner and actual environment before choosing APIs; do not assume a standalone Vitest config exists.
2. Read the implementation and identify its public behavior, dependencies, async work, and edge cases.
3. Design tests for expected behavior, error paths, boundaries, accessibility semantics, and the regression being prevented.
4. Follow existing conventions and use Vitest APIs (`vi`, `expect`, `describe`, `it`/`test`) rather than Jest APIs.
5. Use Angular TestBed and project helpers where the existing setup requires them. Shared UI components are standalone and are imported directly in TestBed.
6. Keep tests deterministic and focused. Mock external boundaries where appropriate without excessively mocking the unit under test.
7. From `frontend/`, run the narrowest relevant test command. For shared UI, use `corepack npm test -- --include=src/app/shared/components/shared-components.spec.ts`; run `corepack npm test` when a broader check is feasible.
8. Diagnose failures rather than weakening assertions. The route spec currently expects feature routes that remain commented out; treat it as known baseline context unless route wiring is within the requested change.
9. Report which commands actually ran and any environment limitations.

## Angular-specific considerations

- Test component inputs, outputs, rendered state, and user interactions when relevant.
- For shared UI, follow the documented component contracts in `docs/design/shared-components.md` and tests in `frontend/src/app/shared/components/shared-components.spec.ts`.
- Test that money values remain strings and that presentation-only components do not substitute client-side financial calculations. For progress bars, verify the displayed text preserves over-budget percentages even when the fill is capped.
- Test services through public behavior and observable contracts.
- Handle Observables, promises, timers, and change detection using APIs supported by the installed versions and configured environment.
- Do not assume jsdom is globally enabled just because it is a dependency.
- Prefer public behavior over private implementation details.

## Completion report

Summarize test cases added or changed, commands actually run, and any remaining gaps.
