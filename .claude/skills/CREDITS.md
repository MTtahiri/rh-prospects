# Skills cabinet-*

Six skills pour tester et piloter l'activité du cabinet (placement CDI, régie
freelance, audit IA). Ordre conseillé :

```
cabinet-concurrents -> cabinet-panel -> cabinet-pricing -> cabinet-offre -> cabinet-cfo -> cabinet-plan
```

Les fichiers de travail vont dans `cabinet/` (exclu de git par `.gitignore` et
du déploiement par `.vercelignore`, car ils contiennent des chiffres
confidentiels).

Tests du calculateur :

```bash
python3 -m unittest discover -s .claude/skills/cabinet-cfo -p 'test_*.py'
```

## Origine

La méthode et la structure de ces skills sont adaptées (traduites et
réécrites pour un cabinet de recrutement) du pack « founder-skill » de Jake
Schincariol : https://github.com/Jakeschincariol/founder-skill. Le calculateur
`economie_cabinet.py` est une réécriture propre à ce projet, pas une copie du
code d'origine.

Notice de licence du projet d'origine :

```
MIT License

Copyright (c) 2026 Jake Schincariol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
