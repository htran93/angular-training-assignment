---
name: Angular component guidelines
description: Use when creating or modifying Angular components and templates.
applyTo: "{frontend/src/**/*.component.ts,frontend/src/**/*.component.html,frontend/src/**/*.component.scss,frontend/src/**/*.component.css,frontend/src/styles/**/*.scss}"
---

# Angular Component Guidelines

- Inspect nearby components, tests, and source structure before editing.
- Follow the project's existing component naming, selector, file layout, styling, and standalone/NgModule conventions.
- The application is standalone Angular. Put cross-feature presentation primitives in `frontend/src/app/shared/` and export them from `frontend/src/app/shared/index.ts`; feature-specific orchestration belongs in the relevant feature area.
- Before creating a new shared primitive, read `docs/design/shared-components.md` and check for an existing component or style in `frontend/src/app/shared/` and `frontend/src/styles/`.
- Shared components currently include `app-app-shell`, `app-month-selector`, `app-panel`, `app-jar-card`, `app-metric-card`, `app-progress-bar`, `app-form-field`, `app-vnd-amount-input`, and `app-state-panel`; the `vndAmount` pipe formats whole-VND strings.
- Use the `ff-` CSS class namespace and existing `--f1-*`, semantic theme, typography, and breakpoint tokens. Do not duplicate embedded styles from requirement HTML or create competing token sets.
- The approved visual references for shared UI are the feature HTML files in `docs/requirements/` (FamilyFinance / Mulish). The token preview and NashTech brand guideline are supplementary and do not override those captures without a product decision.
- Keep shared components presentational: no feature API calls or authoritative financial calculations. Preserve backend money strings, use backend-supplied jar names and amounts, and keep form validation in the owning feature unless the behavior is truly generic.
- Use Angular 21.2-supported APIs.
- Keep components focused on rendering, user interaction, and coordinating feature behavior.
- Put reusable business logic in an existing service or suitable domain-level abstraction.
- Follow the established state and reactivity approach; do not convert signals to RxJS or vice versa without a reason.
- Avoid unnecessary direct DOM manipulation, template side effects, and expensive template computations.
- Handle loading, empty, error, and success states when relevant.
- Use semantic HTML, accessible names, keyboard support, and appropriate focus handling.
- Give projected form controls unique IDs and connect help/error text through `aria-describedby`; errors should be exposed as text, not color alone.
- For progress above 100%, cap only the visual fill; retain the full percentage in visible/accessible text and identify over-budget status without color alone.
- Keep styles consistent with the existing styling system.
- Add or update Vitest tests using the repository's existing Angular testing setup.
