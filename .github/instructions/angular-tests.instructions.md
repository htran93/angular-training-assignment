---
name: Angular Vitest testing guidelines
description: Use when creating or modifying unit tests in this Angular project.
applyTo: ["frontend/**/*.spec.ts", "frontend/**/*.test.ts"]
---

# Angular Vitest Testing Guidelines

- The supplied package manifest includes Vitest 4, `@vitest/coverage-v8` 4, and jsdom 30. Confirm the actual Vitest and Angular test configuration before choosing APIs.
- Use Vitest APIs such as `describe`, `it`/`test`, `expect`, and `vi` according to the repository's configured globals and import conventions.
- Do not use Jest-specific APIs such as `jest.fn()` or `jest.mock()`; use the equivalent Vitest APIs where needed.
- Follow existing Angular test setup, TestBed conventions, fixtures, helpers, and cleanup patterns.
- Derive feature tests from the story acceptance criteria in `docs/requirements/` and trace them to relevant scenarios under `docs/testing/test-cases/`. Check the matching `docs/design/` contract for API shapes and the domain rules for financial invariants.
- Treat unresolved or explicitly blocked scenarios as open questions; do not invent expected results from mockup values or weaken assertions to fit the implementation.
- Shared-component tests live beside the shared UI in `frontend/src/app/shared/components/shared-components.spec.ts`; follow their standalone TestBed and Vitest-import conventions.
- Use public inputs, outputs, rendered accessibility semantics, and user events to test shared components. Avoid asserting private implementation details or class names unless the class itself is a documented public styling hook.
- The Angular CLI test runner is configured for Vitest in `frontend/angular.json`. From `frontend/`, use `corepack npm test -- --include=src/app/shared/components/shared-components.spec.ts` for focused shared-component coverage and `corepack npm test` for the full suite.
- Prefer assertions against public behavior, rendered output, and user interactions over private implementation details.
- Cover normal behavior, meaningful error paths, boundary conditions, and the regression being prevented.
- Mock network calls and external boundaries when appropriate; avoid excessive mocking of the unit under test.
- Keep tests deterministic and independent of execution order, real network access, and credentials.
- Use jsdom only when enabled by the configuration or explicitly set up for the test.
- Do not remove, skip, or weaken tests solely to make the suite pass.
- If tests cannot run, say so clearly rather than claiming success.
