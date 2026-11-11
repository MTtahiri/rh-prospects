---
name: cabinet-cfo
description: >-
  Le directeur financier du cabinet de recrutement. Calcule l'économie unitaire
  de chaque flux de revenu (placement CDI au % du salaire, régie freelance à la
  marge sur TJM, forfaits comme l'audit IA) : contribution par placement, par
  consultant-mois et par vente, seuil de rentabilité, année 1 mois par mois,
  besoin de trésorerie avec les délais de paiement clients et freelances, mois
  de remboursement du démarrage, et scénarios (volume −20 %, honoraires plus
  bas, TJM vente −50 €/j, clients payés plus tard). Chaque chiffre vient d'une
  saisie vérifiable. À utiliser quand l'utilisateur dit « mes marges »,
  « est-ce rentable », « combien de placements pour être rentable », « marge
  régie », « besoin de trésorerie », « fais les chiffres », « BFR ».
argument-hint: "[chemin vers cabinet/chiffres.json]"
---

# cabinet-cfo

Celui qui demande « et combien ça coûte ? ». Les marges décident si une bonne
activité est une entreprise. Tous les fichiers de travail vont dans `cabinet/`
à la racine du projet (ignoré par git et par Vercel : il contient des chiffres
confidentiels).

L'outil, dans ce dossier :

```bash
python3 "${CLAUDE_SKILL_DIR}/economie_cabinet.py" cabinet/chiffres.json --out cabinet/cfo.md
```

## Étape 1 : rassembler les chiffres

Écrire `cabinet/chiffres.json` sur le modèle de `exemple.json` (fictif). Un ou
plusieurs flux :

| flux | champs |
| --- | --- |
| `placement` | `salaire_annuel_moyen`, `taux_honoraires` (fraction : 0.20 = 20 %), `couts_variables` (sourcing, jobboards, commission recruteur), `taux_remplacement_garantie` (part des placements qui partent pendant la garantie), `cout_remplacement`, `placements_par_mois` (12 valeurs) |
| `regie` | `tjm_vente`, `tjm_achat`, `jours_factures_par_mois`, `couts_variables_par_jour`, `delai_paiement_freelance_jours`, `consultants_actifs` (12 valeurs) |
| `forfaits` | liste de `{label, prix, couts_variables, ventes_par_mois}` (audit IA, missions au forfait) |

Plus : `fixes_mensuels`, `demarrage`, `delai_paiement_client_jours`.

Les sources, dans cet ordre :

1. Les chiffres de l'utilisateur : contrats clients, factures, devis, contrats freelances, abonnements.
2. Des prix publics vérifiables (tarif d'un jobboard, d'un ATS). Noter la source à côté du chiffre dans `cabinet/cfo-sources.md`.
3. Une estimation, **marquée comme telle**, avec le raisonnement. Jamais présentée comme un fait.

Demander à l'utilisateur ce que lui seul sait : taux d'honoraires réellement
signés, TJM d'achat, délais de paiement réels de ses clients (les grands
comptes et les ESN paient souvent tard : c'est le chiffre qui fait le besoin
de trésorerie en régie).

**La montée en charge est l'endroit où les plans mentent.** Les premiers
placements arrivent rarement le premier mois. Si `cabinet/panel/resultats.md`
existe, s'en servir pour vérifier la montée en charge et dire comment.

## Étape 2 : lancer l'outil

```bash
python3 "${CLAUDE_SKILL_DIR}/economie_cabinet.py" cabinet/chiffres.json --out cabinet/cfo.md
```

Scénarios sans modifier le fichier :

```bash
python3 "${CLAUDE_SKILL_DIR}/economie_cabinet.py" cabinet/chiffres.json --honoraires 0.18
python3 "${CLAUDE_SKILL_DIR}/economie_cabinet.py" cabinet/chiffres.json --volume 0.8
python3 "${CLAUDE_SKILL_DIR}/economie_cabinet.py" cabinet/chiffres.json --marge-regie 30
python3 "${CLAUDE_SKILL_DIR}/economie_cabinet.py" cabinet/chiffres.json --delai-client 90
```

`--json` sort les résultats bruts (utilisé par `/cabinet-plan`).

## Étape 3 : la note du CFO

En tête de `cabinet/cfo.md`, en mots simples :

- **La marge** : contribution par placement, par consultant-mois, par forfait, et la marge au mois 12.
- **Le flux qui porte le cabinet** et celui qui consomme de la trésorerie (souvent la régie : on paie le freelance avant d'être payé par le client).
- **La ligne à surveiller** : l'hypothèse qui bouge le plus le résultat, avec le scénario qui le prouve.
- **Trésorerie** : combien il faut avoir avant que l'activité s'autofinance.
- **Trois leviers**, chacun avec le chiffre qu'il change, mesuré avec un scénario de l'outil (pas estimé).

## Règles

- Chaque chiffre de la note vient de la sortie de l'outil ou d'une saisie nommée.
- Montants HT. La TVA (20 %) s'ajoute à la facture, pas au chiffre d'affaires.
- Pas un conseil financier, fiscal ou juridique : le dire une fois, et
  recommander un expert-comptable pour la structure, les charges sociales et
  la fiscalité.
- L'outil ne calcule ni l'IS ni les charges sociales du dirigeant : les mettre
  dans `fixes_mensuels` si on veut les voir.

## Sortie

`cabinet/chiffres.json`, `cabinet/cfo.md`, `cabinet/cfo-sources.md`. Ensuite :
`/cabinet-pricing` si la marge est mince, `/cabinet-plan` pour le verdict.
