import { isJarType, JarType } from '../../../shared/models/jar-type';

export interface CreateExpenseRequest {
  expenseDate: string;
  jarType: JarType;
  amountVnd: string;
  description: string;
}

export interface CreatedExpense {
  id: number;
  expenseDate: string;
  jarType: JarType;
  jarName: string;
  amountVnd: string;
  description: string;
  createdAtUtc: string;
}

export interface JarSpendingSummary {
  jarType: JarType;
  jarName: string;
  percentage: number;
  budgetVnd: string;
  spentVnd: string;
  remainingVnd: string;
}

export interface CreateExpenseResponse {
  expense: CreatedExpense;
  jarSummary: JarSpendingSummary;
}

export class InvalidExpenseResponseError extends Error {
  constructor() {
    super('The expense API returned data that does not match its contract.');
    this.name = 'InvalidExpenseResponseError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDigitString(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]+$/.test(value);
}

export function isValidExpenseDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth;
}

export function parseCreateExpenseResponse(value: unknown): CreateExpenseResponse {
  if (!isRecord(value) || !isRecord(value['expense']) || !isRecord(value['jarSummary'])) {
    throw new InvalidExpenseResponseError();
  }

  const rawExpense = value['expense'];
  const rawSummary = value['jarSummary'];
  const expense = {
    id: rawExpense['id'],
    expenseDate: rawExpense['expenseDate'],
    jarType: rawExpense['jarType'],
    jarName: rawExpense['jarName'],
    amountVnd: rawExpense['amountVnd'],
    description: rawExpense['description'],
    createdAtUtc: rawExpense['createdAtUtc']
  };
  const summary = {
    jarType: rawSummary['jarType'],
    jarName: rawSummary['jarName'],
    percentage: rawSummary['percentage'],
    budgetVnd: rawSummary['budgetVnd'],
    spentVnd: rawSummary['spentVnd'],
    remainingVnd: rawSummary['remainingVnd']
  };

  if (
    typeof expense.id !== 'number' ||
    !Number.isSafeInteger(expense.id) ||
    expense.id < 1 ||
    !isValidExpenseDate(expense.expenseDate) ||
    !isJarType(expense.jarType) ||
    typeof expense.jarName !== 'string' ||
    expense.jarName.trim().length === 0 ||
    !isDigitString(expense.amountVnd) ||
    !/[1-9]/.test(expense.amountVnd) ||
    typeof expense.description !== 'string' ||
    expense.description.trim().length === 0 ||
    Array.from(expense.description).length > 500 ||
    typeof expense.createdAtUtc !== 'string' ||
    !Number.isFinite(Date.parse(expense.createdAtUtc)) ||
    !isJarType(summary.jarType) ||
    summary.jarType !== expense.jarType ||
    summary.jarName !== expense.jarName ||
    typeof summary.percentage !== 'number' ||
    !Number.isInteger(summary.percentage) ||
    summary.percentage < 0 ||
    summary.percentage > 100 ||
    !isDigitString(summary.budgetVnd) ||
    !isDigitString(summary.spentVnd) ||
    typeof summary.remainingVnd !== 'string' ||
    !/^-?[0-9]+$/.test(summary.remainingVnd)
  ) {
    throw new InvalidExpenseResponseError();
  }

  return {
    expense: {
      id: expense.id,
      expenseDate: expense.expenseDate,
      jarType: expense.jarType,
      jarName: expense.jarName,
      amountVnd: expense.amountVnd,
      description: expense.description,
      createdAtUtc: expense.createdAtUtc
    },
    jarSummary: {
      jarType: summary.jarType,
      jarName: summary.jarName,
      percentage: summary.percentage,
      budgetVnd: summary.budgetVnd,
      spentVnd: summary.spentVnd,
      remainingVnd: summary.remainingVnd
    }
  };
}
