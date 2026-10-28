export const JAR_TYPES = [
  'livingExpenses',
  'food',
  'children',
  'emergencyFund',
  'savings',
  'investment',
  'entertainmentAndTravel'
] as const;

export type JarType = (typeof JAR_TYPES)[number];
