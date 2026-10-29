import { isJarType, JarType, JAR_TYPES } from '../../../shared/models/jar-type';

export interface DefaultJar {
  jarType: JarType;
  name: string;
  percentage: number;
  suggestedLogic: string;
}

export interface DefaultJarsResponse {
  currency: 'VND';
  totalPercentage: 100;
  jars: DefaultJar[];
}

export interface CreateMonthlyPlanRequest {
  year: number;
  month: number;
  monthlyIncomeVnd: string;
}

export interface MonthlyPlanJar {
  jarType: JarType;
  name: string;
  percentage: number;
  budgetVnd: string;
}

export interface MonthlyPlanResponse {
  id: number;
  year: number;
  month: number;
  monthlyIncomeVnd: string;
  currency: 'VND';
  createdAtUtc: string;
  jars: MonthlyPlanJar[];
}

export class InvalidBudgetPlanResponseError extends Error {
  constructor() {
    super('The budget plan API returned data that does not match its contract.');
    this.name = 'InvalidBudgetPlanResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isDigitString(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]+$/.test(value);
}

function isPositiveDigitString(value: unknown): value is string {
  return isDigitString(value) && /[1-9]/.test(value);
}

function hasValidJarPercentages(jars: unknown[]): boolean {
  const percentages: number[] = [];
  for (const jar of jars) {
    if (!isRecord(jar)) {
      return false;
    }

    const percentage = jar['percentage'];
    if (!isIntegerInRange(percentage, 0, 100)) {
      return false;
    }
    percentages.push(percentage);
  }
  return percentages.reduce((total, percentage) => total + percentage, 0) === 100;
}

function hasSevenKnownUniqueJarTypes(jars: unknown[]): boolean {
  if (jars.length !== JAR_TYPES.length) {
    return false;
  }

  const types = jars.map(jar => isRecord(jar) ? jar['jarType'] : undefined);
  return types.every(isJarType) && new Set(types).size === JAR_TYPES.length;
}

export function parseDefaultJarsResponse(value: unknown): DefaultJarsResponse {
  if (!isRecord(value)) {
    throw new InvalidBudgetPlanResponseError();
  }

  const currency = value['currency'];
  const totalPercentage = value['totalPercentage'];
  const rawJars = value['jars'];
  if (
    currency !== 'VND' ||
    totalPercentage !== 100 ||
    !isUnknownArray(rawJars) ||
    !hasSevenKnownUniqueJarTypes(rawJars) ||
    !hasValidJarPercentages(rawJars)
  ) {
    throw new InvalidBudgetPlanResponseError();
  }

  const jars: DefaultJar[] = rawJars.map(jar => {
    if (
      !isRecord(jar) ||
      !isJarType(jar['jarType']) ||
      !isIntegerInRange(jar['percentage'], 0, 100) ||
      typeof jar['name'] !== 'string' ||
      jar['name'].trim().length === 0 ||
      typeof jar['suggestedLogic'] !== 'string'
    ) {
      throw new InvalidBudgetPlanResponseError();
    }
    return {
      jarType: jar['jarType'],
      name: jar['name'],
      percentage: jar['percentage'],
      suggestedLogic: jar['suggestedLogic']
    };
  });

  return { currency: 'VND', totalPercentage: 100, jars };
}

export function parseMonthlyPlanResponse(value: unknown): MonthlyPlanResponse {
  if (!isRecord(value)) {
    throw new InvalidBudgetPlanResponseError();
  }

  const id = value['id'];
  const year = value['year'];
  const month = value['month'];
  const monthlyIncomeVnd = value['monthlyIncomeVnd'];
  const currency = value['currency'];
  const createdAtUtc = value['createdAtUtc'];
  const rawJars = value['jars'];
  if (
    !isIntegerInRange(id, 1, Number.MAX_SAFE_INTEGER) ||
    !isIntegerInRange(year, 1, 9999) ||
    !isIntegerInRange(month, 1, 12) ||
    !isPositiveDigitString(monthlyIncomeVnd) ||
    currency !== 'VND' ||
    typeof createdAtUtc !== 'string' ||
    !Number.isFinite(Date.parse(createdAtUtc)) ||
    !isUnknownArray(rawJars) ||
    !hasSevenKnownUniqueJarTypes(rawJars) ||
    !hasValidJarPercentages(rawJars)
  ) {
    throw new InvalidBudgetPlanResponseError();
  }

  const jars: MonthlyPlanJar[] = rawJars.map(jar => {
    if (
      !isRecord(jar) ||
      !isJarType(jar['jarType']) ||
      !isIntegerInRange(jar['percentage'], 0, 100) ||
      typeof jar['name'] !== 'string' ||
      jar['name'].trim().length === 0 ||
      !isDigitString(jar['budgetVnd'])
    ) {
      throw new InvalidBudgetPlanResponseError();
    }
    return {
      jarType: jar['jarType'],
      name: jar['name'],
      percentage: jar['percentage'],
      budgetVnd: jar['budgetVnd']
    };
  });

  return {
    id,
    year,
    month,
    monthlyIncomeVnd,
    currency: 'VND',
    createdAtUtc,
    jars
  };
}
