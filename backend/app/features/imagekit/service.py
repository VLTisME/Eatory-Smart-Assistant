"""Generate ImageKit authentication parameters (signature, token, expire).

ImageKit client-side uploads require an HMAC-SHA1 signature produced from:
    token + expire, signed with the private key.
"""

import hashlib
import hmac
import time
import uuid

from app.core.config import settings


def get_auth_parameters() -> dict:
    """Return a dict with ``token``, ``expire``, and ``signature``."""

    private_key = settings.kit_private_key
    if not private_key:
        raise ValueError("KIT_PRIVATE_KEY is not configured in .env")

    token = str(uuid.uuid4())
    expire = int(time.time()) + 600  # valid for 10 minutes

    # ImageKit expects: HMAC-SHA1(privateKey, token + expire)
    signature = hmac.new(
        private_key.encode("utf-8"),
        f"{token}{expire}".encode("utf-8"),
        hashlib.sha1,
    ).hexdigest()

    return {
        "token": token,
        "expire": expire,
        "signature": signature,
    }
