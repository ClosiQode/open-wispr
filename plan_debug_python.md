# Plan Debug Python ENOENT - Local Whisper

Statut: En cours

## Objectif
Corriger l’erreur Windows « Whisper process error: spawn python.exe ENOENT » lors de l’utilisation de Whisper local.

## À faire
- [ ] Tester sur Windows avec logs détaillés pour confirmer les chemins testés et l’état de PATH
- [ ] Vérifier la détection via le launcher Windows `py` si présent
- [ ] Valider l’exécution de toutes les commandes spawn quand `pythonCmd` contient des arguments (ex: `py -3`)
- [ ] Re-tester l’installation/check Whisper et FFmpeg

## En cours
- [x] Ajout de logs détaillés dans `findPythonExecutable` (chemins testés, PATH, erreurs)
- [x] Ajout d’un fallback Windows via Python Launcher (`py`, puis `py -3`)
- [x] Mise à jour de tous les `spawn(...)` pour supporter `pythonCmd` avec arguments

## Terminé
- [x] Extension des chemins Python Windows (LOCALAPPDATA/USERPROFILE, Program Files, Microsoft Store)
- [x] Message d’erreur FR amélioré quand Python 3.x introuvable
- [x] Vérification `asarUnpack` pour `whisper_bridge.py`
- [x] Vérification des options d’installation Python (PrependPath=1)