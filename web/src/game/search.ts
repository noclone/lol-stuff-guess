export interface Searchable {
  key: number;
  name: string;
}

const MAX_SUGGESTIONS = 8;

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function searchChampions<T extends Searchable>(
  champions: readonly T[],
  query: string,
  excludedKeys: ReadonlySet<number>,
): T[] {
  const needle = normalize(query);
  if (!needle) return [];
  const candidates = champions.filter((c) => !excludedKeys.has(c.key));
  const prefix = candidates.filter((c) => normalize(c.name).startsWith(needle));
  const inner = candidates.filter(
    (c) => !normalize(c.name).startsWith(needle) && normalize(c.name).includes(needle),
  );
  return [...prefix, ...inner].slice(0, MAX_SUGGESTIONS);
}
