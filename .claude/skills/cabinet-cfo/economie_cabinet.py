#!/usr/bin/env python3
"""Économie unitaire d'un cabinet de recrutement IT (placement, régie, forfaits).

Bibliothèque standard uniquement, aucun accès réseau.

    python3 economie_cabinet.py chiffres.json [--out cfo.md] [--json]
           [--volume 0.8] [--honoraires 0.18] [--marge-regie -50] [--delai-client 90]

Chaque chiffre du rapport vient d'un champ du JSON. Un champ manquant est une
erreur, jamais une supposition.
"""
import argparse
import copy
import json
import math
import sys

MOIS = 12


class Erreur(Exception):
    pass


def _somme(lignes, nom):
    if not isinstance(lignes, list):
        raise Erreur(f"'{nom}' doit être une liste de {{label, cost}}")
    total = 0.0
    for i, l in enumerate(lignes):
        if not isinstance(l, dict) or "label" not in l or "cost" not in l:
            raise Erreur(f"'{nom}'[{i}] doit avoir 'label' et 'cost'")
        if not isinstance(l["cost"], (int, float)) or l["cost"] < 0:
            raise Erreur(f"'{nom}'[{i}].cost doit être un nombre >= 0")
        total += l["cost"]
    return total


def _exige(d, champ, ou):
    if champ not in d:
        raise Erreur(f"champ manquant : {ou}.{champ}")
    return d[champ]


def _serie(d, champ, ou):
    s = _exige(d, champ, ou)
    if not isinstance(s, list) or len(s) != MOIS or not all(
        isinstance(x, (int, float)) and x >= 0 for x in s
    ):
        raise Erreur(f"{ou}.{champ} doit contenir {MOIS} nombres >= 0 (un par mois)")
    return [float(x) for x in s]


def _nombre(d, champ, ou, mini=0.0):
    v = _exige(d, champ, ou)
    if not isinstance(v, (int, float)) or v < mini:
        raise Erreur(f"{ou}.{champ} doit être un nombre >= {mini}")
    return float(v)


