"""
Limiteur de débit (rate limiting) partagé.

Défini dans son propre module pour être importé à la fois par `main.py`
(enregistrement sur l'app + handler d'erreur) et par les routes
(décorateur `@limiter.limit(...)`) sans import circulaire.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# La clé de limitation est l'adresse IP du client.
limiter = Limiter(key_func=get_remote_address)
