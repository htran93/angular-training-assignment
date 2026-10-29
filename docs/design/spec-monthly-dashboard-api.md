# Monthly Dashboard API Contract (F5)

This specification covers the monthly dashboard APIs. The files named
`spec-f5-frontend.md` and `spec-f5-backend.md` currently describe F4 spending by
jar and are not the F5 dashboard contract.

## Plan periods

`GET /api/v1/budget-plans/periods`

Returns only months with an existing plan, ordered by year and month descending.

```json
{
  "periods": [
    { "year": 2026, "month": 9 },
    { "year": 2026, "month": 8 }
  ]
}
```

The dashboard selects the first (most recent) period on initial load. An empty
list means no plans exist; the client must show the create-plan action rather
than fabricate a period.

## Monthly dashboard

`GET /api/v1/budget-plans/{year:int}/{month:int}/dashboard`

Returns `404 MONTHLY_PLAN_NOT_FOUND` when the selected period has no plan.
Invalid year or month values return `400 VALIDATION_ERROR`.

```json
{
  "year": 2026,
  "month": 9,
  "currency": "VND",
  "monthlyIncomeVnd": "25000000",
  "totalSpentVnd": "2750000",
  "remainingVnd": "22250000",
  "percentageUsed": 11.0,
  "jars": [
    {
      "jarType": "food",
      "jarName": "Food",
      "percentage": 20,
      "plannedBudgetVnd": "5000000",
      "spentBudgetVnd": "1000000",
      "remainingVnd": "4000000",
      "percentageUsed": 20.0
    }
  ],
  "recentExpenses": [
    {
      "id": 21,
      "expenseDate": "2026-09-15",
      "description": "Market groceries",
      "jarType": "food",
      "jarName": "Food",
      "amountVnd": "125000"
    }
  ]
}
```

The example is illustrative; the response always contains all seven canonical
jars and up to three recent expenses.

### Monetary and progress rules

- Every monetary field is an invariant-culture digit string, except remaining
  balances, which may have a leading minus sign. The client formats but does not
  recalculate these amounts.
- `totalSpentVnd` is the sum of expenses assigned to the selected plan's jars.
- Overall remaining is monthly income less total spent. Jar remaining is the
  planned budget less jar spending.
- Overall and per-jar percentages are calculated by the backend and rounded to
  two decimal places. They may exceed 100%; the dashboard displays the numeric
  progress without a separate overspending warning.
- New plans require at least 11 VND of monthly income under the current fixed
  allocation rates, ensuring a positive budget for every jar.
- For compatibility with older persisted plans, a zero-budget jar with no
  expenses reports `percentageUsed: 0`. If such a jar has spending, its
  `percentageUsed` is `null` because the ratio is undefined; the client displays
  progress as unavailable while retaining the backend amount and balance.

### Recent activity

Recent expenses belong only to the selected plan and are ordered by
`CreatedAtUtc` descending, then ID descending, with a maximum of three entries.
The response includes the expense date, description, jar identity, and
backend-provided amount.

## Client behavior

- Parse responses as untrusted data and reject incomplete or malformed payloads.
- Sort available periods descending before choosing the initial period, so the
  most recent plan is selected even if a server response is misordered.
- On plan selection or retry, request the selected period's dashboard again.
- Show loading, no-plan, missing-plan, and error states explicitly.
- Use shared presentation components and the VND formatter; do not derive
  income, spent amounts, balances, or percentages in the client.