def analyser(data):
    """Retourne un dict de résultats. Lève Erreur si l'entrée est incomplète."""
    flux = _exige(data, "flux", "racine")
    if not isinstance(flux, dict) or not flux:
        raise Erreur("'flux' doit contenir au moins un de : placement, regie, forfaits")
    inconnus = set(flux) - {"placement", "regie", "forfaits"}
    if inconnus:
        raise Erreur(f"flux inconnus : {', '.join(sorted(inconnus))}")

    fixes = _somme(_exige(data, "fixes_mensuels", "racine"), "fixes_mensuels")
    demarrage = _somme(_exige(data, "demarrage", "racine"), "demarrage")
    delai_client = _nombre(data, "delai_paiement_client_jours", "racine")
    decal_client = int(math.ceil(delai_client / 30.0))

    unites = []  # une entrée par flux : prix, coûts, contribution, volume mensuel
    ca = [0.0] * MOIS
    contrib = [0.0] * MOIS
    # encaissements et décaissements variables, avant décalage
    enc_brut = [0.0] * MOIS
    dec_var = [0.0] * (MOIS + 12)

    p = flux.get("placement")
    if p is not None:
        ou = "flux.placement"
        salaire = _nombre(p, "salaire_annuel_moyen", ou)
        taux = _nombre(p, "taux_honoraires", ou)
        if taux > 1:
            raise Erreur(f"{ou}.taux_honoraires est une fraction (0.20 = 20 %)")
        var = _somme(_exige(p, "couts_variables", ou), ou + ".couts_variables")
        t_rempl = _nombre(p, "taux_remplacement_garantie", ou)
        c_rempl = _nombre(p, "cout_remplacement", ou)
        vol = _serie(p, "placements_par_mois", ou)
        prix = salaire * taux
        garantie = t_rempl * c_rempl
        c = prix - var - garantie
        unites.append({
            "flux": "placement", "unite": "placement", "prix": prix,
            "couts": [("Coûts variables (sourcing, jobboards, commissions)", var),
                      ("Garantie de remplacement (coût attendu)", garantie)],
            "contribution": c, "volume": vol,
        })
        for m in range(MOIS):
            ca[m] += prix * vol[m]
            contrib[m] += c * vol[m]
            enc_brut[m] += prix * vol[m]
            dec_var[m] += (var + garantie) * vol[m]

    r = flux.get("regie")
    if r is not None:
        ou = "flux.regie"
        tjm_v = _nombre(r, "tjm_vente", ou)
        tjm_a = _nombre(r, "tjm_achat", ou)
        jours = _nombre(r, "jours_factures_par_mois", ou)
        var_j = _somme(_exige(r, "couts_variables_par_jour", ou), ou + ".couts_variables_par_jour")
        delai_f = _nombre(r, "delai_paiement_freelance_jours", ou)
        decal_f = int(math.ceil(delai_f / 30.0))
        vol = _serie(r, "consultants_actifs", ou)
        prix = tjm_v * jours
        achat = tjm_a * jours
        autres = var_j * jours
        c = prix - achat - autres
        unites.append({
            "flux": "regie", "unite": "consultant-mois", "prix": prix,
            "couts": [("Achat consultant (TJM achat × jours)", achat),
                      ("Autres coûts par jour × jours", autres)],
            "contribution": c, "volume": vol,
            "detail": {"tjm_vente": tjm_v, "tjm_achat": tjm_a, "jours": jours,
                       "marge_jour": tjm_v - tjm_a - var_j},
        })
        for m in range(MOIS):
            ca[m] += prix * vol[m]
            contrib[m] += c * vol[m]
            enc_brut[m] += prix * vol[m]
            dec_var[m + decal_f] += achat * vol[m]
            dec_var[m] += autres * vol[m]

    for i, f in enumerate(flux.get("forfaits") or []):
        ou = f"flux.forfaits[{i}]"
        label = _exige(f, "label", ou)
        prix = _nombre(f, "prix", ou)
        var = _somme(_exige(f, "couts_variables", ou), ou + ".couts_variables")
        vol = _serie(f, "ventes_par_mois", ou)
        c = prix - var
        unites.append({
            "flux": f"forfait : {label}", "unite": "vente", "prix": prix,
            "couts": [("Coûts variables", var)], "contribution": c, "volume": vol,
        })
        for m in range(MOIS):
            ca[m] += prix * vol[m]
            contrib[m] += c * vol[m]
            enc_brut[m] += prix * vol[m]
            dec_var[m] += var * vol[m]

    resultat = [contrib[m] - fixes for m in range(MOIS)]

    # Trésorerie : le démarrage sort au mois 0, les clients paient avec décalage.
    treso = -demarrage
    treso_min = treso
    mois_min = 0
    courbe = []
    for m in range(MOIS):
        enc = enc_brut[m - decal_client] if m - decal_client >= 0 else 0.0
        treso += enc - dec_var[m] - fixes
        courbe.append(treso)
        if treso < treso_min:
            treso_min, mois_min = treso, m + 1

    cumul = -demarrage
    payback = None
    for m in range(MOIS):
        cumul += resultat[m]
        if payback is None and cumul >= 0:
            payback = m + 1

    seuils = {}
    for u in unites:
        if u["contribution"] > 0:
            seuils[u["flux"]] = fixes / u["contribution"]
        else:
            seuils[u["flux"]] = None

    alertes = []
    for u in unites:
        if u["contribution"] <= 0:
            alertes.append(f"{u['flux']} : chaque {u['unite']} perd de l'argent "
                           f"({u['contribution']:.0f} €)")
    if contrib[-1] < fixes:
        alertes.append("Au mois 12, la contribution ne couvre pas les frais fixes")
    if sum(resultat) - demarrage < 0:
        alertes.append("L'année 1 est en perte après le démarrage")
    if payback is None:
        alertes.append("Le démarrage n'est pas remboursé dans l'année")
    if treso_min < 0:
        alertes.append(f"Besoin de trésorerie : {-treso_min:,.0f} € (au mois {mois_min})"
                       .replace(",", " "))

    return {
        "cabinet": data.get("cabinet", ""),
        "unites": unites, "fixes": fixes, "demarrage": demarrage,
        "ca": ca, "contribution": contrib, "resultat": resultat,
        "ca_annee": sum(ca), "resultat_annee": sum(resultat),
        "resultat_apres_demarrage": sum(resultat) - demarrage,
        "marge_mois12": (resultat[-1] / ca[-1]) if ca[-1] else None,
        "treso": courbe, "besoin_tresorerie": max(0.0, -treso_min),
        "mois_besoin": mois_min, "payback_mois": payback,
        "seuils": seuils, "alertes": alertes,
        "decalage_client_mois": decal_client,
    }


def appliquer(data, volume=None, honoraires=None, marge_regie=None, delai_client=None):
    d = copy.deepcopy(data)
    f = d.get("flux", {})
    if volume is not None:
        if "placement" in f:
            f["placement"]["placements_par_mois"] = [x * volume for x in f["placement"]["placements_par_mois"]]
        if "regie" in f:
            f["regie"]["consultants_actifs"] = [x * volume for x in f["regie"]["consultants_actifs"]]
        for fo in f.get("forfaits") or []:
            fo["ventes_par_mois"] = [x * volume for x in fo["ventes_par_mois"]]
    if honoraires is not None and "placement" in f:
        f["placement"]["taux_honoraires"] = honoraires
    if marge_regie is not None and "regie" in f:
        f["regie"]["tjm_vente"] = f["regie"]["tjm_vente"] + marge_regie
    if delai_client is not None:
        d["delai_paiement_client_jours"] = delai_client
    return d


def _e(x):
    return f"{x:,.0f} €".replace(",", " ")


