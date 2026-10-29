import { isJarType, JAR_TYPES, JarType } from '../../../shared/models/jar-type';

export interface DashboardPeriod {
  year: number;
  month: number;
}

export interface DashboardJar {
  jarType: JarType;
  jarName: string;
  percentage: number;
  plannedBudgetVnd: string;
  spentBudgetVnd: string;
  remainingVnd: string;
  percentageUsed: number | null;
}

export interface RecentDashboardExpense {
  id: number;
  expenseDate: string;
  description: string;
  jarType: JarType;
  jarName: string;
  amountVnd: string;
}

export interface MonthlyDashboardResponse {
  year: number;
  month: number;
  currency: 'VND';
  monthlyIncomeVnd: string;
  totalSpentVnd: string;
  remainingVnd: string;
  percentageUsed: number;
  jars: DashboardJar[];
  recentExpenses: RecentDashboardExpense[];
}

export class InvalidDashboardResponseError extends Error {
  constructor() {
    super('The dashboard API returned data that does not match its contract.');
    this.name = 'InvalidDashboardResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isDigitString(value: unknown): value is string {
  return typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value);
}

function isPositiveDigitString(value: unknown): value is string {
  return isDigitString(value) && value !== '0';
}

function isSignedDigitString(value: unknown): value is string {
  return typeof value === 'string' && /^-?(0|[1-9][0-9]*)$/.test(value);
}

function isPercentage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isJarPercentage(
  value: unknown,
  plannedBudgetVnd: string,
  spentBudgetVnd: string
): value is number | null {
  if (plannedBudgetVnd === '0') {
    return spentBudgetVnd === '0' ? value === 0 : value === null;
  }
  return isPercentage(value);
}

function isExpenseDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!isIntegerInRange(year, 1, 9999) || !isIntegerInRange(month, 1, 12)) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = month === 2
    ? isLeapYear ? 29 : 28
    : [4, 6, 9, 11].includes(month) ? 30 : 31;
  return isIntegerInRange(day, 1, daysInMonth);
}

export function parseDashboardPeriodsResponse(value: unknown): DashboardPeriod[] {
  if (!isRecord(value) || !Array.isArray(value['periods'])) {
    throw new InvalidDashboardResponseError();
  }

  const periods: DashboardPeriod[] = [];
  const seen = new Set<string>();
  for (const rawPeriod of value['periods']) {
    if (
      !isRecord(rawPeriod) ||
      !isIntegerInRange(rawPeriod['year'], 1, 9999) ||
      !isIntegerInRange(rawPeriod['month'], 1, 12)
    ) {
      throw new InvalidDashboardResponseError();
    }

    const period = { year: rawPeriod['year'], month: rawPeriod['month'] };
    const key = `${period.year}-${period.month}`;
    if (seen.has(key)) {
      throw new InvalidDashboardResponseError();
    }
    seen.add(key);
    periods.push(period);
  }

  return periods.sort((left, right) => right.year - left.year || right.month - left.month);
}

export function parseMonthlyDashboardResponse(
  value: unknown,
  expectedYear: number,
  expectedMonth: number
): MonthlyDashboardResponse {
  if (!isRecord(value)) {
    throw new InvalidDashboardResponseError();
  }

  const year = value['year'];
  const month = value['month'];
  const currency = value['currency'];
  const monthlyIncomeVnd = value['monthlyIncomeVnd'];
  const totalSpentVnd = value['totalSpentVnd'];
  const remainingVnd = value['remainingVnd'];
  const percentageUsed = value['percentageUsed'];
  const rawJars = value['jars'];
  const rawRecentExpenses = value['recentExpenses'];

  if (
    year !== expectedYear ||
    month !== expectedMonth ||
    !isIntegerInRange(year, 1, 9999) ||
    !isIntegerInRange(month, 1, 12) ||
    currency !== 'VND' ||
    !isPositiveDigitString(monthlyIncomeVnd) ||
    !isDigitString(totalSpentVnd) ||
    !isSignedDigitString(remainingVnd) ||
    !isPercentage(percentageUsed) ||
    !Array.isArray(rawJars) ||
    rawJars.length !== JAR_TYPES.length ||
    !Array.isArray(rawRecentExpenses) ||
    rawRecentExpenses.length > 3
  ) {
    throw new InvalidDashboardResponseError();
  }

  const jars: DashboardJar[] = [];
  const jarTypes = new Set<JarType>();
  for (const rawJar of rawJars) {
    if (
      !isRecord(rawJar) ||
      !isJarType(rawJar['jarType']) ||
      typeof rawJar['jarName'] !== 'string' ||
      rawJar['jarName'].trim().length === 0 ||
      !isIntegerInRange(rawJar['percentage'], 0, 100) ||
      !isDigitString(rawJar['plannedBudgetVnd']) ||
      !isDigitString(rawJar['spentBudgetVnd']) ||
      !isSignedDigitString(rawJar['remainingVnd']) ||
      !isJarPercentage(rawJar['percentageUsed'], rawJar['plannedBudgetVnd'], rawJar['spentBudgetVnd']) ||
      jarTypes.has(rawJar['jarType'])
    ) {
      throw new InvalidDashboardResponseError();
    }

    jarTypes.add(rawJar['jarType']);
    jars.push({
      jarType: rawJar['jarType'],
      jarName: rawJar['jarName'],
      percentage: rawJar['percentage'],
      plannedBudgetVnd: rawJar['plannedBudgetVnd'],
      spentBudgetVnd: rawJar['spentBudgetVnd'],
      remainingVnd: rawJar['remainingVnd'],
      percentageUsed: rawJar['percentageUsed']
    });
  }

  if (JAR_TYPES.some(jarType => !jarTypes.has(jarType)) || jars.reduce((sum, jar) => sum + jar.percentage, 0) !== 100) {
    throw new InvalidDashboardResponseError();
  }

  const recentExpenses: RecentDashboardExpense[] = [];
  for (const rawExpense of rawRecentExpenses) {
    if (
      !isRecord(rawExpense) ||
      !isIntegerInRange(rawExpense['id'], 1, Number.MAX_SAFE_INTEGER) ||
      !isExpenseDate(rawExpense['expenseDate']) ||
      typeof rawExpense['description'] !== 'string' ||
      rawExpense['description'].trim().length === 0 ||
      !isJarType(rawExpense['jarType']) ||
      typeof rawExpense['jarName'] !== 'string' ||
      rawExpense['jarName'].trim().length === 0 ||
      !isPositiveDigitString(rawExpense['amountVnd'])
    ) {
      throw new InvalidDashboardResponseError();
    }

    recentExpenses.push({
      id: rawExpense['id'],
      expenseDate: rawExpense['expenseDate'],
      description: rawExpense['description'],
      jarType: rawExpense['jarType'],
      jarName: rawExpense['jarName'],
      amountVnd: rawExpense['amountVnd']
    });
  }

  return {
    year,
    month,
    currency: 'VND',
    monthlyIncomeVnd,
    totalSpentVnd,
    remainingVnd,
    percentageUsed,
    jars,
    recentExpenses
  };
}
