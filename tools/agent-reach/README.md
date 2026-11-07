# Agent Reach : installation de test (LinkedIn public, sans connexion)

Projet : https://github.com/Panniantong/Agent-Reach (v1.6.1 testée le 2026-11-07).

> ⚠️ Le paquet PyPI nommé `agent-reach` n'est PAS ce projet. Installer uniquement depuis la release GitHub.

## Installation dans un environnement virtuel dédié

```bash
python3 -m venv venv-agent-reach
./venv-agent-reach/bin/pip install "https://github.com/Panniantong/Agent-Reach/releases/latest/download/agent-reach.zip"
```

Commande officielle du README (installation globale via uv, non utilisée ici) :

```bash
uv tool install https://github.com/Panniantong/Agent-Reach/releases/latest/download/agent-reach.zip
```

## Configuration sans compte LinkedIn

- Ne PAS lancer `agent-reach add linkedin` ni `agent-reach login linkedin` : ces commandes installent
  le navigateur dédié et peuvent reprendre la session LinkedIn de Chrome.
- Lancer l'outil avec un `HOME` isolé pour qu'aucune session de navigateur ne soit reprise :

```bash
mkdir -p ar-home
HOME=$PWD/ar-home ./venv-agent-reach/bin/agent-reach linkedin jobs "Chef de projet IT SAP" --location Paris --limit 3
```

- Le mode public passe par des services tiers sans clé : `mcp.exa.ai` (recherche) et `r.jina.ai` (lecture).

## Ce que l'outil couvre pour LinkedIn

- `linkedin jobs` : recherche d'offres publiques. Fonctionne.
- `linkedin read <URL /jobs/view/ID>` : lecture d'une offre. Peu fiable (redirections, mur de connexion).
- Profils (`/in/...`) : non supportés (l'outil répond `BAD_INPUT`).
