# LoL Stuff Guess

Devine le champion à partir de son stuff, tiré d'une vraie game classée (ranked solo/duo).

Chaque jour, un daily de 10 champions, un par rang, de Fer à Challenger. Tout le monde joue la même grille pour une même date, qui change à minuit heure locale. La progression est sauvegardée dans le navigateur, et le résultat se partage en emojis.

Le rang, le rôle, le KDA, les CS, la durée et l'issue de la game sont affichés d'emblée.

- **Classique** : les 6 items sont visibles. Chaque erreur débloque un indice : classe et ressource du champion → page de runes → sorts d'invocateur → ordre de montée des sorts.
- **Challenger** : les items arrivent un par un, dans l'ordre d'achat. Une fois tous révélés, les indices prennent le relais.

Le mode se choisit au début du daily. Chaque rang laisse deux essais une fois tout révélé (6 en classique, jusqu'à 11 en challenger), puis la réponse est donnée et on passe au rang suivant. Interface en français et en anglais.

## Architecture

Site 100 % statique, aucune clé Riot côté navigateur.

| Dossier      | Rôle                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `shared/`    | Types et constantes partagés : format `Game`, format du daily         |
| `collector/` | Script Node qui interroge l'API Riot et produit les données statiques |
| `web/`       | Front Vue 3 + Vite                                                    |

Le collector :

1. tire des joueurs au hasard par région et par rang (`league-v4`) ;
2. récupère une de leurs ranked solo récentes, le détail et la timeline (`match-v5`) ;
3. garde les 10 joueurs de chaque game (ordre d'achat des items reconstruit depuis la timeline) ;
4. fusionne avec le pool existant, ne garde que les 3 derniers patchs ;
5. génère les dailies manquants, d'hier à après-demain (UTC), pour couvrir tous les fuseaux horaires : un joueur par rang, 10 champions différents, de préférence avec au moins 4 items et une game d'au moins 15 minutes, jamais une game déjà utilisée par un autre daily ;
6. écrit `pool.json.gz` (games et dailies des 30 derniers jours) et un `daily/AAAA-MM-JJ.json` par daily.

Un daily déjà généré n'est jamais modifié, même si le pool évolue.

Le rang d'une game est celui du joueur tiré pour l'atteindre. Le front ne charge que le daily de la date locale.

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

| Option                | Défaut         | Description                                             |
| --------------------- | -------------- | ------------------------------------------------------- |
| `--games`             | `1500`         | Nombre de nouvelles games visé, réparti région × rang   |
| `--platforms`         | toutes         | Sous-ensemble de plateformes (`euw1,kr,...`)            |
| `--tiers`             | tous           | Sous-ensemble de rangs (`GOLD,MASTER,...`)              |
| `--keep-patches`      | `3`            | Nombre de patchs conservés dans le pool                 |
| `--keep-dailies-days` | `30`           | Nombre de jours de dailies conservés                    |
| `--max-age-days`      | `14`           | Ancienneté max des games récupérées                     |
| `--rate-limits`       | `20:1,100:120` | Limites de l'application Riot (`requêtes:secondes,...`) |

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
