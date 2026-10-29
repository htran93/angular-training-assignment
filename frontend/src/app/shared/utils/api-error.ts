export function getApiErrorCode(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const code = Reflect.get(value, 'code');
  return typeof code === 'string' ? code : null;
}
