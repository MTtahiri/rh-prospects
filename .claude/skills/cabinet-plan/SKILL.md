---
name: cabinet-plan
description: >-
  Rassemble le travail des autres skills cabinet-* (concurrents, panel, prix,
  offre, chiffres du CFO) en un plan d'affaires du cabinet de recrutement, avec
  en tête un verdict calculé à partir des chiffres, jamais écrit à la main :
  Rentable, Pas encore (avec les chiffres qui échouent) ou Incomplet. Ajoute une
  synthèse et une version une page pour un associé, une banque ou Bpifrance.
  À utiliser pour « fais mon business plan », « assemble tout », « est-ce
  rentable », « synthèse pour la banque ».
argument-hint: "[--taux-min 0.25]"
---

# cabinet-plan

La dernière étape : un document sur lequel agir, ou à remettre à un associé
ou un financeur, construit uniquement à partir de ce que les autres skills ont trouvé.

## Étape 1 : le verdict, calculé

```bash
python3 "${CLAUDE_SKILL_DIR}/../cabinet-cfo/economie_cabinet.py" cabinet/chiffres.json --json
```

Contrôles, tous issus de chiffres :

1. Chaque flux a une contribution positive par unité (`alertes` ne contient
   aucune ligne « perd de l'argent »).
2. L'année 1 est positive après démarrage (`resultat_apres_demarrage` > 0).
3. Au mois 12, la contribution couvre les frais fixes.
4. Le besoin de trésorerie est couvert par l'apport disponible (demander le
   montant à l'utilisateur ; sans réponse, le contrôle est « inconnu »).
5. Si `cabinet/panel/resultats.json` existe : taux de signature ≥ 25 % (seuil
   modifiable avec `--taux-min`, dire pourquoi).

Verdict : **Rentable** si tout passe, **Pas encore** si un contrôle échoue (le
nommer avec son chiffre), **Incomplet** s'il n'y a pas de `chiffres.json`
(proposer `/cabinet-cfo`). Lister les sections manquantes et le skill qui
remplit chacune. Ne pas combler une section avec des suppositions.

## Étape 2 : la synthèse

`cabinet/synthese.md`, une demi-page :

- Ce qu'est le cabinet et pour qui, en deux phrases.
- Le verdict et les trois chiffres derrière (marge, seuil, année 1).
- Ce que le panel a montré (et ses limites) et le créneau concurrentiel.
- Le plus gros risque et ce qui sera fait.
- Ce qu'il faut pour démarrer ou grandir (trésorerie du CFO).
- La seule chose à faire cette semaine.

Si le verdict est Pas encore, la synthèse commence par ce qui doit changer et
quel skill le change. Ne jamais adoucir un contrôle qui échoue.

## Étape 3 : le plan complet

`cabinet/business-plan.md` : titre, verdict et contrôles, tableau des chiffres
clés, puis chaque section existante (synthèse, concurrents, panel, prix, offre,
chiffres), et ce qui n'est pas encore fait.

## Étape 4 : la page unique

`cabinet/une-page.md` pour quelqu'un qui décide en deux minutes : le problème,
le client, l'offre et le prix, le tableau des chiffres, les preuves (panel,
créneau, vrais résultats clients s'il y en a), à quoi sert l'argent, la
demande. Mêmes chiffres que le plan, au mot près.

## Règles

- Ne jamais écrire Rentable à la main, ne jamais arrondir un chiffre qui échoue en chiffre qui passe.
- Dire une fois clairement : le panel est simulé et les chiffres sont des
  projections. Pas un conseil financier, juridique ou fiscal.
- Ces fichiers sont confidentiels : ils restent dans `cabinet/`, qui n'est ni
  versionné ni déployé. Ne jamais les copier à la racine du site.

## Sortie

`cabinet/synthese.md`, `cabinet/business-plan.md`, `cabinet/une-page.md`.
Puis donner à l'utilisateur le verdict en une ligne et la chose à faire cette semaine.
