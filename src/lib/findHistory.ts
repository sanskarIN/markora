const FIND_HISTORY_KEY = 'markora.find-history.v1';
const MAX_HISTORY_ITEMS = 10;
const MAX_QUERY_LENGTH = 240;

export function loadFindHistory(): string[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FIND_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map((value) => value.slice(0, MAX_QUERY_LENGTH))
      .filter((value, index, all) => all.indexOf(value) === index)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function recordFindQuery(query: string): string[] {
  const normalized = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (!normalized) return loadFindHistory();

  const next = [normalized, ...loadFindHistory().filter((item) => item !== normalized)].slice(
    0,
    MAX_HISTORY_ITEMS,
  );
  persist(next);
  return next;
}

export function clearFindHistory(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(FIND_HISTORY_KEY);
  } catch {
    // Search remains fully usable when storage is blocked or unavailable.
  }
}

function persist(history: string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FIND_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Find history is optional and must never block editing.
  }
}
