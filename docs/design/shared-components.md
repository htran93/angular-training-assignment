# Shared Angular Components

## Purpose and design source

This document defines the first reusable Angular UI layer for the Family Finance application. The visual source is the feature HTML in `docs/requirements/`: F1 monthly planning and its unavailable state, F2 income allocation, F3 expense entry, and F5 dashboard. The token-preview HTML is supplementary; the feature pages are the source for this component set.

The shared layer provides layout and presentation primitives only. It does not implement feature workflows, API calls, financial calculations, or authentication.

## Component inventory

| Component | Selector | Responsibility |
|---|---|---|
| App shell | `app-app-shell` | Family Finance header with a calendar-check brand mark, family identity placeholder, icon-and-label primary navigation, skip link, sidebar, and projected page content. |
| Button primitive | `.ff-button` | Shared primary and secondary action styles. Use native `<button>` or `<a>` elements so keyboard and disabled behavior remains semantic. |
| Month selector | `app-month-selector` | Accessible native select for a supplied list of `YYYY-MM` periods. The caller decides whether options mean all months or only months with saved plans. |
| Panel | `app-panel` | Named, titled content region with an optional eyebrow and projected `[panel-actions]`. |
| Jar card | `app-jar-card` | Consistent jar accent, built-in decorative icon stacked above the name and percentage, optional guidance, and optional whole-VND amount. `[jar-icon]` overrides the icon; `[jar-progress]` projects a visual indicator inside the card. |
| Metric card | `app-metric-card` | Label/value/detail block for income, spending, and balance summaries. Values are display strings, not calculated here. |
| Progress bar | `app-progress-bar` | Accessible visual progress indicator. It caps only the visual fill and ARIA numeric value; `valueText` preserves the full supplied value. |
| Form field | `app-form-field` | Label, required marker, help text, error announcement, and control description IDs. |
| VND amount input | `app-vnd-amount-input` | Angular forms control for whole-VND text. With `groupThousands` enabled, it displays periods between digit groups while preserving the ungrouped form value; validation belongs to the owning form. |
| State panel | `app-state-panel` | Empty, error, loading, or unavailable message with an optional projected `[state-action]`. |
| VND amount pipe | `vndAmount` | Adds grouping separators and `VND` to a digit string without converting it to `number`. Negative digit strings are supported for over-budget balances. |

Shared app navigation defaults to Home (`/dashboard`), Planning (`/monthly-planning`), and Add Expense (`/expenses/new`), each with an optional decorative inline icon. Supply a different `navigationItems` input if a page has a different navigation contract.

## Usage examples

### App shell

```html
<app-app-shell>
  <router-outlet />
</app-app-shell>
```

### Period selector and field messages

```html
<app-form-field
  #monthField
  controlId="plan-month"
  label="Month"
  [required]="true"
  [errorMessage]="monthError">
  <app-month-selector
    [id]="monthField.controlId"
    [options]="availableMonths"
    [value]="selectedMonth"
    [required]="true"
    [describedBy]="monthField.describedBy"
    (valueChange)="selectedMonth = $event" />
</app-form-field>
```

Each `MonthOption` has a `value` in `YYYY-MM` format and a display `label`. Do not populate an existing-plan selector with periods that do not have a plan.

### Money input and display

```html
<app-form-field
  #incomeField
  controlId="monthly-income"
  label="Monthly income"
  [required]="true"
  [errorMessage]="incomeError">
  <app-vnd-amount-input
    inputId="monthly-income"
    [formControl]="incomeControl"
    [groupThousands]="true"
    [required]="true"
    [invalid]="!!incomeError"
    [describedBy]="incomeField.describedBy" />
</app-form-field>

<strong>{{ monthlyIncomeVnd | vndAmount }}</strong>
```

`incomeControl` must be a string control containing the canonical digits. The optional `groupThousands` input formats digit-only values with periods for display while leaving the form value ungrouped. Other invalid characters, such as commas, are preserved for the feature form to validate; the component does not convert amounts to numbers.

### Jar card, metrics, and progress

```html
<app-jar-card
  jarType="food"
  name="Food"
  [percentage]="20"
  amountLabel=""
  amountVnd="5000000">
  <span jar-progress aria-hidden="true">...</span>
</app-jar-card>

<app-metric-card
  label="Remaining balance"
  value="22,250,000 VND"
  detail="For September 2026" />

<app-progress-bar
  label="Food spending"
  [value]="foodPercentageUsed"
  [overBudget]="foodPercentageUsed > 100"
  [valueText]="foodPercentageLabel" />
```

The value passed to `app-progress-bar` is already computed by the backend. The component clamps only the bar fill and ARIA numeric value to its `max`; provide `valueText` to preserve the backend percentage and over-budget text.

