---
name: angular-feature-development
description: Plan and implement features in this Angular 21.2 project while following existing architecture, accessibility conventions, and Vitest testing practices.
---

# Angular Feature Development

## Workflow

1. Inspect `frontend/package.json`, `frontend/angular.json`, TypeScript configuration, source structure, related implementation, and nearby tests.
2. Read `docs/product-brief.md` when relevant, the requirement story/acceptance criteria and HTML reference under `docs/requirements/`, matching frontend/backend specifications under `docs/design/`, applicable rules in `docs/knowledge/domain.md`, and related cases under `docs/testing/test-cases/`.
3. Treat requirement Markdown as behavior, design specifications as API/technical contracts, HTML as visual guidance, and test cases as scenario coverage. Mockup sample values are illustrative only.
4. If docs conflict, are stale, or leave consequential behavior unresolved, inspect the current implementation and identify the discrepancy; ask before inventing a financial or user-visible rule.
5. Confirm the repository's standalone component architecture, routing, state, forms, styling, HTTP, and dependency-injection conventions.
6. Reuse shared UI from `frontend/src/app/shared/` and styles/tokens from `frontend/src/styles/`; consult `docs/design/shared-components.md` before adding another generic component.
7. Summarize the behavior to implement and identify affected files and regression risks.
8. Ask a focused question if an unresolved requirement materially affects the design; otherwise state a reasonable assumption.
9. Implement the smallest maintainable change using Angular 21.2-compatible APIs.
10. Add or update tests using the project's configured Vitest and Angular test setup.
11. From `frontend/`, run focused tests with `corepack npm test -- --include=<test-file>` and `corepack npm run build` when feasible. Check actual output and report failures accurately.
12. Review the diff for correctness, accessibility, security, duplication, and unrelated changes.
13. Validate the page at representative desktop, tablet, and mobile viewport widths when browser tools are available; otherwise inspect responsive CSS and report that visual validation was unavailable.

## Constraints

- New Angular code follows the existing standalone-component approach. Inspect the repository before assuming a specific feature folder or state-management pattern.
- Visual source of truth for shared Family Finance UI is the feature HTML under `docs/requirements/`; token preview/brand-guideline styling does not override it without a product decision.
- Responsive support is required across desktop, tablet, and mobile. Follow responsive examples and breakpoint tokens in the feature HTML; reflow layouts and prevent unintended horizontal overflow.
- Keep financial calculations authoritative in the backend. UI models preserve VND money as strings and shared controls/formatters are presentation-only.
- Do not introduce dependencies or a new architectural pattern without justification.
- Do not assume a lint command exists; `frontend/package.json` currently does not define one.
- Preserve existing public behavior unless the request explicitly changes it.
- Never claim commands passed unless they were run successfully.

## Completion report

State what changed, important design choices, validation actually performed, and any remaining assumptions or risks.
