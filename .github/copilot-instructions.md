# GitHub Copilot Instructions

## Verified project facts
- The Angular application is in `frontend/`; frontend source is under `frontend/src/`.
- The app uses standalone Angular components, configured with `provideRouter`, `provideHttpClient`, and Angular's `@angular/build:unit-test` runner.
- The reusable UI layer is in `frontend/src/app/shared/` and exported from `frontend/src/app/shared/index.ts`.
- Shared component responsibilities and usage are documented in `docs/design/shared-components.md`.
- Shared Angular styles and tokens are under `frontend/src/styles/`; feature-reference tokens use Mulish, FamilyFinance branding, and the project's jar color tokens.
- The site must work responsively on desktop, tablet, and mobile viewports. Use the breakpoints and responsive behavior in the requirement HTML and existing style tokens.
- The feature HTML files under `docs/requirements/` are the selected visual source of truth for shared UI. The token preview and NashTech brand guideline are supplementary and must not silently override the feature captures.
- Angular framework packages: `^21.2.0`.
- Angular CLI and `@angular/build`: `^21.2.24`.
- TypeScript: `~5.9.2`.
- RxJS: `~7.8.0`.
- Unit-test tooling includes Vitest `^4.0.8`, `@vitest/coverage-v8` `^4.0.8`, and jsdom `^30.1.1`.
- Package manager: npm `10.9.8`.
- Available scripts are in `frontend/package.json`: `npm start`, `npm run build`, `npm run watch`, and `npm test`. Run them from `frontend/`; use `corepack npm` to honor the pinned npm version.
- No lint script is shown in the supplied `package.json`. Do not assume ESLint or another linter is installed.
- The Angular test target uses Vitest. The focused shared-component test file is `frontend/src/app/shared/components/shared-components.spec.ts`.
- Feature route paths are registered, but several still display placeholder pages; inspect `frontend/src/app/app.routes.ts` and the target route component before assuming a feature workflow is implemented.

## General approach
- Treat existing source code and configuration as the source of truth.
- Before changing code, inspect relevant files, `angular.json`, `tsconfig*.json`, and nearby tests.
- Before implementing a feature, read `docs/product-brief.md` when relevant, its requirement story/acceptance criteria under `docs/requirements/`, matching development specs under `docs/design/`, applicable rules in `docs/knowledge/domain.md`, and related cases under `docs/testing/test-cases/`.
- Treat requirement Markdown as the behavior contract, development specs as the API/technical contract, and feature HTML as visual reference. Mockup sample values are not runtime requirements.
- If those documents conflict, are stale, or leave behavior open, compare the actual source tree and API implementation, then surface the discrepancy instead of silently choosing a business rule.
- Make the smallest focused change that satisfies the request. Avoid unrelated refactors.
- Reuse established architecture, utilities, components, and dependencies.
- Do not add dependencies or invent project conventions without a clear need.
- If important requirements are ambiguous, ask a concise question or state the assumption.

## Angular and TypeScript
- Use APIs supported by Angular 21.2 and the installed TypeScript version.
- Follow the existing standalone-component approach; do not introduce NgModules for new features.
- Use strict, meaningful types. Avoid `any`; use `unknown` and narrow it where appropriate.
- Follow local conventions for dependency injection, routing, forms, state, and component organization.
- Reuse existing shared UI components and tokens from `frontend/src/app/shared/` and `frontend/src/styles/` before adding another primitive. See `docs/design/shared-components.md`.
- Keep API monetary values as strings in the Angular UI. Shared presentation helpers may format them, but must not calculate authoritative budgets, spending, balances, or percentages.
- Use signals, RxJS, or other state patterns according to existing code. Do not introduce a competing approach without justification.
- Keep components focused on UI behavior and orchestration; place reusable business logic in suitable services or domain abstractions.
- Avoid side effects and expensive computation in templates.
- Manage subscriptions, effects, and resources with appropriate cleanup.

## Templates, forms, and accessibility
- Follow the project's existing template and styling conventions.
- For new Angular 21 code, prefer built-in template control flow when appropriate and consistent with nearby code.
- Use semantic HTML, accessible labels, keyboard interaction, and sensible focus behavior.
- Preserve the existing forms approach and validation conventions.
- Keep every page usable across desktop, tablet, and mobile sizes. Reflow grids and panels at the documented breakpoints, prevent unintended horizontal overflow, and retain usable touch/keyboard controls.

## API handling and security
- Reuse existing HTTP, interceptor, API-model, and error-handling patterns.
- Represent loading, empty, success, and error states where relevant.
- Type external data and handle failures deliberately.
- Never hardcode secrets, credentials, or private keys. Do not include secrets in logs.
- Do not bypass authentication, authorization, validation, or existing security controls.

## Testing and validation
- Use Vitest for tests, as indicated by the supplied development dependencies, while verifying the actual Angular/Vitest configuration and nearby test examples before writing tests.
- Follow the configured Vitest environment and Angular testing utilities; do not assume Jest globals or Jest-only APIs.
- Use jsdom only where the existing Vitest configuration enables it or a test explicitly configures it.
- Use the project's existing test naming and mocking conventions.
- Add or update tests for behavior changes, including meaningful failure paths and edge cases.
- Do not remove or weaken tests just to make them pass.
- From `frontend/`, run focused tests with `corepack npm test -- --include=src/app/shared/components/shared-components.spec.ts`; run the complete suite with `corepack npm test` and compile with `corepack npm run build` when feasible.
- Route tests verify registered feature paths, which currently render explicit placeholders where feature pages have not yet been implemented. Replace placeholders with real pages when implementing those workflows; do not weaken route expectations to hide missing routes.
- Use `corepack npm run watch` only when watch-mode validation is specifically useful.
- Do not claim tests, coverage, or builds passed unless the command was actually run and its result checked.
- No lint command is present in the supplied manifest; check repository configuration before suggesting or running lint.

## Completion
- Review the diff for regressions, accessibility, security, duplicated logic, and unrelated changes.
- Summarize changes, tests/commands actually run, and remaining assumptions or risks.
