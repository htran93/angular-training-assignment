namespace FamilyFinance.Api.DTOs;

public sealed record MonthlyDashboardResponse(
    int Year,
    int Month,
    string Currency,
    string MonthlyIncomeVnd,
    string TotalSpentVnd,
    string RemainingVnd,
    decimal PercentageUsed,
    IReadOnlyList<DashboardJarResponse> Jars,
    IReadOnlyList<RecentExpenseResponse> RecentExpenses);

public sealed record DashboardJarResponse(
    string JarType,
    string JarName,
    int Percentage,
    string PlannedBudgetVnd,
    string SpentBudgetVnd,
    string RemainingVnd,
    decimal? PercentageUsed);

public sealed record RecentExpenseResponse(
    int Id,
    string ExpenseDate,
    string Description,
    string JarType,
    string JarName,
    string AmountVnd);
