---
name: cabinet-pricing
description: >-
  Fixe les prix d'un cabinet de recrutement IT : taux d'honoraires sur
  placement CDI, TJM de vente et marge en régie, prix des forfaits (audit IA).
  Croise trois sources vérifiables : ce que disent les acheteurs (panel simulé
  ou, mieux, vrais prospects), ce que facturent les concurrents quand c'est
  publié, et ce dont le cabinet a besoin (marge et seuil calculés par
  cabinet-cfo). Recommande un prix, une échelle d'offres et ce qu'il faut
  tester. À utiliser pour « combien facturer », « mon taux d'honoraires »,
  « quel TJM », « 20 % c'est trop ? », « stratégie de prix ».
argument-hint: "[prix actuel, ex. 20% ou 650€/j]"
---

# cabinet-pricing

Le prix est le levier le plus rapide sur la marge et celui que l'on devine le
plus. Ce skill le fixe à partir de trois choses vérifiables.

## Étape 1 : ce que disent les acheteurs

Si `/cabinet-panel` a tourné, chaque acheteur a donné quatre prix (trop bas,
bonne affaire, cher, trop cher). Méthode de Van Westendorp : pour chaque prix
candidat, calculer la part d'acheteurs qui le trouvent trop bas, bonne
affaire, cher, trop cher, puis lire :

| point | sens |
| --- | --- |
| PMC (« trop bas » croise « pas une bonne affaire ») | en dessous, le prix inquiète sur la qualité |
| OPP (« trop bas » croise « trop cher ») | le prix qui rencontre le moins de résistance |
| PME (« bonne affaire » croise « trop cher ») | au-dessus, trop d'acheteurs refusent |

Faire le calcul avec un court script Python lisant `cabinet/panel/reponses/*.json`,
et montrer le tableau. De vraies réponses de prospects (CSV) valent toujours
mieux que des réponses simulées. Si aucun panel n'existe, le dire et proposer
`/cabinet-panel` ; **ne pas inventer de fourchette**.

## Étape 2 : ce que facturent les concurrents

Depuis `cabinet/concurrents.md`, ou en cherchant maintenant leurs pages
publiques, avec liens. Les taux d'honoraires des cabinets sont rarement
publiés : ne citer que ce qui a une source. Comparer à périmètre égal
(garantie incluse ? exclusivité ? acompte ?). Pour la régie, les TJM
indicatifs déjà publiés sur `index.html` servent de repère interne, pas de
preuve de marché.

## Étape 3 : ce dont le cabinet a besoin

Avec `cabinet/chiffres.json`, tester deux ou trois prix candidats :

```bash
python3 "${CLAUDE_SKILL_DIR}/../cabinet-cfo/economie_cabinet.py" cabinet/chiffres.json --honoraires 0.18
python3 "${CLAUDE_SKILL_DIR}/../cabinet-cfo/economie_cabinet.py" cabinet/chiffres.json --marge-regie 40
```

## Étape 4 : décider

`cabinet/pricing.md` :

1. **Le prix** de chaque flux, et pourquoi : place dans la fourchette, face aux
   concurrents, marge obtenue (sortie de l'outil, pas une estimation).
2. **L'échelle**, si elle a du sens : par ex. recherche simple / recherche
   avec exclusivité et shortlist garantie / recherche par approche directe.
   Une raison claire de monter d'un cran.
3. **L'offre d'ouverture** pour un nouveau client (première mission, garantie
   allongée…) avec une date de fin, sans habituer les clients à attendre une remise.
4. **Quoi tester avec de vrais prospects** : deux prix dans la fourchette et comment.
5. Les trois objections de prix du panel, mot pour mot, pour `/cabinet-offre`.

## Règles

- Les prix du panel simulé choisissent quoi tester. Ce ne sont pas des preuves.
- Ne jamais descendre sous le coût variable sans le dire et sans dire combien
  de temps le cabinet peut se le permettre (selon `/cabinet-cfo`).
- Pas de faux prix barrés, pas de « tarif habituel » jamais pratiqué.

## Sortie

`cabinet/pricing.md`. Si un prix change, mettre à jour `cabinet/chiffres.json`
et relancer `/cabinet-cfo`. Ensuite : `/cabinet-offre`.
