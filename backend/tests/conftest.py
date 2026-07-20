"""Configuration partagée des tests."""

import pytest

from app.core.rate_limit import limiter


@pytest.fixture(autouse=True, scope="session")
def _disable_rate_limit():
    """Désactive le rate limiting pendant les tests (sinon les inscriptions
    répétées épuisent la limite /auth/register et faussent les tests)."""
    limiter.enabled = False
    yield
    limiter.enabled = True
