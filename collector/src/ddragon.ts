const CDN = "https://ddragon.leagueoflegends.com";

export type ItemOrigins = ReadonlyMap<number, number>;

interface ItemJson {
  data: Record<string, { from?: string[]; specialRecipe?: number }>;
}

export function parseItemOrigins(json: ItemJson): Map<number, number> {
  const origins = new Map<number, number>();
  for (const [id, item] of Object.entries(json.data)) {
    const origin = item.specialRecipe || (item.from?.length === 1 ? Number(item.from[0]) : 0);
    if (origin) origins.set(Number(id), origin);
  }
  return origins;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Data Dragon ${url}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function fetchDdragonVersions(): Promise<string[]> {
  return getJson<string[]>(`${CDN}/api/versions.json`);
}

export function cachedItemOrigins(): (version: string) => Promise<ItemOrigins> {
  const cache = new Map<string, Promise<ItemOrigins>>();
  return (version) => {
    let origins = cache.get(version);
    if (!origins) {
      origins = getJson<ItemJson>(`${CDN}/cdn/${version}/data/en_US/item.json`).then(
        parseItemOrigins,
      );
      origins.catch(() => cache.delete(version));
      cache.set(version, origins);
    }
    return origins;
  };
}
