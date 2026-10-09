# Moonwell — trackers Rogue et Hunter

Site statique HTML/CSS/JavaScript pour **WoW The Burning Crusade original 2.4.3, build 8606**, serveur Moonwell x5.

- `index.html` : **Fandebr**, Rogue PvP, build **20/0/41**. Liste de talents d'origine conservée.
- `hunter.html` : **Fandenibard**, Hunter PvE, niveau initial **25**, build **41/20/0**.
- Navigation entre les deux personnages, une case par point prévu, rangs séquentiels.
- Sauvegarde locale immédiate et synchronisation Supabase automatique, **sans compte ni bouton Synchroniser**.

## GitHub Pages

Publier les deux fichiers HTML, `tracker.css`, `tracker.js`, `rogue.js` et `hunter.js` à la racine du dépôt. Conserver Settings → Pages → branche et dossier utilisés actuellement. Aucun build, framework, serveur Node.js ou backend supplémentaire. Les chemins relatifs fonctionnent sous le sous-dossier du dépôt GitHub Pages.

Pour un aperçu local : `python3 -m http.server 8765 --bind 127.0.0.1`, puis ouvrir `http://127.0.0.1:8765`. Ce serveur ne sert qu'à la prévisualisation ; GitHub Pages sert les mêmes fichiers. En `file://`, le stockage local dépend des restrictions du navigateur.

## Supabase : migration à appliquer

Dans le **SQL Editor du projet existant**, exécuter **`supabase.sql`**. Aucun changement d'URL ou de clé publique n'est nécessaire. Les paramètres existants sont dans `tracker.js`.

Le script peut être exécuté plusieurs fois. Il :

1. Conserve la table `rogue_progress`, sa clé primaire `slug` et les progressions existantes.
2. Rend l'ancienne colonne `owner_id` facultative, sans effacer ses valeurs existantes. Les trackers ne l'envoient plus.
3. Accorde la lecture au rôle public et l'insertion/mise à jour des champs de progression.
4. Autorise les écritures sans connexion pour les slugs `fandebr` et `fandenibard` avec RLS activé. Aucun droit de suppression n'est ajouté.

**Mode partagé choisi : toute personne ayant accès au site peut modifier ces deux progressions.** Aucune configuration Supabase Auth n'est nécessaire. La clé `sb_publishable_…` reste publique, dans le header `apikey` ; aucune clé secrète n'est utilisée.

L'API réelle a renvoyé **HTTP 401 / `permission denied for table rogue_progress`** lors de la vérification en lecture. La migration corrige les droits SQL manquants. Elle est fournie dans le dépôt, mais n'a pas été exécutée sur le projet distant : la clé publique ne permet pas d'administrer la base.

## Sauvegardes indépendantes

| Personnage | Page | Slug Supabase | Clé locale |
| --- | --- | --- | --- |
| Fandebr | `index.html` | `fandebr` | `moonwell-rogue-tracker-v3` (inchangée) |
| Fandenibard | `hunter.html` | `fandenibard` | `moonwell-hunter-fandenibard-v1` |

Le champ `checked` contient un tableau du nombre de points investis par talent, dans l'ordre du fichier de personnage. L'ancien format Rogue (indices de talents cochés) est toujours reconnu. Ne pas réordonner les talents dans ces fichiers sans migration des données.

Au chargement, seule la ligne correspondant au slug est lue. Si elle n'existe pas, elle est créée à partir de la copie locale ou de l'état initial. Les talents du Hunter démarrent décochés : le niveau 25 donne **16 points à confirmer**, sans inventer les points réellement investis en jeu.

Chaque clic ou changement de niveau enregistre localement puis déclenche une écriture après 250 ms. Les écritures sont sérialisées. Une lecture lente ne remplace pas des modifications faites pendant le chargement. Les modifications non envoyées restent marquées localement et sont réessayées au rechargement, au retour en ligne ou lors d'une nouvelle modification. Les changements en attente sont aussi envoyés à la sortie de page lorsque le navigateur le permet.

Pour un même personnage modifié simultanément sur deux appareils, la dernière sauvegarde reçue remplace l'allocation complète. Les deux personnages restent indépendants.