def rapport(data, res):
    L = []
    titre = res["cabinet"] or "Cabinet"
    L.append(f"# Économie unitaire : {titre}\n")
    L.append("> Projection à partir des chiffres saisis. Ce n'est pas un conseil "
             "financier, fiscal ou juridique : faites valider par un expert-comptable.\n")
    L.append("## Par unité vendue\n")
    L.append("| flux | unité | prix HT | coûts directs | contribution |")
    L.append("| --- | --- | ---: | ---: | ---: |")
    for u in res["unites"]:
        couts = sum(c for _, c in u["couts"])
        L.append(f"| {u['flux']} | {u['unite']} | {_e(u['prix'])} | {_e(couts)} | {_e(u['contribution'])} |")
    for u in res["unites"]:
        if "detail" in u:
            d = u["detail"]
            L.append(f"\nRégie : marge par jour facturé = {_e(d['marge_jour'])} "
                     f"(TJM vente {_e(d['tjm_vente'])}, achat {_e(d['tjm_achat'])}, "
                     f"{d['jours']:.0f} j/mois).")
    L.append(f"\n## Frais fixes : {_e(res['fixes'])} / mois · démarrage : {_e(res['demarrage'])}\n")
    L.append("Seuil de rentabilité si un seul flux devait couvrir tous les frais fixes :\n")
    for k, v in res["seuils"].items():
        u = next(x for x in res["unites"] if x["flux"] == k)
        L.append(f"- {k} : " + ("jamais (contribution ≤ 0)" if v is None
                                 else f"{v:.1f} × {u['unite']} par mois"))
    L.append("\n## Année 1, mois par mois\n")
    L.append("| mois | CA HT | contribution | résultat | trésorerie fin de mois |")
    L.append("| ---: | ---: | ---: | ---: | ---: |")
    for m in range(MOIS):
        L.append(f"| {m+1} | {_e(res['ca'][m])} | {_e(res['contribution'][m])} | "
                 f"{_e(res['resultat'][m])} | {_e(res['treso'][m])} |")
    L.append("")
    L.append(f"- CA année 1 : **{_e(res['ca_annee'])}**")
    L.append(f"- Résultat d'exploitation année 1 : **{_e(res['resultat_annee'])}**")
    L.append(f"- Après le démarrage : **{_e(res['resultat_apres_demarrage'])}**")
    if res["marge_mois12"] is not None:
        L.append(f"- Marge au mois 12 : **{res['marge_mois12']*100:.1f} %**")
    L.append(f"- Besoin de trésorerie (clients payés à {res['decalage_client_mois']} mois) : "
             f"**{_e(res['besoin_tresorerie'])}**")
    L.append("- Démarrage remboursé : " + (f"**mois {res['payback_mois']}**" if res["payback_mois"]
                                          else "**pas dans l'année**"))
    L.append("\n## Et si…\n")
    L.append("| scénario | résultat année 1 après démarrage | besoin de trésorerie |")
    L.append("| --- | ---: | ---: |")
    scen = [("Plan", {})]
    scen.append(("Volume −20 %", {"volume": 0.8}))
    p = data["flux"].get("placement")
    if p:
        scen.append((f"Honoraires {p['taux_honoraires']*100:.0f} % → {p['taux_honoraires']*80:.0f} %",
                     {"honoraires": p["taux_honoraires"] * 0.8}))
    if "regie" in data["flux"]:
        scen.append(("TJM vente −50 €/j", {"marge_regie": -50}))
    scen.append(("Clients payés 30 j plus tard",
                 {"delai_client": data["delai_paiement_client_jours"] + 30}))
    for nom, kw in scen:
        r2 = analyser(appliquer(data, **kw)) if kw else res
        L.append(f"| {nom} | {_e(r2['resultat_apres_demarrage'])} | {_e(r2['besoin_tresorerie'])} |")
    L.append("\n## Alertes\n")
    L.extend([f"- ⚠ {a}" for a in res["alertes"]] or ["- Aucune."])
    return "\n".join(L) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("fichier")
    ap.add_argument("--out")
    ap.add_argument("--json", action="store_true", help="résultats bruts en JSON")
    ap.add_argument("--volume", type=float, help="multiplie tous les volumes (0.8 = −20 %%)")
    ap.add_argument("--honoraires", type=float, help="taux d'honoraires placement (0.18)")
    ap.add_argument("--marge-regie", type=float, help="ajoute X €/j au TJM de vente")
    ap.add_argument("--delai-client", type=float, help="délai de paiement client en jours")
    a = ap.parse_args(argv)
    try:
        with open(a.fichier, encoding="utf-8") as fh:
            data = json.load(fh)
        data = appliquer(data, a.volume, a.honoraires, a.marge_regie, a.delai_client)
        res = analyser(data)
    except (Erreur, json.JSONDecodeError, OSError, KeyError, TypeError) as e:
        print(f"erreur : {e}", file=sys.stderr)
        return 2
    if a.json:
        sortie = json.dumps({k: v for k, v in res.items() if k != "unites"}, ensure_ascii=False, indent=2)
    else:
        sortie = rapport(data, res)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(sortie)
        print(f"écrit : {a.out}")
    else:
        print(sortie)
    return 0


if __name__ == "__main__":
    sys.exit(main())
