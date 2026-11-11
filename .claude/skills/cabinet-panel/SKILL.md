---
name: cabinet-panel
description: >-
  Panel d'acheteurs B2B simulés pour un cabinet de recrutement IT. Crée des
  sous-agents qui jouent chacun un décideur précis (DRH de PME, CTO de startup,
  acheteur grand compte avec référencement fournisseurs, manager d'ESN,
  dirigeant de PME pour l'audit IA…), leur montre la même proposition et
  recueille qui signerait, qui refuserait, pourquoi, ce qui ferait changer
  d'avis et quatre réponses de prix. Par défaut 20 acheteurs, --large pour 50.
  À utiliser pour « est-ce que des clients achèteraient », « teste mon offre »,
  « simule des prospects », « quelles objections », « valide la demande ».
argument-hint: "[--large] [offre à tester]"
---

# cabinet-panel

Au lieu de deviner si un client signera, on interroge des acheteurs simulés,
chacun joué par un sous-agent. Vous êtes le modérateur. **Vous ne répondez
jamais à la place d'un acheteur.**

Ce que l'utilisateur a tapé : `$ARGUMENTS`

## Étape 1 : le client cible

Écrire `cabinet/client-cible.json` :

- `cible` : qui achète, en une ligne précise.
- `segments` : 2 à 4 groupes avec une `part` (somme = 1) et une `taille`
  (effectif, budget recrutement annuel). Ex. startup tech 20–100 salariés,
  PME industrielle qui digitalise, ESN qui sous-traite, grand compte via achats.
- `comportements` : 4 à 6 façons d'acheter avec une `part` (passe par un
  référencement, travaille déjà avec 3 cabinets, recrute en interne d'abord,
  compare au TJM des plateformes…).
- `objections` : 4 à 8 doutes réels (« vos CV, je les ai déjà sur LinkedIn »,
  « 20 % c'est trop », « on a été déçus par un cabinet », « pas de budget avant
  le T2 »…).

S'appuyer sur ce qui est réel : ce que l'utilisateur sait de ses clients,
`cabinet/concurrents.md` s'il existe. Dire quelles parties sont supposées.
**Montrer le profil à l'utilisateur et le laisser corriger avant de lancer** :
un mauvais client cible fausse tout le panel.

## Étape 2 : la proposition

`cabinet/proposition.md` : ce qu'un acheteur verrait réellement. Le service,
le prix (taux d'honoraires, TJM ou forfait), le délai, la garantie. Trois à six
lignes, sans superlatif, rien que le cabinet ne puisse tenir.

## Étape 3 : distribuer les cartes et lancer

Tirer N cartes (20 par défaut, 50 avec `--large`) en respectant les parts des
segments et des comportements, chacune avec : un prénom, un poste, une
entreprise type (secteur, taille), un segment, un comportement, une objection
qui lui vient à l'esprit, un contexte (un recrutement urgent ? un échec
récent ?). Écrire les cartes dans `cabinet/panel/cartes.json` avec la graine
utilisée.

Pour chaque acheteur, un brief identique sauf la carte, dans
`cabinet/panel/briefs/<id>.md` :

> Tu es <carte>. Voici une proposition commerciale : <proposition mot pour mot>.
> Réponds comme cette personne le ferait vraiment. Ne sois pas complaisant :
> la plupart des décideurs refusent la plupart des sollicitations. N'invente
> pas de faits sur le cabinet. Écris uniquement ce JSON dans
> `cabinet/panel/reponses/<id>.json` :
> `{"id", "signe": true|false, "missions_6_mois": nombre, "raison_code":
> "prix|confiance|pas_de_besoin|deja_fournisseur|process_achat|delai|autre",
> "raison": "dans tes mots", "objection_principale", "ce_qui_ferait_changer",
> "prix": {"trop_bas", "bonne_affaire", "cher", "trop_cher"}}`
> (les prix dans l'unité de la proposition : % du salaire, €/jour ou € HT).

Lancer par vagues de 10 : UN message avec un appel Agent par acheteur
(`subagent_type: general-purpose`, `prompt: "Lis <chemin du brief> et suis-le
exactement."`). Attendre la vague entière avant la suivante. Ensuite, vérifier
que chaque fichier de réponse est un JSON valide ; relancer une fois les
manquants. Un acheteur qui échoue deux fois est exclu et compté comme tel.

Avant de lancer, dire à l'utilisateur combien d'appels de sous-agents cela
représente.

## Étape 4 : dépouiller

`cabinet/panel/resultats.md` et `resultats.json` (`{"n", "signent", "taux"}`
au minimum, lu par `/cabinet-plan`) :

1. Le titre : « 6 signent · 14 refusent », et le taux.
2. Qui signe et qui refuse : les segments et comportements qui diffèrent le plus.
3. Pourquoi ils refusent : les trois raisons principales, une citation chacune.
4. Ce qui ferait changer d'avis : les réponses les plus fréquentes.
5. Une phrase sur quoi changer avant d'investir, et quel skill le fait.

## Limites, à dire une fois

Ce sont des acheteurs simulés. Ils sont bons pour faire émerger des
objections et des formulations, mauvais pour prédire une conversion réelle :
les modèles de langage penchent vers l'accord, donc le taux est un plafond.
Confirmer avec de vrais prospects (appels, relances, un vrai devis envoyé)
avant de décider. **Ne jamais présenter une réponse du panel comme un
témoignage client**, ni sur le site ni en prospection.

## Sortie

`cabinet/client-cible.json`, `cabinet/proposition.md`, `cabinet/panel/`.
Ensuite : `/cabinet-pricing` lit les réponses de prix, `/cabinet-offre` les objections.
