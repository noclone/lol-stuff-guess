# LoL Stuff Guess

Devine le champion à partir de son stuff, tiré d'une vraie game classée (ranked solo/duo).

- **Classique** : les 6 items sont visibles. À partir de la 3e erreur, chaque erreur débloque un indice (sorts d'invocateur → runes → rôle → stats de fin de game).
- **Challenger** : les items arrivent un par un, dans l'ordre d'achat. Une fois tous révélés, les indices prennent le relais.

Filtres disponibles : région, rang, durée de game. Interface en français et en anglais.

## Architecture

Site 100 % statique, aucune clé Riot côté navigateur.

| Dossier      | Rôle                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `shared/`    | Types et constantes partagés : format `Game`, index, découpage en shards |
| `collector/` | Script Node qui interroge l'API Riot et produit les données statiques    |
| `web/`       | Front Vue 3 + Vite                                                       |

Le collector :

1. tire des joueurs au hasard par région et par rang (`league-v4`) ;
2. récupère une de leurs ranked solo récentes, le détail et la timeline (`match-v5`) ;
3. garde les 10 joueurs de chaque game (ordre d'achat des items reconstruit depuis la timeline) ;
4. fusionne avec le pool existant, ne garde que les 3 derniers patchs ;
5. écrit `pool.json.gz` (état complet), un shard JSON par région × rang × tranche de durée, et `index.json`.

Le rang d'une game est celui du joueur tiré pour l'atteindre. Le front lit `index.json`, choisit un shard au hasard (pondéré par son nombre de manches) parmi ceux qui passent les filtres, et ne télécharge que celui-là.

## Développement

Prérequis : Node 24, [Task](https://taskfile.dev).

```sh
cp .env.example.secret .env.secret   # puis renseigner RIOT_API_KEY
task install
task collect -- --games 30 --platforms euw1
task dev                             # http://localhost:5273
```

`task` charge `.env.secret` ; le collector échoue immédiatement si `RIOT_API_KEY` est absente.

Options du collector (`task collect -- <options>`) :

| Option           | Défaut         | Description                                             |
| ---------------- | -------------- | ------------------------------------------------------- |
| `--games`        | `1500`         | Nombre de nouvelles games visé, réparti région × rang   |
| `--platforms`    | toutes         | Sous-ensemble de plateformes (`euw1,kr,...`)            |
| `--tiers`        | tous           | Sous-ensemble de rangs (`GOLD,MASTER,...`)              |
| `--keep-patches` | `3`            | Nombre de patchs conservés dans le pool                 |
| `--max-age-days` | `14`           | Ancienneté max des games récupérées                     |
| `--rate-limits`  | `20:1,100:120` | Limites de l'application Riot (`requêtes:secondes,...`) |

Contrôles : `task check` (lint, typecheck, tests), `task format`.

## Déploiement

GitHub Pages, via `.github/workflows/deploy.yml` :

- tous les jours à 4 h UTC : collecte de nouvelles games puis déploiement ;
- à chaque push sur `main` : redéploiement du pool actuel sans collecte ;
- manuellement (`workflow_dispatch`) avec un nombre de games au choix.

Le pool précédent est relu depuis le site publié (`/data/pool.json.gz`) : les données ne sont jamais commitées.

Configuration du repo GitHub :

- Settings → Pages → Source : **GitHub Actions** ;
- Settings → Secrets → Actions : `RIOT_API_KEY`.

## Mentions légales

LoL Stuff Guess isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
