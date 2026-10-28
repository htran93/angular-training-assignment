# Test Cases: F2 - Allocate Income to Seven Jars

## Traceability Summary

| Item | Value |
| --- | --- |
| User story or requirement | F2-US-01 - View monthly income allocated across seven jars |
| Feature | F2 - Allocate income to seven jars |
| Scope | Functional, API/integration |
| Status | Route-based view implemented; plan-history browsing deferred |
| Output location | `docs/testing/test-cases/f2/` |

## Assumptions and Open Questions

- F2 reads an existing monthly plan and does not create or update it; plan creation belongs to F1.
- The seven canonical jars are defined by the F2 requirement and `docs/knowledge/domain.md`.
- Whole-VND allocation uses the approved largest-remainder policy in BR-007; remainder ties use canonical jar order.
- F2 reads a plan by the year/month in its route. There is no plan-history list or selector; a direct route can still refer to a month with no plan.
- The F2 HTML reference defines the visual baseline. No response-time target, authentication, or authorization behavior is asserted.
- AC2's expected-value notation is interpreted using the formula in AC1 and BR-006: monthly income multiplied by rate, divided by 100.

## Reusable Test Data

| Data ID | Value | Use |
| --- | --- | --- |
| D01 | Existing plan for 2026-09, income `25,000,000 VND`; Living Expenses 35%, Food 20%, Children 10%, Emergency Fund 10%, Savings 10%, Investment 10%, Entertainment & Travel 5% | Exact whole-VND happy path; expected amounts are 8,750,000; 5,000,000; 2,500,000; 2,500,000; 2,500,000; 2,500,000; 1,250,000 VND, respectively |
| D02 | Existing plan for a month with income `1 VND` and the seven predefined rates | Largest-remainder boundary; expected budgets in canonical order: `1, 0, 0, 0, 0, 0, 0 VND` |
| D03 | Controlled F2 API fixture returning seven whole-VND amounts that differ from values produced by a client-side calculation | Verify the view renders backend-supplied amounts without recalculating; fixture is for frontend contract testing only |

## Test Cases

| Test Case ID | Title | Test Steps | Expected Result | Requirement | Testing Technique | Priority | Preconditions | Test Data | Automation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_F2_001 | Verify an existing plan displays all seven jar rates and backend-calculated budgets | 1. Open the existing plan for 2026-09.<br>2. Inspect the jar names, rates, and budget amounts.<br>3. Sum the seven displayed amounts. | Exactly one row/card is shown for each predefined jar: Living Expenses 35%, Food 20%, Children 10%, Emergency Fund 10%, Savings 10%, Investment 10%, and Entertainment & Travel 5%. Their displayed amounts are respectively 8,750,000; 5,000,000; 2,500,000; 2,500,000; 2,500,000; 2,500,000; and 1,250,000 VND. The amount total is exactly 25,000,000 VND. | AC1, AC2; BR-002, BR-004, BR-006, BR-007, BR-009 | Use Case Testing, Business Rule Testing, Arithmetic Invariant Testing | Critical | A valid plan matching D01 exists and can be retrieved. | D01 | Yes |
| TC_F2_002 | Verify the allocation view displays backend-supplied amounts without client-side recalculation | 1. Configure the frontend test fixture to return D03's plan response.<br>2. Open the allocation view for that plan.<br>3. Compare every displayed amount with the amount field returned by the fixture. | Each displayed jar amount exactly matches its corresponding backend response amount, including values intentionally distinguishable from a frontend formula calculation. The frontend does not replace, recalculate, or redistribute the returned amounts. | AC4 | Integration Contract Testing, Error Guessing | High | A frontend test harness can provide a controlled plan API response. | D03 | Yes |
| TC_F2_003 | Verify fractional jar calculations use the approved whole-VND and remainder policy | 1. Create or retrieve the D02 plan.<br>2. Inspect all seven backend budgets.<br>3. Sum the budgets and compare each with the approved largest-remainder result. | All amounts are whole VND and sum to `1 VND`. Living Expenses receives `1 VND`; the other six jars receive `0 VND`, following descending fractional remainder. | AC1, AC2; BR-006, BR-007, BR-009 | Boundary Value Analysis, Arithmetic Invariant Testing | Critical | Backend allocation calculation can be exercised for D02. | D02 | Not verified in this frontend test run |
| TC_F2_004 | Verify a missing plan shows guidance without fabricated budgets | 1. Open a valid route period with no saved plan.<br>2. Inspect the page and its available action. | The page explains that no plan exists, provides a link to F1, and renders no jar cards, amounts, defaults, or zero placeholders. | AC3 | State Transition Testing, Negative Testing | High | The API returns `404 MONTHLY_PLAN_NOT_FOUND` for the requested period. | A period without a plan | Yes |
| TC_F2_005 | Verify the allocation visualization and responsive layout | 1. Open an existing plan.<br>2. Verify the income summary, seven-segment donut, seven-item name/rate legend, seven jar cards, and percentage-share accents.<br>3. Inspect the view at desktop, tablet, and mobile widths. | All seven values remain in canonical response order. The share accents reflect allocation percentages only. The layout reflows without horizontal overflow, clipped jar names, or unreadable values. The donut has an accessible name and its meaning is also conveyed by text/list content. | AC5; responsive/accessibility NFRs | UI Testing, Responsive Testing, Accessibility Testing | High | A valid plan matching D01 exists; the F2 page can be inspected at the target viewport sizes. | D01 | Unit visualization assertions passed; browser checks performed at desktop/tablet/mobile widths |

