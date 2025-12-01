"""Generate a strong secret suitable for JWT_SECRET_KEY.
Example:
  python scripts/gen_secret.py
Copy the output into your `.env` as `JWT_SECRET_KEY=...`.
"""
import secrets
print(secrets.token_urlsafe(64))
