---
name: cabinet-concurrents
description: >-
  Cartographie les concurrents d'un cabinet de recrutement IT : cabinets
  généralistes et spécialisés, ESN qui placent en régie, plateformes freelance,
  sociétés de portage, et les solutions de substitution (recrutement interne,
  cooptation, LinkedIn en direct). Relève, à partir de sources publiques
  uniquement, ce qu'ils proposent, leur positionnement, leurs tarifs quand ils
  sont publiés et ce que leurs clients et candidats leur reprochent, chaque fait
  avec un lien. Termine par une carte de positionnement et le créneau à prendre.
  À utiliser pour « mes concurrents », « analyse concurrentielle », « qui fait
  la même chose », « comment me différencier », « le marché est-il saturé ».
argument-hint: "[spécialité ou ville, ex. data Paris]"
---

# cabinet-concurrents

Chaque client a déjà une façon de recruter. Ce skill trouve laquelle, ce qu'il
paie et ce qui l'agace, pour que le cabinet parte d'un créneau et non d'une
intuition.

## Les règles

- **Sources publiques uniquement, chaque fait avec un lien** : sites, pages
  tarifs, offres publiées, avis Google, Trustpilot, Glassdoor, Indeed, Reddit,
  presse. Si une source est inaccessible, le dire. **Ne jamais inventer** un
  concurrent, un tarif, une note ou un avis.
- **Lire, pas aspirer.** Lire les pages comme une personne, respecter les
  conditions des sites.
- **Les tarifs des cabinets sont rarement publics.** Ne pas écrire de taux
  d'honoraires « du marché » sans source ; si on n'en a pas, marquer « non
  publié ».
- Citations verbatim, courtes, avec le lien. C'est de la recherche, jamais des témoignages.

## Étape 1 : qui est là

| type | définition | exemples à chercher |
| --- | --- | --- |
| Direct | cabinet qui recrute les mêmes profils pour les mêmes clients | cabinets IT/data, même ville |
| Indirect | autre modèle pour le même besoin | ESN en régie, plateformes freelance, portage |
| Substitut | le client le fait sans prestataire | recruteur interne, cooptation, LinkedIn Recruiter, jobboards |

Viser 5 à 10 directs et indirects. Chercher comme un client : « cabinet
recrutement data scientist Paris », « recrutement freelance DevOps ».

## Étape 2 : les faits

Une ligne par concurrent dans `cabinet/concurrents.csv` :

`nom,type,url,specialites,modeles (CDI/freelance/portage),tarif_publie,promesse (leur accroche copiée),garantie,note,nb_avis,date_source`

## Étape 3 : ce que disent clients et candidats

Pour les 3 à 5 principaux : avis 1 à 3 étoiles d'abord, puis les 4 étoiles
« bien, mais… ». Côté candidats aussi (un cabinet mal noté par les candidats
source mal). Regrouper en thèmes avec un décompte et une ou deux citations
liées. Un thème avec moins de trois avis est marqué « faible ».

## Étape 4 : la carte et le créneau

`cabinet/concurrents.md` :

1. Le tableau, trié par proximité.
2. Une carte de positionnement en texte, sur deux axes qui comptent pour le
   client (spécialisation / généraliste, rapidité / profondeur de sélection…).
3. Les reproches, classés, avec liens.
4. **Le créneau** : ce que personne ne fait bien et que le cabinet peut tenir,
   relié aux preuves. S'il n'y en a pas, le dire clairement.
5. La menace : qui peut copier le plus vite, et comment.
6. Ce que le site actuel (`index.html`, pages `recrutement-*.html`) promet déjà
   et si c'est différenciant face aux concurrents trouvés.

## Sortie

`cabinet/concurrents.csv`, `cabinet/concurrents.md`. Ensuite : `/cabinet-panel`
s'en sert pour écrire des objections réalistes, `/cabinet-pricing` pour les tarifs.
