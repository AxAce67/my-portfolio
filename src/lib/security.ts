const INTERNAL_PATH_PATTERN = /^\/(?!\/)/;

export function sanitizeInternalPath(input: string | null | undefined, fallback: string) {
  if (!input) return fallback;
  const value = input.trim();

  if (!INTERNAL_PATH_PATTERN.test(value)) return fallback;
  if (value.includes('\r') || value.includes('\n')) return fallback;

  try {
    const parsed = new URL(value, 'http://localhost');
    if (parsed.origin !== 'http://localhost') return fallback;
    const result = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (result.startsWith('//') || result.startsWith('\\\\')) return fallback;

    return result;
  } catch {
    return fallback;
  }
}
