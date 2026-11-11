---
name: cabinet-offre
description: >-
  Construit l'offre commerciale d'un cabinet de recrutement IT pour qu'elle
  soit difficile à refuser : liste chaque obstacle du client entre « j'ai un
  poste à pourvoir » et « la bonne personne est en poste et reste », transforme
  chacun en solution (délai de shortlist, garantie de remplacement, process,
  reporting…), garde ce qui coûte peu et vaut beaucoup, chiffre la garantie
  avec cabinet-cfo, puis re-teste l'offre sur le panel. À utiliser pour
  « améliore mon offre », « pourquoi les clients ne signent pas », « quelle
  garantie proposer », « que mettre dans ma proposition commerciale ».
argument-hint: "[le service à travailler : placement, régie, audit IA]"
---

# cabinet-offre

Beaucoup de cabinets vendent « des CV ». Les bons vendent une offre : le
service plus tout ce qui rend la signature facile. Méthode : l'équation de
valeur (résultat espéré, probabilité perçue de l'obtenir, délai, effort
demandé au client) et l'empilement d'une offre (inspirés du cadre publié par
Alex Hormozi dans *$100M Offers* ; ne jamais le présenter comme ses propos).

## Étape 1 : lire ce qui existe

- Le site : `index.html`, `expertise-recrutement-it-paris.html`, les pages
  `recrutement-*.html`, `audit-ia-subventionne.html` : ce qui est déjà promis
  (délai 72 h, garantie de remplacement…). **Vérifier que chaque promesse
  existante est tenable** avant d'en ajouter.
- `cabinet/panel/resultats.md` : pourquoi les acheteurs refusent, dans leurs mots.
- `cabinet/chiffres.json` : ce que coûte chaque ajout.
- `cabinet/concurrents.md` : ce que les autres promettent déjà.

## Étape 2 : la liste des obstacles

Tous les obstacles du client, dans ses mots : avant (doute sur la qualité,
prix, « encore un cabinet »), pendant (CV hors sujet, lenteur, relances,
candidats qui ne répondent pas), après (le candidat part pendant la période
d'essai, la mission freelance s'arrête). Viser 15 à 30, en partant des
objections du panel et des reproches faits aux concurrents.

## Étape 3 : solutions, tri, empilement

Une solution par obstacle. Noter chacune sur la valeur pour le client (1 à 5)
et le coût pour le cabinet (1 à 5, avec les chiffres du CFO). Garder valeur
haute, coût bas. Empiler :

- **Le cœur** : décrit par le résultat (« un Data Engineer en poste en
  6 semaines »), pas par les moyens.
- **Deux ou trois bonus**, chacun tuant une objection précise.
- **La garantie** : ce qui se passe si ça ne marche pas. La chiffrer avant de
  la promettre : changer `taux_remplacement_garantie` et `cout_remplacement`
  dans une copie de `chiffres.json` et relancer `/cabinet-cfo`.
- **Urgence** : seulement si elle est vraie. Jamais de faux compte à rebours.
- **Un nom** pour l'offre, clair et précis.

## Étape 4 : noter

Équation de valeur avant / après, de 1 à 10 sur chacun des quatre termes.
Dire quel élément de l'offre fait bouger quelle note.

## Étape 5 : re-tester

Écrire la nouvelle offre dans `cabinet/proposition.md` (garder l'ancienne en
`proposition-v1.md`), relancer `/cabinet-panel` avec la même graine. Donner le
taux avant / après et les objections qui ont disparu. Si rien ne bouge, le
dire : le problème est peut-être la cible ou le prix, pas l'offre.

## Règles

- Chaque promesse doit être tenable et finançable : vérifier avec le CFO.
- Pas de faux avis, faux témoignages, fausse rareté, faux logos clients, ni
  mention d'agrément ou de label non confirmé (cf. l'historique du site sur
  les mentions Bpifrance).
- Respecter le droit applicable aux prestations de recrutement et à la
  non-discrimination dans les annonces. Ce n'est pas un conseil juridique.

## Sortie

`cabinet/offre.md` (obstacles, empilement, coûts, notes, résultat du re-test)
et `cabinet/proposition.md` mis à jour. Ensuite : `/cabinet-cfo` pour recalculer,
puis `/cabinet-plan`.