## Build Hunter retenu

Priorité BM jusqu'au niveau 50 ; Précision aux niveaux 51 à 70. Efficiency réduit les pauses mana pendant le leveling. Aimed Shot est nécessaire pour accéder à Mortal Shots en 2.4.3. Frenzy est prévu à **4/5**, avec quatre cases seulement ; Endurance Training à **1/5**, avec une seule case. Animal Handler a deux cases, aux niveaux **39 et 44**, afin de prendre Bestial Wrath dès le niveau 40.

Les cases enregistrent les talents réellement investis : elles restent éditables et un avertissement signale les allocations Hunter ne respectant pas les tiers, dépendances ou le budget de niveau. L'ordre conseillé, lui, est valide à chaque niveau.

| Arbre | Talent | Build final |
| --- | --- | --- |
| Beast Mastery | Improved Aspect of the Hawk | 5/5 |
| Beast Mastery | Focused Fire | 2/2 |
| Beast Mastery | Improved Revive Pet | 2/2 |
| Beast Mastery | Endurance Training | 1/5 |
| Beast Mastery | Unleashed Fury | 5/5 |
| Beast Mastery | Ferocity | 5/5 |
| Beast Mastery | Intimidation | 1/1 |
| Beast Mastery | Bestial Discipline | 2/2 |
| Beast Mastery | Improved Mend Pet | 2/2 |
| Beast Mastery | Frenzy | 4/5 |
| Beast Mastery | Animal Handler | 2/2 |
| Beast Mastery | Bestial Wrath | 1/1 |
| Beast Mastery | Ferocious Inspiration | 3/3 |
| Beast Mastery | Serpent's Swiftness | 5/5 |
| Beast Mastery | The Beast Within | 1/1 |
| Marksmanship | Lethal Shots | 5/5 |
| Marksmanship | Efficiency | 5/5 |
| Marksmanship | Go for the Throat | 2/2 |
| Marksmanship | Rapid Killing | 2/2 |
| Marksmanship | Aimed Shot | 1/1 |
| Marksmanship | Mortal Shots | 5/5 |

**Total : Beast Mastery 41 + Marksmanship 20 + Survival 0 = 61.**

## Ordre exact du niveau 10 au niveau 70

Un point par ligne. Le rang indiqué est le rang du talent dans le jeu.

| Niveau | Talent | Rang atteint |
| --- | --- | --- |
| 10 | Improved Aspect of the Hawk | 1/5 |
| 11 | Improved Aspect of the Hawk | 2/5 |
| 12 | Improved Aspect of the Hawk | 3/5 |
| 13 | Improved Aspect of the Hawk | 4/5 |
| 14 | Improved Aspect of the Hawk | 5/5 |
| 15 | Focused Fire | 1/2 |
| 16 | Focused Fire | 2/2 |
| 17 | Improved Revive Pet | 1/2 |
| 18 | Improved Revive Pet | 2/2 |
| 19 | Endurance Training | 1/5 |
| 20 | Unleashed Fury | 1/5 |
| 21 | Unleashed Fury | 2/5 |
| 22 | Unleashed Fury | 3/5 |
| 23 | Unleashed Fury | 4/5 |
| 24 | Unleashed Fury | 5/5 |
| 25 | Ferocity | 1/5 |
| 26 | Ferocity | 2/5 |
| 27 | Ferocity | 3/5 |
| 28 | Ferocity | 4/5 |
| 29 | Ferocity | 5/5 |
| 30 | Intimidation | 1/1 |
| 31 | Bestial Discipline | 1/2 |
| 32 | Bestial Discipline | 2/2 |
| 33 | Improved Mend Pet | 1/2 |
| 34 | Improved Mend Pet | 2/2 |
| 35 | Frenzy | 1/5 |
| 36 | Frenzy | 2/5 |
| 37 | Frenzy | 3/5 |
| 38 | Frenzy | 4/5 |
| 39 | Animal Handler | 1/2 |
| 40 | Bestial Wrath | 1/1 |
| 41 | Ferocious Inspiration | 1/3 |
| 42 | Ferocious Inspiration | 2/3 |
| 43 | Ferocious Inspiration | 3/3 |
| 44 | Animal Handler | 2/2 |
| 45 | Serpent's Swiftness | 1/5 |
| 46 | Serpent's Swiftness | 2/5 |
| 47 | Serpent's Swiftness | 3/5 |
| 48 | Serpent's Swiftness | 4/5 |
| 49 | Serpent's Swiftness | 5/5 |
| 50 | The Beast Within | 1/1 |
| 51 | Lethal Shots | 1/5 |
| 52 | Lethal Shots | 2/5 |
| 53 | Lethal Shots | 3/5 |
| 54 | Lethal Shots | 4/5 |
| 55 | Lethal Shots | 5/5 |
| 56 | Efficiency | 1/5 |
| 57 | Efficiency | 2/5 |
| 58 | Efficiency | 3/5 |
| 59 | Efficiency | 4/5 |
| 60 | Efficiency | 5/5 |
| 61 | Go for the Throat | 1/2 |
| 62 | Go for the Throat | 2/2 |
| 63 | Rapid Killing | 1/2 |
| 64 | Rapid Killing | 2/2 |
| 65 | Aimed Shot | 1/1 |
| 66 | Mortal Shots | 1/5 |
| 67 | Mortal Shots | 2/5 |
| 68 | Mortal Shots | 3/5 |
| 69 | Mortal Shots | 4/5 |
| 70 | Mortal Shots | 5/5 |

