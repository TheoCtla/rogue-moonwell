# Rogue Moonwell PvP Tracker

Une page autonome `index.html` pour suivre les talents du Rogue TBC 2.4.3 (20/0/41), niveaux 10 à 70.

## Utiliser sans serveur
Ouvrir `index.html` dans un navigateur. Les changements sont stockés via `localStorage` sur cet appareil. Sauvegarde locale seulement. Pour éviter les restrictions de stockage des URLs `file://`, l'hébergement est recommandé.

## Mettre en ligne
1. Créer un dépôt GitHub public, déposer `index.html` à la racine.
2. Dans Settings > Pages, choisir Deploy from a branch, branche `main`, dossier `/ (root)`.
3. Ouvrir l'URL GitHub Pages. Le tableau de bord fonctionne déjà en local.
4. Créer un projet Supabase gratuit. Dans SQL Editor, exécuter `supabase.sql`.
5. Dans Supabase > Authentication > URL Configuration, ajouter l'URL GitHub Pages aux Redirect URLs. Activer la connexion par email OTP (magic link) et vérifier le contenu du template pour obtenir un lien de connexion (non un code à six chiffres).
6. Depuis le site, renseigner **Project URL**, **publishable/anon key** (jamais la clé secrète) et un slug public.
7. Enregistrer la configuration. Entrer son email et cliquer « Recevoir un lien de connexion ». Cliquer sur le lien reçu, puis « Synchroniser mes modifications ».
8. Dans le futur, cliquer sur « Lire en ligne » pour récupérer le dernier état depuis Supabase.

## Point important pour ChatGPT
La page publique seule ne suffit pas à lire un `localStorage` ou les données Supabase rendues uniquement dans le navigateur. En revanche la table possède une **API REST de lecture publique** :

`https://<PROJET>.supabase.co/rest/v1/rogue_progress?slug=eq.<IDENTIFIANT>&select=slug,level,checked,updated_at`

L'API nécessite en général le header `apikey` public; une requête web standard depuis ChatGPT peut donc ne pas y accéder directement. Pour rendre l'état facilement consultable par ChatGPT depuis une simple URL, publier un endpoint JSON accessible sans header (par exemple une fonction proxy Cloudflare Worker à lecture seule, limitée au slug et aux champs non sensibles), ou afficher l'état sur une page HTML rendue côté serveur, à condition qu'elle soit indexable/lisible via les outils web. Ne pas exposer de secrets. Ne pas partager d'email dans la table publique.

## Protection
La clé Supabase `anon` est publique par conception. La sécurité des modifications repose sur les politiques RLS et l'identité Supabase Auth. La table est publiquement lisible : n'inscrire aucun renseignement privé dans le slug ou les données publiées.

## Sources du build
- https://www.icy-veins.com/tbc-classic/subtlety-rogue-pvp-guide
- https://www.warcrafttavern.com/tbc/guides/rogue-shadowstep-pvp/