Use `.ff-button ff-button--primary` for a primary action and `.ff-button ff-button--secondary` for a secondary action. Keep the underlying element native:

```html
<button class="ff-button ff-button--primary" type="submit">Create monthly plan</button>
<a class="ff-button ff-button--secondary" routerLink="/monthly-planning">Back</a>
```

## Component contracts and boundaries

- **Financial values:** Keep API monetary values as strings. `vndAmount` groups a string; it does not calculate budgets, spending, remaining balances, or percentages.
- **Form validation:** `app-form-field` exposes `describedBy` for the projected control. Bind that value to the control’s `aria-describedby`; pass `required` and `invalid` to custom/native inputs as appropriate.
- **Period selection:** `app-month-selector` does not generate years or infer available plans. Feature services supply the options.
- **Jar identity:** `JarType` is the canonical API-key union in `src/app/shared/models/jar-type.ts`. Jar names and monetary calculations should still come from the API.
- **Panel heading:** `app-panel` keeps its accessible title and may show a short eyebrow above it.
- **Jar card sizing:** `.ff-jar-card` fills its `app-jar-card` host. Feature layouts can tune `--ff-jar-card-min-height`, `--ff-jar-card-padding`, `--ff-jar-card-marker-size`, and related `--ff-jar-card-*` properties; F1 uses a `9.0625rem` minimum height and F2 uses `10.5rem`.
- **Jar progress:** The optional `[jar-progress]` projection renders inside the card after its amount. Set `amountLabel` to an empty string when the amount should be shown without a label.
- **Progress:** A percentage above 100 may be shown in `valueText`; only visual fill and `aria-valuenow` are capped. Include a textual over-budget status rather than relying on color.
- **State panels:** Errors use `role="alert"`; other states use `role="status"`. Add a keyboard-accessible link or button using the `[state-action]` slot.
- **Navigation identity:** The family name/initials are presentation placeholders; they do not imply authentication or account functionality.
- **Icons:** Jar cards render the decorative inline SVG associated with their canonical jar type unless a `[jar-icon]` is projected. The shell uses text labels; no external icon assets or dependency are required.

## Design tokens

The component styles reuse the existing tokens in `frontend/src/styles/base/` and `frontend/src/styles/theme/`:

- Family Finance surfaces and text use `--f1-bg`, `--f1-surface`, `--f1-navy`, `--f1-charcoal`, `--f1-slate`, and `--f1-grey`.
- Jar colors and tints use the existing `--f1-jar-*` variables.
- Typography uses the existing Mulish aliases `--font-body`, `--font-heading`, and `--font-sans`.
- Responsive rules reuse the existing breakpoint tokens and mixins.
- Buttons and form controls use the existing radius tokens and feature-capture focus ring. Feature cards may override the base square radius when their reference calls for rounded corners.

The feature HTML shares the FamilyFinance label, Mulish font, jar palette, and breakpoint tokens. Do not copy component markup or embedded styles from an individual feature file. The NashTech Notes brand guideline is specific to its documented monthly-planning capture and should not override the shared feature captures without a product decision.

## Responsive behavior

Responsive support is required throughout the site, including every feature page and shared component. Use the feature-reference breakpoints (`--breakpoint-mobile`, `--breakpoint-tablet`, and `--breakpoint-laptop`) and preserve the captured reading order as layouts reflow.

- The app shell moves from sidebar/content columns to a stacked layout at the tablet breakpoint; navigation remains reachable on narrow screens.
- Feature grids and metric cards should reflow to fewer columns as viewport width decreases.
- Forms remain readable and operable on mobile; controls and labels must not clip or overlap.
- Jar names and VND amounts may wrap when needed. Avoid unintended horizontal scrolling; any intentionally scrollable region must remain keyboard-operable and clearly bounded.
- Check representative desktop, tablet, and mobile widths when browser validation is available. If it is unavailable, inspect the responsive rules and state the limitation.

## Source mapping

- App shell, form fields, and jar cards: [F1 monthly planning](../requirements/f1-monthly-planning/f1-monthly-planning.html)
- Unavailable-state pattern: [F1 unavailable state](../requirements/f1-monthly-planning/f1-monthly-planning-unavailble.html)
- Allocation cards and summary: [F2 income allocation](../requirements/f2-income-allocation/f2-income-allocation.html)
- Form and selected-jar summary: [F3 add expense](../requirements/f3-add-expenses/f3-add-expenses.html)
- Metrics and progress: [F5 dashboard](../requirements/f5-dashboard/f5-dashboard.html)
- Candidate tokens: [design-token preview](../requirements/style%20guideline/design-tokens-preview.html)

## Validation

Run from `frontend/`:

```powershell
corepack npm test -- --include=src/app/shared/components/shared-components.spec.ts
corepack npm run build
```
