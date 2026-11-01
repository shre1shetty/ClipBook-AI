import os, secrets
from fastapi import Header, HTTPException

def verify_internal_key(x_internal_key: str = Header(default="")):
    expected = os.getenv("INTERNAL_API_KEY", "")
    if not expected or not secrets.compare_digest(x_internal_key, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")