Niveau 25 : **25 − 9 = 16** points. Niveau 50 : **41 BM**. Niveau 70 : **70 − 9 = 61** points.

## Sources et vérification

- Hunter : [données originales du calculateur TBC de Vampyr7878](https://github.com/Vampyr7878/WoW-Talent-Caluclator-TBC/blob/master/WoW%20Talent%20Calculator%20TBC/Data/Hunter.xml), antérieures à TBC Classic. Les noms, rangs maximum, tiers et dépendances ont été extraits dans `tests/fixtures/hunter-tbc.json` pour contrôler le parcours indépendamment des métadonnées de l'application.
- Rogue : [Icy Veins](https://www.icy-veins.com/tbc-classic/subtlety-rogue-pvp-guide) et [Warcraft Tavern](https://www.warcrafttavern.com/tbc/guides/rogue-shadowstep-pvp/), sources déjà présentes dans le site. Son build n'a pas été modifié.
- Supabase : [clés publiques et rôles](https://supabase.com/docs/guides/api/api-keys). Les privilèges SQL et les politiques RLS doivent tous deux permettre la requête.

## Tests

Sans dépendance :

```sh
node --test tests/builds.test.cjs
```

Pour les tests navigateur et SQL, installer les dépendances de test hors du site :

```sh
npm install --prefix /tmp/moonwell-qa playwright @electric-sql/pglite
python3 -m http.server 8765 --bind 127.0.0.1
```

Dans un second terminal (Chrome installé) :

```sh
NODE_PATH=/tmp/moonwell-qa/node_modules node tests/browser.cjs
NODE_PATH=/tmp/moonwell-qa/node_modules node tests/sql.cjs
```

`TRACKER_TEST_URL` permet d'utiliser un autre serveur local ; `CHROME_CHANNEL` permet de changer le canal Chromium. Les captures sont écrites dans `/tmp/moonwell-qa/`.

Les tests couvrent :

- chaque niveau et prérequis Hunter, les totaux 41/20/0, les budgets 16 et 61 ;
- la non-régression de l'allocation Rogue comparée à son état initial ;
- 61 cases par personnage, rangs séquentiels, compteurs, niveau et remise à zéro ;
- navigation, clés locales et lignes Supabase indépendantes ;
- restauration locale et cloud après rechargement, migration des anciennes données Rogue ;
- lectures retardées, écritures concurrentes dans une page, panne et retour réseau ;
- affichage desktop/mobile et erreurs JavaScript ;
- migration SQL répétée, données Rogue préservées et upserts anonymes sur les deux slugs.

Les scénarios navigateur utilisent une API Supabase simulée et les tests SQL une base PostgreSQL locale en mémoire. Aucune progression réelle n'est modifiée par les tests. La validation complète sur le Supabase distant reste à effectuer après application du SQL.
