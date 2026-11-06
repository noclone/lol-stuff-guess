const CDN = "https://ddragon.leagueoflegends.com";

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

const DDRAGON_LOCALES: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };

export interface Champion {
  key: number;
  id: string;
  name: string;
  tags: string[];
  resource: string;
}

export interface Icon {
  name: string;
  url: string;
}

export interface RuneTree extends Icon {
  id: number;
  slots: (Icon & { id: number })[][];
}

export interface StaticData {
  version: string;
  champions: Champion[];
  championsByKey: Map<number, Champion>;
  spells: Map<number, Icon>;
  runeTrees: Map<number, RuneTree>;
}

interface ChampionJson {
  data: Record<string, { id: string; key: string; name: string; tags: string[]; partype: string }>;
}

interface SummonerJson {
  data: Record<string, { key: string; name: string; image: { full: string } }>;
}

interface RuneJson {
  id: number;
  name: string;
  icon: string;
}

type RunesReforgedJson = (RuneJson & { slots: { runes: RuneJson[] }[] })[];

interface ItemJson {
  data: Record<string, { name: string }>;
}

const requests = new Map<string, Promise<unknown>>();

function getJson<T>(url: string): Promise<T> {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return response.json();
    });
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request as Promise<T>;
}

export async function loadStaticData(locale: Locale): Promise<StaticData> {
  const [version] = await getJson<string[]>(`${CDN}/api/versions.json`);
  if (!version) throw new Error("Data Dragon returned no version");
  const base = `${CDN}/cdn/${version}/data/${DDRAGON_LOCALES[locale]}`;
  const [championJson, summonerJson, runesJson] = await Promise.all([
    getJson<ChampionJson>(`${base}/champion.json`),
    getJson<SummonerJson>(`${base}/summoner.json`),
    getJson<RunesReforgedJson>(`${base}/runesReforged.json`),
  ]);

  const champions = Object.values(championJson.data)
    .map((c) => ({
      key: Number(c.key),
      id: c.id,
      name: c.name,
      tags: c.tags,
      resource: c.partype,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const spells = new Map(
    Object.values(summonerJson.data).map((s) => [
      Number(s.key),
      { name: s.name, url: `${CDN}/cdn/${version}/img/spell/${s.image.full}` },
    ]),
  );

  const runeTrees = new Map<number, RuneTree>(
    runesJson.map((tree) => [
      tree.id,
      {
        id: tree.id,
        name: tree.name,
        url: `${CDN}/cdn/img/${tree.icon}`,
        slots: tree.slots.map((slot) =>
          slot.runes.map((rune) => ({
            id: rune.id,
            name: rune.name,
            url: `${CDN}/cdn/img/${rune.icon}`,
          })),
        ),
      },
    ]),
  );

  return {
    version,
    champions,
    championsByKey: new Map(champions.map((c) => [c.key, c])),
    spells,
    runeTrees,
  };
}

export async function loadItemNames(version: string, locale: Locale): Promise<Map<number, string>> {
  const items = await getJson<ItemJson>(
    `${CDN}/cdn/${version}/data/${DDRAGON_LOCALES[locale]}/item.json`,
  );
  return new Map(Object.entries(items.data).map(([id, item]) => [Number(id), item.name]));
}

export function itemIconUrl(version: string, itemId: number): string {
  return `${CDN}/cdn/${version}/img/item/${itemId}.png`;
}

export function championIconUrl(version: string, championId: string): string {
  return `${CDN}/cdn/${version}/img/champion/${championId}.png`;
}
