const ALLOWED_EXTERNAL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

export function normalizeExternalUrl(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (!value) return null;

  if (value.startsWith('#')) return value;

  try {
    const url = new URL(value);
    if (!ALLOWED_EXTERNAL_SCHEMES.has(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(rawUrl: string): boolean {
  const normalized = normalizeExternalUrl(rawUrl);
  return normalized !== null && !normalized.startsWith('#');
}

export function redactLogValue(key: string, value: unknown): unknown {
  const normalizedKey = key.toLocaleLowerCase();
  const secretWords = ['token', 'password', 'secret', 'authorization', 'cookie', 'content'];
  if (secretWords.some((word) => normalizedKey.includes(word))) return '[REDACTED]';
  if (normalizedKey.includes('path')) return '[REDACTED_PATH]';
  if (typeof value === 'string' && value.length > 512) return `${value.slice(0, 128)}…[TRUNCATED]`;
  return value;
}

export function sanitizeLogContext(context: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, redactLogValue(key, value)]),
  );
}