## Coverage Matrix

| Acceptance Criterion | Complexity | Covered By |
| --- | --- | --- |
| AC1: Display the seven allocated jar budgets, rates, and amounts | Complex | TC_F2_001, TC_F2_005 |
| AC2: Calculate a plan with whole-VND results | Complex | TC_F2_001, TC_F2_003 |
| AC3: Do not show calculated amounts without a monthly plan | Medium | TC_F2_004 |
| AC4: Use backend-calculated amounts | Medium | TC_F2_002 |
| AC5: Show the allocation summary | Complex | TC_F2_005 |
| BR-007: Sum of jar budgets equals monthly income | Complex | TC_F2_001, TC_F2_003 |

## Non-Functional Coverage Notes

| Area | Coverage decision |
| --- | --- |
| Accessibility | TC_F2_005 checks the donut's accessible name and confirms values are also presented as text. |
| Security | Authentication and authorization are not specified for this story; no security cases are added. |
| Performance | No response-time or availability target is specified. |
| Compatibility | TC_F2_005 checks responsive behavior at desktop, tablet, and mobile widths. |
| Localization | VND and whole-VND values are required; locale separators and exact formatting are unspecified, so separator formatting is not asserted. |
| Integration | Backend response-to-view consistency is covered by TC_F2_001 and TC_F2_002. |

## Assumptions and Risks Requiring Resolution

- **Deferred UX:** Browsing all saved plans requires a list endpoint and remains out of scope. The current view is route-period based.

## Quality Gate

- [x] All currently testable acceptance criteria and applicable business rules have traceable cases.
- [x] Positive, negative, boundary, and business-rule scenarios are included where applicable.
- [x] Test data, expected results, priorities, and techniques are recorded.
- [x] Duplicate scenarios are removed; each case has a distinct primary objective.
- [x] Assumptions, risks, and open questions are visible.
- [x] Finalize the seven-jar expected results and largest-remainder boundary behavior.
- [x] Cover missing-plan, backend-value, visualization, accessibility, and responsive scenarios.

**Decision:** F2 route-period view test coverage is defined. Frontend visualization assertions and browser checks at desktop/tablet/mobile widths passed. Backend rounding case TC_F2_003 was not verified in the frontend test run.