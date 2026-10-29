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

const jarTypes = new Set<string>(JAR_TYPES);

export function isJarType(value: unknown): value is JarType {
  return typeof value === 'string' && jarTypes.has(value);
}
