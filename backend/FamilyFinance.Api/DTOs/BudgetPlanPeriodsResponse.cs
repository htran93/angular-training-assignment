namespace FamilyFinance.Api.DTOs;

public sealed record BudgetPlanPeriodsResponse(IReadOnlyList<BudgetPlanPeriodResponse> Periods);

public sealed record BudgetPlanPeriodResponse(int Year, int Month);
