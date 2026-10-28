# F2 - Allocate Income to Seven Jars User Story

## Story Metadata

- **Story ID:** F2-US-01
- **Story name:** View monthly income allocated across seven jars
- **Feature:** F2 - Allocate income to seven jars
- **Priority:** Must
- **Status:** Draft
- **Implementation status:** Route-based allocation view implemented; browsing all saved plans is deferred.
- **Primary actor:** Family finance user
- **Source:** `docs/requirements/monthly-income-allocation.md`, `docs/knowledge/domain.md`
- **Dependency:** F1 - Monthly planning

## User Story

> As a family finance user, I want to see how my monthly income is allocated across the seven jars so that I can understand the budget available for each category.

## Preconditions

- A monthly plan exists for the month the user wants to view.
- The plan has a positive monthly income and the seven predefined allocation rates.

## Assumptions

| ID | Assumption                                                                            | Impact if incorrect                                                                   |
| -- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| A1 | F2 displays the selected month's existing plan; it does not create or change a plan.  | Plan creation and editing behavior would need to be included or separately specified. |
| A2 | If no plan exists for the requested month, the user is told to create one through F1. | The no-plan workflow and navigation may need to change.                               |
| A3 | Jar amounts are calculated by the backend and presented in whole VND.                 | The calculation ownership or currency precision contract would need revision.         |

## Main Workflow

1. The user opens an existing monthly plan.
2. The system obtains the monthly income and the seven predefined jar allocation rates.
3. The backend calculates each jar budget using `monthly income x allocation percentage / 100` and applies the approved whole-VND precision policy.
4. The user sees the seven jar names, rates, and calculated budget amounts in VND.

**Visual reference:** [f2-income-allocation.html](f2-income-allocation.html). Its example income and amounts are illustrative; runtime values come from the selected plan response.

## Acceptance Criteria

### AC1: Display the seven allocated jar budgets

```gherkin
Given a monthly plan exists with a positive income
And the plan has the seven predefined jar rates
When the user views the plan
Then the system displays one budget amount in VND for each of the seven jars
And each displayed amount is calculated as monthly income multiplied by the jar rate and divided by 100
And the system displays the jar's allocation rate with its amount
```

### AC2: Calculate a plan with whole-VND results

```gherkin
Given the monthly income is a
And the plan uses the predefined rates
When the backend allocates the income across the seven jars
Then each jar budget is a whole-VND amount following BR-007's approved largest-remainder policy
And the seven whole-VND jar budgets sum exactly to the monthly income
```

### AC3: Do not show calculated amounts without a monthly plan

```gherkin
Given no monthly plan exists for the requested month
When the user tries to view that month's jar allocation
Then the system does not display fabricated jar amounts
And the user is informed that a monthly plan must be created first
```

### AC4: Use backend-calculated amounts

```gherkin
Given a monthly plan exists
When the system presents the jar budgets
Then the displayed amounts are the amounts calculated by the backend
And the frontend does not substitute independently calculated amounts
```

### AC5: Show the allocation summary

```gherkin
Given a monthly plan exists with seven jars
When the user views the plan
Then the view shows the monthly income and a visual summary of the seven allocation rates
And it shows a seven-item legend and one budget card per jar
And any percentage-share accent represents the allocation rate, not spending or progress
```

## Out of Scope

- Creating a monthly plan or changing monthly income; covered by F1.
- Editing jar names, adding or removing jars, or changing allocation rates.
- Recording, editing, or deleting expenses; covered by F3 and F4.
- Displaying spent amounts, remaining balances, or progress; covered by F5.
- Browsing or listing all saved monthly plans. F2 currently uses the year/month in its route; a plan-history selector is deferred.

## Non-Functional Requirements

- Currency is VND and monetary amounts are whole VND values.
- The backend is the source of truth for financial calculations.
- The allocation view includes an income summary, a seven-jar allocation visualization, and seven jar budget cards; percentage-share accents do not represent spending or progress.
- The layout remains readable and operable at desktop, tablet, and mobile widths without unintended horizontal scrolling.
- The allocation visualization and jar list provide accessible names and do not rely on color alone to convey values.
- No response-time or availability threshold is specified in the source requirements.

## Traceability

| Requirement                                                    | Source                                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| F2 - Display the amount allocated to each jar                  | `docs/requirements/monthly-income-allocation.md`, Feature Catalog                                                                                 |
| Budget formula: total income x default rate / 100              | `docs/requirements/monthly-income-allocation.md`, Feature Catalog; `docs/knowledge/domain.md`, BR-006                                           |
| Seven predefined jars and rates total 100%                     | `docs/requirements/monthly-income-allocation.md`, Default Jar Allocation and Acceptance Criteria; `docs/knowledge/domain.md`, BR-002 and BR-004 |
| Backend calculates monetary amounts; currency is VND           | `docs/requirements/monthly-income-allocation.md`, Acceptance Criteria; `docs/knowledge/domain.md`, BR-005 and BR-009                            |
| Total jar budgets equal monthly income                         | `docs/knowledge/domain.md`, BR-007                                                                                                                |
| F1 creates the monthly plan; detailed allocations belong to F2 | `docs/requirements/f1-monthly-planning/f1-monthly-planning.md`, Out of Scope                                                                      |

## Open Questions

- **Deferred UX:** Should users be able to browse all saved plans from F2? This requires a plan-list API and is intentionally deferred; it does not block viewing a plan by route period.

## Readiness Check

- **INVEST:** Independent after F1 creates a plan; valuable for understanding category budgets; estimable under the approved financial precision policy; small and demonstrable; acceptance criteria are testable for whole-VND results.
- **Definition of Ready:** The route-period behavior, seven-jar model, backend response, and whole-VND remainder policy are specified. Plan-history browsing remains deferred and is outside this implementation.
