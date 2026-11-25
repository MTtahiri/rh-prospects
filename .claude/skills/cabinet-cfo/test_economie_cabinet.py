"""Tests : python3 -m unittest discover -s .claude/skills/cabinet-cfo -p 'test_*.py'"""
import copy
import json
import os
import sys
import unittest

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import economie_cabinet as ec  # noqa: E402

with open(os.path.join(ICI, "exemple.json"), encoding="utf-8") as fh:
    EXEMPLE = json.load(fh)


def minimal():
    return {
        "delai_paiement_client_jours": 0,
        "flux": {"placement": {
            "salaire_annuel_moyen": 50000, "taux_honoraires": 0.2,
            "couts_variables": [{"label": "x", "cost": 1000}],
            "taux_remplacement_garantie": 0.1, "cout_remplacement": 2000,
            "placements_par_mois": [1] * 12}},
        "fixes_mensuels": [{"label": "f", "cost": 4000}],
        "demarrage": [{"label": "d", "cost": 6000}],
    }


class Calculs(unittest.TestCase):
    def test_contribution_placement(self):
        r = ec.analyser(minimal())
        # 50000*0.2 - 1000 - 0.1*2000 = 8800
        self.assertAlmostEqual(r["unites"][0]["contribution"], 8800)
        self.assertAlmostEqual(r["resultat"][0], 4800)
        self.assertAlmostEqual(r["resultat_apres_demarrage"], 4800 * 12 - 6000)
        self.assertEqual(r["payback_mois"], 2)
        self.assertAlmostEqual(r["seuils"]["placement"], 4000 / 8800)

    def test_regie_et_decalage_tresorerie(self):
        d = minimal()
        d["flux"] = {"regie": {
            "tjm_vente": 600, "tjm_achat": 500, "jours_factures_par_mois": 20,
            "couts_variables_par_jour": [], "delai_paiement_freelance_jours": 30,
            "consultants_actifs": [1] * 12}}
        d["fixes_mensuels"] = []
        d["demarrage"] = []
        d["delai_paiement_client_jours"] = 60
        r = ec.analyser(d)
        self.assertAlmostEqual(r["unites"][0]["contribution"], 2000)
        # mois 1 : rien encaissé, rien payé ; mois 2 : freelance payé 10000, rien encaissé
        self.assertAlmostEqual(r["treso"][0], 0)
        self.assertAlmostEqual(r["treso"][1], -10000)
        self.assertAlmostEqual(r["besoin_tresorerie"], 10000)

    def test_scenarios(self):
        base = ec.analyser(minimal())
        bas = ec.analyser(ec.appliquer(minimal(), volume=0.8))
        self.assertLess(bas["resultat_annee"], base["resultat_annee"])
        h = ec.analyser(ec.appliquer(minimal(), honoraires=0.15))
        self.assertAlmostEqual(h["unites"][0]["contribution"], 7500 - 1000 - 200)

    def test_alerte_perte_unitaire(self):
        d = minimal()
        d["flux"]["placement"]["taux_honoraires"] = 0.01
        r = ec.analyser(d)
        self.assertTrue(any("perd de l'argent" in a for a in r["alertes"]))
        self.assertIsNone(r["seuils"]["placement"])

    def test_exemple_tourne(self):
        r = ec.analyser(copy.deepcopy(EXEMPLE))
        self.assertEqual(len(r["unites"]), 3)
        self.assertIn("Année 1", ec.rapport(EXEMPLE, r))


class Validation(unittest.TestCase):
    def test_champ_manquant(self):
        d = minimal()
        del d["flux"]["placement"]["cout_remplacement"]
        with self.assertRaises(ec.Erreur):
            ec.analyser(d)

    def test_serie_incomplete(self):
        d = minimal()
        d["flux"]["placement"]["placements_par_mois"] = [1] * 11
        with self.assertRaises(ec.Erreur):
            ec.analyser(d)

    def test_taux_en_pourcent(self):
        d = minimal()
        d["flux"]["placement"]["taux_honoraires"] = 20
        with self.assertRaises(ec.Erreur):
            ec.analyser(d)

    def test_flux_inconnu(self):
        d = minimal()
        d["flux"]["portage"] = {}
        with self.assertRaises(ec.Erreur):
            ec.analyser(d)


if __name__ == "__main__":
    unittest.main()
